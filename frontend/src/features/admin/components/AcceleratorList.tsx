import { useState, useEffect, useRef } from 'react';
import '@/styles/features/admin/AcceleratorList.css';
import { acceleratorsService } from '@/api/services/accelerators.service';
import type { AcceleratorDetail, AcceleratorStatus } from '@/types/models/accelerator';

interface AcceleratorListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

const AcceleratorList = ({ onAddNew, onEdit }: AcceleratorListProps) => {
  const [accelerators, setAccelerators] = useState<AcceleratorDetail[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch accelerators on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchAccelerators();
  }, []);

  const fetchAccelerators = async () => {
    try {
      setError(null);
      const data = await acceleratorsService.getAll();
      setAccelerators(data);
    } catch (err) {
      console.error('Failed to fetch accelerators:', err);
      setError('Failed to load accelerators. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this accelerator?')) {
      try {
        await acceleratorsService.delete(id);
        // Refresh the list after deletion
        fetchAccelerators();
      } catch (err) {
        console.error('Failed to delete accelerator:', err);
        alert('Failed to delete accelerator. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: AcceleratorStatus) => {
    try {
      const newStatus: AcceleratorStatus = currentStatus === 'published' ? 'draft' : 'published';
      await acceleratorsService.update(id, { status: newStatus });
      // Refresh the list after update
      fetchAccelerators();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update status. Please try again.');
    }
  };


  if (error) {
    return (
      <div className="accelerator-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchAccelerators} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="accelerator-list">
      {/* Header */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Accelerators</h2>
          <span className="list-count">{accelerators.length} Total</span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Accelerator
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.length}</div>
            <div className="stat-label">Total Accelerators</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter(a => a.status === 'published').length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter(a => a.feature_on_homepage).length}</div>
            <div className="stat-label">Featured</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter(a => a.status === 'draft').length}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="accelerator-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accelerators.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No accelerators found. Click "Add New Accelerator" to create one.
                </td>
              </tr>
            ) : (
              accelerators.map((accelerator) => (
                <tr key={accelerator.id}>
                  <td>
                    <div className="title-cell">
                      {accelerator.title}
                      {accelerator.feature_on_homepage && <span className="featured-badge">Featured</span>}
                    </div>
                  </td>
                  <td>
                    <button 
                      className={`status-badge ${accelerator.status === 'published' ? 'published' : 'draft'}`}
                      onClick={() => handleToggleStatus(accelerator.id, accelerator.status)}
                      title="Click to toggle status"
                    >
                      {accelerator.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  
                  <td>{new Date(accelerator.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-button edit"
                        onClick={() => onEdit(accelerator.id)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleDelete(accelerator.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcceleratorList;
