/**
 * Access Requests Panel Component
 * Displays newsletter access requests and event resource requests for admin approval
 */

import { useState, useEffect } from 'react';
import { newsletterAccessService } from '@/api/services/newsletter-access.service';
import { eventResourceRequestService, type EventResourceRequest } from '@/api/services/eventResourceRequest.service';
import { NewsletterAccessRequest } from '@/types/newsletter-access';
import '@/styles/features/admin/AccessRequestsPanel.css';

interface AccessRequestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestHandled?: () => void;
}

type RequestTypeTab = 'newsletter' | 'event_resource';

export const AccessRequestsPanel = ({ isOpen, onClose, onRequestHandled }: AccessRequestsPanelProps) => {
  const [requestTypeTab, setRequestTypeTab] = useState<RequestTypeTab>('newsletter');
  const [requests, setRequests] = useState<NewsletterAccessRequest[]>([]);
  const [eventResourceRequests, setEventResourceRequests] = useState<EventResourceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (requestTypeTab === 'newsletter') {
        fetchNewsletterRequests();
      } else {
        fetchEventResourceRequests();
      }
    }
  }, [isOpen, requestTypeTab, activeTab, statusFilter]);

  const fetchNewsletterRequests = async () => {
    try {
      setLoading(true);
      let data: NewsletterAccessRequest[];
      if (activeTab === 'pending') {
        data = await newsletterAccessService.getPendingRequests();
      } else {
        data = await newsletterAccessService.getAllRequests(statusFilter || undefined);
      }
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch newsletter requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventResourceRequests = async () => {
    try {
      setLoading(true);
      let data: EventResourceRequest[];
      if (activeTab === 'pending') {
        data = await eventResourceRequestService.getPendingRequests();
      } else {
        data = await eventResourceRequestService.getAllRequests(statusFilter || undefined);
      }
      setEventResourceRequests(data);
    } catch (error) {
      console.error('Failed to fetch event resource requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = () => {
    if (requestTypeTab === 'newsletter') fetchNewsletterRequests();
    else fetchEventResourceRequests();
  };

  const handleNewsletterAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      setProcessingId(requestId);
      await newsletterAccessService.handleAction({ request_id: requestId, action, admin_note: undefined });
      await fetchRequests();
      if (onRequestHandled) onRequestHandled();
      alert(`Access request ${action === 'approve' ? 'approved' : 'denied'} successfully`);
    } catch (error: any) {
      alert(error.response?.data?.detail || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      setProcessingId(requestId);
      if (requestTypeTab === 'newsletter') {
        await newsletterAccessService.deleteRequest(requestId);
      } else {
        await eventResourceRequestService.delete(requestId);
      }
      await fetchRequests();
      if (onRequestHandled) onRequestHandled();
    } catch (error) {
      console.error('Failed to delete request:', error);
      alert('Failed to delete request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'Pending', className: 'status-pending' },
      approved: { text: 'Approved', className: 'status-approved' },
      denied: { text: 'Denied', className: 'status-denied' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>;
  };

  const extractDomain = (email: string) => {
    return email.split('@')[1] || email;
  };

  if (!isOpen) return null;

  const isEmpty = requestTypeTab === 'newsletter' ? requests.length === 0 : eventResourceRequests.length === 0;

  return (
    <>
      <div className="access-panel-overlay" onClick={onClose} />
      <div className="access-panel">
        <div className="access-panel-header">
          <div className="header-left">
            <span className="header-icon">📬</span>
            <h2>Access Requests</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="access-panel-tabs access-panel-tabs--type">
          <button
            className={`tab-button ${requestTypeTab === 'newsletter' ? 'active' : ''}`}
            onClick={() => { setRequestTypeTab('newsletter'); setActiveTab('pending'); setStatusFilter(''); }}
          >
            Newsletter
          </button>
          <button
            className={`tab-button ${requestTypeTab === 'event_resource' ? 'active' : ''}`}
            onClick={() => { setRequestTypeTab('event_resource'); setActiveTab('pending'); setStatusFilter(''); }}
          >
            Event resources
          </button>
        </div>

        <div className="access-panel-tabs">
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pending'); setStatusFilter(''); }}
          >
            Pending ({requestTypeTab === 'newsletter'
              ? requests.filter(r => r.status === 'pending').length
              : eventResourceRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Requests
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="filter-bar">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        )}

        <div className="access-panel-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading requests...</p>
            </div>
          ) : isEmpty ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>No Requests</h3>
              <p>
                {activeTab === 'pending'
                  ? 'No pending requests at the moment.'
                  : 'No requests found.'}
              </p>
            </div>
          ) : requestTypeTab === 'newsletter' ? (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div className="user-info">
                      <div className="user-email">{request.user_email}</div>
                      <div className="user-domain">@{extractDomain(request.user_email)}</div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="request-meta">
                    <span className="meta-item">
                      <span className="meta-label">Requested:</span>
                      <span className="meta-value">{formatDate(request.requested_at)}</span>
                    </span>
                    {request.resolved_at && (
                      <span className="meta-item">
                        <span className="meta-label">Resolved:</span>
                        <span className="meta-value">{formatDate(request.resolved_at)}</span>
                      </span>
                    )}
                  </div>
                  {request.admin_note && (
                    <div className="admin-note">
                      <span className="note-label">Note:</span>
                      <span className="note-text">{request.admin_note}</span>
                    </div>
                  )}
                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button className="action-button approve-button" onClick={() => handleNewsletterAction(request._id, 'approve')} disabled={processingId === request._id}>
                        {processingId === request._id ? '⏳' : '✅'} Approve
                      </button>
                      <button className="action-button deny-button" onClick={() => handleNewsletterAction(request._id, 'deny')} disabled={processingId === request._id}>
                        {processingId === request._id ? '⏳' : '❌'} Deny
                      </button>
                    </div>
                  )}
                  {request.status !== 'pending' && (
                    <div className="request-actions">
                      <button className="action-button delete-button" onClick={() => handleDelete(request._id)} disabled={processingId === request._id}>
                        {processingId === request._id ? '⏳' : '🗑️'} Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="requests-list">
              {eventResourceRequests.map((req) => (
                <div key={req._id} className="request-card">
                  <div className="request-header">
                    <div className="user-info">
                      {req.user_name && <div className="user-name">{req.user_name}</div>}
                      <div className="user-email">{req.user_email}</div>
                      {req.event_title && <div className="user-domain">Event: {req.event_title}</div>}
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="request-meta">
                    <span className="meta-item">
                      <span className="meta-label">Requested:</span>
                      <span className="meta-value">{formatDate(req.requested_at)}</span>
                    </span>
                    {req.resolved_at && (
                      <span className="meta-item">
                        <span className="meta-label">Resolved:</span>
                        <span className="meta-value">{formatDate(req.resolved_at)}</span>
                      </span>
                    )}
                  </div>
                  {req.admin_note && (
                    <div className="admin-note">
                      <span className="note-label">Note:</span>
                      <span className="note-text">{req.admin_note}</span>
                    </div>
                  )}
                  <div className="request-actions">
                    <button className="action-button delete-button" onClick={() => handleDelete(req._id)} disabled={processingId === req._id}>
                      {processingId === req._id ? '⏳' : '🗑️'} Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccessRequestsPanel;
