/**
 * Email Template List Component
 * 
 * Displays list of email templates for admin management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  getEmailTemplates,
  getEmailTemplate,
  deleteEmailTemplate,
  updateTemplateStatus,
  EmailTemplate,
} from '@/api/services/emailTemplates';
import { PreviewModal } from './PreviewModal';
import LeafLoader from '@/components/LeafLoader';
import '@/styles/features/admin/EmailTemplateList.css';

interface EmailTemplateListProps {
  onEdit: (id: string) => void;
  onUploadHTML: () => void;
}

export const EmailTemplateList = ({ onEdit, onUploadHTML }: EmailTemplateListProps) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading newsletters...');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const fetchInProgressRef = useRef(false);

  const fetchTemplates = useCallback(async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setLoadingMessage('Loading newsletters...');
      const response = await getEmailTemplates(
        0,
        100,
        categoryFilter || undefined,
        statusFilter || undefined
      );
      setTemplates(response.templates);
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [categoryFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setLoading(true);
      setLoadingMessage('Deleting newsletter...');
      await deleteEmailTemplate(id);
      showToast('Template deleted successfully', 'success');
      await fetchTemplates();
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to delete template', 'error');
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'active' | 'archived') => {
    try {
      setLoading(true);
      setLoadingMessage(`Updating status to ${newStatus}...`);
      await updateTemplateStatus(id, newStatus);
      showToast(`Template status updated to ${newStatus}`, 'success');
      await fetchTemplates();
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to update status', 'error');
      setLoading(false);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      setLoading(true);
      setLoadingMessage('Loading preview...');
      // Fetch full template with html_content
      const fullTemplate = await getEmailTemplate(template._id);
      setPreviewTemplate(fullTemplate);
      setShowPreviewModal(true);
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to load template for preview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge status-active';
      case 'draft': return 'status-badge status-draft';
      case 'archived': return 'status-badge status-archived';
      default: return 'status-badge';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'newsletter': return 'category-badge category-newsletter';
      case 'transactional': return 'category-badge category-transactional';
      case 'promotional': return 'category-badge category-promotional';
      case 'notification': return 'category-badge category-notification';
      default: return 'category-badge';
    }
  };

  if (loading) {
    return <LeafLoader message={loadingMessage} />;
  }

  return (
    <div className="email-template-list">
      {/* Header */}
      <div className="list-header">
        <div className="header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '42px' }}>📭</span>
            <h2 style={{ margin: 0 }}>Newsletters</h2>
          </div>
          <p className="subtitle">Manage Newsletters and Send Email</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={onUploadHTML}
            style={{ 
              padding: '0.875rem 1.75rem', 
              fontSize: '1.125rem',
              fontWeight: '600'
            }}
          >
            📤 Create Newsletter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="list-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="newsletter">Newsletter</option>
          <option value="transactional">Transactional</option>
          <option value="promotional">Promotional</option>
          <option value="notification">Notification</option>
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <button className="btn btn-outline" onClick={fetchTemplates}>
          🔄 Refresh
        </button>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No templates found</h3>
          <p>Get started by creating a new template or uploading an HTML file</p>
          <div className="empty-actions">
            <button 
              className="btn btn-primary" 
              onClick={onUploadHTML}
              style={{ 
                padding: '0.875rem 1.75rem', 
                fontSize: '1.125rem',
                fontWeight: '600'
              }}
            >
              📤 Create Newsletter
            </button>
          </div>
        </div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template._id} className="template-card">
              {/* Card Header */}
              <div className="card-header">
                <div className="card-badges">
                  <span className={getStatusBadgeClass(template.status)}>
                    {template.status}
                  </span>
                  <span className={getCategoryBadgeClass(template.category)}>
                    {template.category}
                  </span>
                </div>
                <div className="card-actions">
                  <select
                    className="status-select"
                    value={template.status}
                    onChange={(e) => handleStatusChange(template._id, e.target.value as 'draft' | 'active' | 'archived')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <h3 className="template-name">{template.name}</h3>
                {template.description && (
                  <p className="template-description">{template.description}</p>
                )}
                <div className="template-subject">
                  <strong>Subject:</strong> {template.subject}
                </div>
              </div>

              {/* Card Stats */}
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Sent:</span>
                  <span className="stat-value">{template.send_count}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Tests:</span>
                  <span className="stat-value">{template.test_send_count}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Version:</span>
                  <span className="stat-value">v{template.version}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Images:</span>
                  <span className="stat-value">{template.images?.length || 0}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="card-footer">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onEdit(template._id)}
                >
                  👁️ View/Send
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handlePreview(template)}
                >
                  👁️ Preview
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(template._id, template.name)}
                >
                  🗑️ Delete
                </button>
              </div>

              {/* Card Meta */}
              <div className="card-meta">
                <span className="meta-item">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </span>
                {template.last_sent_at && (
                  <span className="meta-item">
                    Last sent: {new Date(template.last_sent_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="list-summary">
        <p>Showing {filteredTemplates.length} of {templates.length} templates</p>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={previewTemplate ? `Newsletter Preview - ${previewTemplate.name}` : 'Newsletter Preview'}
        htmlContent={previewTemplate?.html_content || ''}
      />
    </div>
  );
};

export default EmailTemplateList;
