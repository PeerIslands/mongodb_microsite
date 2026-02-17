import { useState, useEffect } from 'react';
import '@/styles/features/admin/AcceleratorForm.css';
import FileUpload, { FileUploadResult } from './FileUpload';
import RichTextEditor from './RichTextEditor';
import { acceleratorsService } from '@/api/services/accelerators.service';
import type { MetricItem, AcceleratorStatus, CreateAcceleratorDto, UpdateAcceleratorDto } from '@/types/models/accelerator';

interface AcceleratorFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  status: AcceleratorStatus;
  feature_on_homepage: boolean;
  metrics: MetricItem[];
  thumbnail_file: File | null;
  video_file: File | null;
  pdf_file: File | null;
  // For displaying existing file previews in edit mode
  existing_thumbnail_url: string;
  existing_video_url: string;
  existing_pdf_url: string;
}

const MIN_METRICS = 3;
const MAX_METRICS = 5;

const AcceleratorForm = ({ editingId, onCancel, onSuccess }: AcceleratorFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    status: 'draft',
    feature_on_homepage: false,
    metrics: [
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
    ],
    thumbnail_file: null,
    video_file: null,
    pdf_file: null,
    existing_thumbnail_url: '',
    existing_video_url: '',
    existing_pdf_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track initial file URLs (to detect if user removed existing files)
  const [initialThumbnailUrl, setInitialThumbnailUrl] = useState<string>('');
  const [initialVideoUrl, setInitialVideoUrl] = useState<string>('');
  const [initialPdfUrl, setInitialPdfUrl] = useState<string>('');

  // Fetch existing accelerator data when editing
  useEffect(() => {
    if (editingId) {
      const fetchAccelerator = async () => {
        try {
          const data = await acceleratorsService.getById(editingId);
          setFormData({
            title: data.title || '',
            subtitle: data.subtitle || '',
            description: data.description || '',
            status: data.status || 'draft',
            feature_on_homepage: data.feature_on_homepage || false,
            metrics: data.metrics && data.metrics.length >= MIN_METRICS 
              ? data.metrics 
              : [
                  ...data.metrics || [],
                  ...Array(MIN_METRICS - (data.metrics?.length || 0)).fill({ label: '', value: '' })
                ],
            thumbnail_file: null,
            video_file: null,
            pdf_file: null,
            existing_thumbnail_url: data.thumbnail_url || '',
            existing_video_url: data.video_url || '',
            existing_pdf_url: data.pdf_url || '',
          });

          // Store initial file URLs to detect removal
          setInitialThumbnailUrl(data.thumbnail_url || '');
          setInitialVideoUrl(data.video_url || '');
          setInitialPdfUrl(data.pdf_url || '');
        } catch (err) {
          console.error('Failed to fetch accelerator:', err);
          setError('Failed to load accelerator data');
        }
      };
      fetchAccelerator();
    }
  }, [editingId]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMetricChange = (index: number, field: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) =>
        i === index ? { ...metric, [field]: value } : metric
      ),
    }));
  };

  const handleAddMetric = () => {
    if (formData.metrics.length < MAX_METRICS) {
      setFormData(prev => ({
        ...prev,
        metrics: [...prev.metrics, { label: '', value: '' }],
      }));
    }
  };

  const handleRemoveMetric = (index: number) => {
    if (formData.metrics.length > MIN_METRICS) {
      setFormData(prev => ({
        ...prev,
        metrics: prev.metrics.filter((_, i) => i !== index),
      }));
    }
  };

  const handleFileUpload = (field: 'thumbnail_file' | 'video_file' | 'pdf_file', result: FileUploadResult | FileUploadResult[]) => {
    if (Array.isArray(result)) {
      // Should not happen for single file uploads, but handle it
      if (result.length > 0) {
        setFormData(prev => ({ ...prev, [field]: result[0].file }));
      }
    } else {
      // Update the file field
      const updates: any = { [field]: result.file };
      
      // If file is being removed (null), also clear the existing preview URL
      if (result.file === null) {
        if (field === 'thumbnail_file') {
          updates.existing_thumbnail_url = '';
        } else if (field === 'video_file') {
          updates.existing_video_url = '';
        } else if (field === 'pdf_file') {
          updates.existing_pdf_url = '';
        }
      }
      
      setFormData(prev => ({ ...prev, ...updates }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.subtitle.trim()) {
      setError('Subtitle is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    // Validate metrics
    const filledMetrics = formData.metrics.filter(m => m.label.trim() && m.value.trim());
    if (filledMetrics.length < MIN_METRICS) {
      setError(`At least ${MIN_METRICS} complete metrics are required (both label and value)`);
      return false;
    }

    // Check for metrics with only label or only value
    const incompleteMetrics = formData.metrics.filter(
      m => (m.label.trim() && !m.value.trim()) || (!m.label.trim() && m.value.trim())
    );
    if (incompleteMetrics.length > 0) {
      setError('Each metric must have both a label and a value');
      return false;
    }

    // PDF is required for both new and existing accelerators
    // For new accelerators, must have uploaded a file
    // For existing accelerators, must have either existing file or uploaded new file
    if (!editingId) {
      if (!formData.pdf_file) {
        setError('PDF file is required');
        return false;
      }
    } else {
      // For editing, ensure PDF exists (either existing or newly uploaded)
      if (!formData.pdf_file && !formData.existing_pdf_url) {
        setError('PDF file is required. Please upload a PDF file.');
        return false;
      }
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
      // Filter out empty metrics
      const validMetrics = formData.metrics.filter(m => m.label.trim() && m.value.trim());

      if (editingId) {
        // Update existing accelerator
        const updateData: UpdateAcceleratorDto = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          status: formData.status,
          feature_on_homepage: formData.feature_on_homepage,
          metrics: validMetrics,
        };

        // Handle file uploads and deletions

        if (formData.thumbnail_file) {
          // User is uploading a new thumbnail
          updateData.thumbnail_file = formData.thumbnail_file;
        } else if (initialThumbnailUrl && !formData.existing_thumbnail_url) {
          // User removed an existing thumbnail (was there before, now it's gone)
          
          updateData.delete_thumbnail = true;
        }

        if (formData.video_file) {
          // User is uploading a new video
          updateData.video_file = formData.video_file;
        } else if (initialVideoUrl && !formData.existing_video_url) {
          // User removed an existing video (was there before, now it's gone)
          updateData.delete_video = true;
        }

        if (formData.pdf_file) {
          // User is uploading a new PDF
          updateData.pdf_file = formData.pdf_file;
        } else if (initialPdfUrl && !formData.existing_pdf_url) {
          // User removed an existing PDF (was there before, now it's gone)
          updateData.delete_pdf = true;
        }


        await acceleratorsService.update(editingId, updateData);
      } else {
        // Create new accelerator
        const createData: CreateAcceleratorDto = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          status: formData.status,
          feature_on_homepage: formData.feature_on_homepage,
          metrics: validMetrics,
          pdf_file: formData.pdf_file!,
        };

        // Only include optional files if provided
        if (formData.thumbnail_file) {
          createData.thumbnail_file = formData.thumbnail_file;
        }
        if (formData.video_file) {
          createData.video_file = formData.video_file;
        }

        await acceleratorsService.create(createData);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save accelerator:', err);
      setError('Failed to save accelerator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accelerator-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {editingId ? 'Edit Accelerator' : 'Add New Accelerator'}
        </h2>
        <button type="button" className="cancel-button" onClick={onCancel}>
          ← Back to List
        </button>
      </div>

      

      <form className="accelerator-form" onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">1</span>
            Basic Information
          </h3>

          <div className="form-grid">
            <div className="form-field full-width">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter accelerator title"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Subtitle *</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Enter accelerator subtitle"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Description *</label>
              <RichTextEditor
                value={formData.description}
                onChange={(markdown) => handleInputChange('description', markdown)}
                placeholder="Enter accelerator description"
                height="240px"
              />
            </div>

            <div className="form-field">
              <label>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as AcceleratorStatus)}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="form-field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.feature_on_homepage}
                  onChange={(e) => handleInputChange('feature_on_homepage', e.target.checked)}
                />
                <span>Feature on Homepage</span>
              </label>
            </div>

            {/* Metrics Section */}
            <div className="form-field full-width">
              <label>Metrics * (Min {MIN_METRICS}, Max {MAX_METRICS})</label>
              <div className="metrics-builder">
                {formData.metrics.map((metric, index) => (
                  <div key={index} className="metric-row">
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => handleMetricChange(index, 'label', e.target.value)}
                      placeholder="Label (e.g., Speed)"
                      className="metric-label-input"
                    />
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => handleMetricChange(index, 'value', e.target.value)}
                      placeholder="Value (e.g., 10x faster)"
                      className="metric-value-input"
                    />
                    {formData.metrics.length > MIN_METRICS && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleRemoveMetric(index)}
                        title="Remove metric"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {formData.metrics.length < MAX_METRICS && (
                  <button
                    type="button"
                    className="add-item-button"
                    onClick={handleAddMetric}
                  >
                    + Add Metric
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Media Upload */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">2</span>
            Media Upload
          </h3>

          <div className="form-grid">
            <div className="form-field full-width">
              <label>PDF Document * (.pdf)</label>
              <FileUpload
                accept="application/pdf"
                maxSize={20}
                onUpload={(result) => handleFileUpload('pdf_file', result)}
                currentFile={formData.existing_pdf_url || undefined}
                hint="Required - Max 20MB"
              />
            </div>

            <div className="form-field full-width">
              <label>Thumbnail Image (Optional) (.jpeg, .png)</label>
              <FileUpload
                accept="image/jpeg,image/png"
                maxSize={5}
                onUpload={(result) => handleFileUpload('thumbnail_file', result)}
                currentFile={formData.existing_thumbnail_url || undefined}
                hint="Max 5MB. Recommended size: 600x400px"
              />
            </div>

            <div className="form-field full-width">
              <label>Video (Optional) (.mp4, .mov)</label>
              <FileUpload
                accept="video/mp4,video/quicktime"
                maxSize={100}
                onUpload={(result) => handleFileUpload('video_file', result)}
                currentFile={formData.existing_video_url || undefined}
                hint="Max 100MB. Supported formats: MP4, MOV"
              />
            </div>
          </div>
        </div>

        {error && (
        <div className="form-error">
          <span className="error-icon">⚠️</span>
          {error}
          <button type="button" className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                {editingId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingId ? 'Update Accelerator' : 'Create Accelerator'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AcceleratorForm;
