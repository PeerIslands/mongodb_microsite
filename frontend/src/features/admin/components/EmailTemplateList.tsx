/**
 * Email Template List Component
 * 
 * Displays list of email templates for admin management
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  getEmailTemplates,
  deleteEmailTemplate,
  duplicateTemplate,
  updateTemplateStatus,
  EmailTemplate,
} from '@/api/services/emailTemplates';
import '@/styles/features/admin/EmailTemplateList.css';

interface EmailTemplateListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
  onUploadHTML: () => void;
}

export const EmailTemplateList = ({ onAddNew, onEdit, onUploadHTML }: EmailTemplateListProps) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter, statusFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getEmailTemplates(
        0,
        100,
        categoryFilter || undefined,
        statusFilter || undefined
      );
      setTemplates(response.templates);
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteEmailTemplate(id);
      showToast('Template deleted successfully', 'success');
      fetchTemplates();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to delete template', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTemplate(id);
      showToast('Template duplicated successfully', 'success');
      fetchTemplates();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to duplicate template', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'active' | 'archived') => {
    try {
      await updateTemplateStatus(id, newStatus);
      showToast(`Template status updated to ${newStatus}`, 'success');
      fetchTemplates();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update status', 'error');
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
    return (
      <div className="email-template-list">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-template-list">
      {/* Header */}
      <div className="list-header">
        <div className="header-left">
          <h2>📧 Email Templates</h2>
          <p className="subtitle">Manage newsletter and email templates</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onUploadHTML}>
            📤 Upload HTML
          </button>
          <button className="btn btn-primary" onClick={onAddNew}>
            ➕ Create New Template
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
            <button className="btn btn-primary" onClick={onAddNew}>
              Create Template
            </button>
            <button className="btn btn-secondary" onClick={onUploadHTML}>
              Upload HTML
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
                    onChange={(e) => handleStatusChange(template._id, e.target.value as any)}
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
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleDuplicate(template._id)}
                >
                  📋 Duplicate
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
    </div>
  );
};

export default EmailTemplateList;
