/**
 * Access Requests Panel Component
 * Displays pending newsletter access requests for admin approval
 */

import { useState, useEffect } from 'react';
import { newsletterAccessService } from '@/api/services/newsletter-access.service';
import { NewsletterAccessRequest } from '@/types/newsletter-access';
import '@/styles/features/admin/AccessRequestsPanel.css';

interface AccessRequestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestHandled?: () => void;
}

export const AccessRequestsPanel = ({ isOpen, onClose, onRequestHandled }: AccessRequestsPanelProps) => {
  const [requests, setRequests] = useState<NewsletterAccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, activeTab, statusFilter]);

  const fetchRequests = async () => {
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
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      setProcessingId(requestId);
      
      await newsletterAccessService.handleAction({
        request_id: requestId,
        action,
        admin_note: undefined
      });
      
      // Refresh the list
      await fetchRequests();
      
      // Notify parent to update count
      if (onRequestHandled) {
        onRequestHandled();
      }
      
      alert(`Access request ${action === 'approve' ? 'approved' : 'denied'} successfully`);
    } catch (error: any) {
      console.error('Failed to handle request:', error);
      alert(error.response?.data?.detail || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }
    
    try {
      setProcessingId(requestId);
      await newsletterAccessService.deleteRequest(requestId);
      await fetchRequests();
      
      if (onRequestHandled) {
        onRequestHandled();
      }
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

  return (
    <>
      <div className="access-panel-overlay" onClick={onClose} />
      <div className="access-panel">
        <div className="access-panel-header">
          <div className="header-left">
            <span className="header-icon">📬</span>
            <h2>Newsletter Access Requests</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="access-panel-tabs">
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pending');
              setStatusFilter('');
            }}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
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
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>No Requests</h3>
              <p>
                {activeTab === 'pending'
                  ? 'No pending access requests at the moment.'
                  : 'No access requests found.'}
              </p>
            </div>
          ) : (
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
                      <button
                        className="action-button approve-button"
                        onClick={() => handleAction(request._id, 'approve')}
                        disabled={processingId === request._id}
                      >
                        {processingId === request._id ? '⏳' : '✅'} Approve
                      </button>
                      <button
                        className="action-button deny-button"
                        onClick={() => handleAction(request._id, 'deny')}
                        disabled={processingId === request._id}
                      >
                        {processingId === request._id ? '⏳' : '❌'} Deny
                      </button>
                    </div>
                  )}

                  {request.status !== 'pending' && (
                    <div className="request-actions">
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDelete(request._id)}
                        disabled={processingId === request._id}
                      >
                        {processingId === request._id ? '⏳' : '🗑️'} Delete
                      </button>
                    </div>
                  )}
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
