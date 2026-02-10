import { useState, useEffect, useRef } from 'react';
import '@/styles/features/admin/TestimonialList.css';
import { testimonialsService } from '@/api/services/testimonials.service';
import type { TestimonialDetail, TestimonialStatus } from '@/types/models/testimonial';

interface TestimonialListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
  onLoadComplete?: () => void;
}

const TestimonialList = ({ onAddNew, onEdit, onLoadComplete }: TestimonialListProps) => {
  const [testimonials, setTestimonials] = useState<TestimonialDetail[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch testimonials on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setError(null);
      const data = await testimonialsService.getAll();
      setTestimonials(data);
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
      setError('Failed to load testimonials. Please try again.');
    } finally {
      onLoadComplete?.();
    }
  };

  const handleDelete = async (id: string) => {
    if (globalThis.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await testimonialsService.delete(id);
        // Refresh the list after deletion
        fetchTestimonials();
      } catch (err) {
        console.error('Failed to delete testimonial:', err);
        globalThis.alert('Failed to delete testimonial. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: TestimonialStatus) => {
    try {
      const newStatus: TestimonialStatus = currentStatus === 'published' ? 'draft' : 'published';
      await testimonialsService.update(id, { status: newStatus });
      // Refresh the list after update
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      globalThis.alert('Failed to update status. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="testimonial-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchTestimonials} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="testimonial-list">
      {/* Header */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Testimonials</h2>
          <span className="list-count">
            {testimonials.length}
            {' '}
            Total
          </span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          {' '}
          Add New Testimonial
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">{testimonials.length}</div>
            <div className="stat-label">Total Testimonials</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{testimonials.filter(t => t.status === 'published').length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{testimonials.filter(t => t.status === 'draft').length}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">{new Set(testimonials.map(t => t.company_name)).size}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="testimonial-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Author</th>
              <th>Position</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No testimonials found. Click "Add New Testimonial" to create one.
                </td>
              </tr>
            ) : (
              testimonials.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td>
                    <div className="company-cell">
                      {testimonial.company_name}
                    </div>
                  </td>
                  <td>{testimonial.testimonial_author}</td>
                  <td>{testimonial.testimonial_position}</td>
                  <td>
                    <button 
                      className={`status-badge ${testimonial.status === 'published' ? 'published' : 'draft'}`}
                      onClick={() => handleToggleStatus(testimonial.id, testimonial.status)}
                      title="Click to toggle status"
                    >
                      {testimonial.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>{new Date(testimonial.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-button edit"
                        onClick={() => onEdit(testimonial.id)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleDelete(testimonial.id)}
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

export default TestimonialList;
