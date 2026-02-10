import { useState, useEffect } from 'react';
import '@/styles/features/admin/TestimonialForm.css';
import { testimonialsService } from '@/api/services/testimonials.service';
import type { TestimonialStatus, CreateTestimonialDto, UpdateTestimonialDto } from '@/types/models/testimonial';

interface TestimonialFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  company_name: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_position: string;
  status: TestimonialStatus;
}

const TestimonialForm = ({ editingId, onCancel, onSuccess }: TestimonialFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    testimonial_quote: '',
    testimonial_author: '',
    testimonial_position: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing testimonial data when editing
  useEffect(() => {
    if (editingId) {
      const fetchTestimonial = async () => {
        try {
          const data = await testimonialsService.getById(editingId);
          setFormData({
            company_name: data.company_name || '',
            testimonial_quote: data.testimonial_quote || '',
            testimonial_author: data.testimonial_author || '',
            testimonial_position: data.testimonial_position || '',
            status: data.status || 'draft',
          });
        } catch (err) {
          console.error('Failed to fetch testimonial:', err);
          setError('Failed to load testimonial data');
        }
      };
      fetchTestimonial();
    }
  }, [editingId]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.testimonial_quote.trim()) {
      setError('Testimonial quote is required');
      return false;
    }
    if (!formData.testimonial_author.trim()) {
      setError('Author name is required');
      return false;
    }
    if (!formData.testimonial_position.trim()) {
      setError('Author position is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        // Update existing testimonial
        const updateData: UpdateTestimonialDto = {
          company_name: formData.company_name,
          testimonial_quote: formData.testimonial_quote,
          testimonial_author: formData.testimonial_author,
          testimonial_position: formData.testimonial_position,
          status: formData.status,
        };

        await testimonialsService.update(editingId, updateData);
      } else {
        // Create new testimonial
        const createData: CreateTestimonialDto = {
          company_name: formData.company_name,
          testimonial_quote: formData.testimonial_quote,
          testimonial_author: formData.testimonial_author,
          testimonial_position: formData.testimonial_position,
          status: formData.status,
        };

        await testimonialsService.create(createData);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save testimonial:', err);
      setError('Failed to save testimonial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="testimonial-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
        </h2>
        <button type="button" className="cancel-button" onClick={onCancel}>
          ← Back to List
        </button>
      </div>

      <form className="testimonial-form" onSubmit={handleSubmit}>
        {/* Section 1: Testimonial Information */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">1</span>
            {' '}
            Testimonial Information
          </h3>

          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="company-name">Company Name *</label>
              <input
                id="company-name"
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="testimonial-quote">Testimonial Quote *</label>
              <textarea
                id="testimonial-quote"
                value={formData.testimonial_quote}
                onChange={(e) => handleInputChange('testimonial_quote', e.target.value)}
                placeholder="Enter testimonial quote"
                rows={6}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="author-name">Author Name *</label>
              <input
                id="author-name"
                type="text"
                value={formData.testimonial_author}
                onChange={(e) => handleInputChange('testimonial_author', e.target.value)}
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="author-position">Author Position *</label>
              <input
                id="author-position"
                type="text"
                value={formData.testimonial_position}
                onChange={(e) => handleInputChange('testimonial_position', e.target.value)}
                placeholder="Enter author position/title"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as TestimonialStatus)}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            {' '}
            {error}
            <button type="button" className="error-close" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading && <span className="btn-spinner"></span>}
            {loading && editingId && 'Updating...'}
            {loading && !editingId && 'Creating...'}
            {!loading && editingId && 'Update Testimonial'}
            {!loading && !editingId && 'Create Testimonial'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestimonialForm;
