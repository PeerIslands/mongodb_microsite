import { useState, useEffect } from 'react';
import '@/styles/features/admin/CaseStudyForm.css';
import FileUpload, { FileUploadResult } from './FileUpload';
import { caseStudiesService } from '@/api/services/case-studies.service';

const INDUSTRY_OPTIONS = [
  'Healthcare',
  'Finance',
  'E-commerce',
  'Retail',
  'Manufacturing',
  'Technology',
  'Education',
  'Government',
  'Media',
  'Telecommunications',
  'Energy',
  'Transportation',
  'Real Estate',
  'Insurance',
  'Hospitality'
];

interface CaseStudyFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
  industryOptions?: string[];
}

interface MetricItem {
  label: string;
  value: string;
}

interface FileData {
  file: File | null;
  previewUrl: string;
}

const MIN_METRICS = 3;
const MAX_METRICS = 5;

const createEmptyMetric = (): MetricItem => ({ label: '', value: '' });

const CaseStudyForm = ({ 
  editingId, 
  onCancel, 
  onSuccess, 
  industryOptions = INDUSTRY_OPTIONS 
}: CaseStudyFormProps) => {
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    featured: false,
    status: 'draft' as 'published' | 'draft',
    industry: '',
    techStack: [] as string[],
    migrationType: '',
    
    // Client Background
    companyName: '',
    description: '',
    
    // Problem Statement
    challenges: '',
    
    // Solution & Architecture
    approach: '',
    
    // Value Delivered
    metrics: [createEmptyMetric(), createEmptyMetric(), createEmptyMetric()] as MetricItem[],
    businessOutcomes: '',
    testimonialQuote: '',
    testimonialAuthor: '',
    testimonialPosition: '',
  });

  // File data state (stores both File objects and preview URLs)
  const [fileData, setFileData] = useState({
    pdfFile: { file: null, previewUrl: '' } as FileData,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customTech, setCustomTech] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomIndustryInput, setShowCustomIndustryInput] = useState(false);

  // Fetch case study data when editing
  useEffect(() => {
    if (editingId) {
      fetchCaseStudyData(editingId);
    }
  }, [editingId]);

  const fetchCaseStudyData = async (id: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await caseStudiesService.getById(id);
      
      // Map API response (snake_case) to form data (camelCase)
      // The API response uses snake_case field names
      const apiData = data as any;
      
      // Parse metrics from API (ensure at least 3 metrics)
      let metricsFromApi: MetricItem[] = [];
      if (Array.isArray(apiData.metrics)) {
        metricsFromApi = apiData.metrics.map((m: any) => ({
          label: m.label || '',
          value: m.value || ''
        }));
      }
      // Ensure minimum 3 metrics
      while (metricsFromApi.length < MIN_METRICS) {
        metricsFromApi.push(createEmptyMetric());
      }
      
      // Parse industry - get single value
      let industryFromApi = '';
      if (Array.isArray(apiData.industry) && apiData.industry.length > 0) {
        industryFromApi = apiData.industry[0];
      } else if (typeof apiData.industry === 'string') {
        industryFromApi = apiData.industry;
      }
      
      setFormData({
        title: apiData.title || '',
        featured: apiData.featured || false,
        status: apiData.status || 'draft',
        industry: industryFromApi,
        techStack: apiData.tech_stack || [],
        migrationType: apiData.migration_type || '',
        companyName: apiData.company_name || '',
        description: apiData.description || '',
        challenges: apiData.challenges || '',
        approach: apiData.approach || '',
        metrics: metricsFromApi,
        businessOutcomes: apiData.business_outcomes || '',
        testimonialQuote: apiData.testimonial_quote || '',
        testimonialAuthor: apiData.testimonial_author || '',
        testimonialPosition: apiData.testimonial_position || '',
      });

      // Set file preview URLs for existing files
      setFileData({
        pdfFile: { 
          file: null, 
          previewUrl: apiData.pdf_url || '' 
        },
      });

      // Check if industry is custom (not in predefined options)
      if (industryFromApi && !industryOptions.includes(industryFromApi)) {
        setCustomIndustry(industryFromApi);
        setShowCustomIndustryInput(true);
      }
    } catch (err) {
      console.error('Failed to fetch case study:', err);
      setErrorMessage('Failed to load case study data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tech Stack handlers
  const handleAddCustomTech = () => {
    const trimmedTech = customTech.trim();
    if (trimmedTech && !formData.techStack.includes(trimmedTech)) {
      handleInputChange('techStack', [...formData.techStack, trimmedTech]);
      setCustomTech('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    handleInputChange('techStack', formData.techStack.filter(t => t !== tech));
  };

  // Industry handlers (single value)
  const handleIndustrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndustry = e.target.value;
    if (selectedIndustry === '__custom__') {
      setShowCustomIndustryInput(true);
      handleInputChange('industry', '');
    } else {
      setShowCustomIndustryInput(false);
      setCustomIndustry('');
      handleInputChange('industry', selectedIndustry);
    }
  };

  const handleCustomIndustryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomIndustry(value);
    handleInputChange('industry', value);
  };

  const handleClearCustomIndustry = () => {
    setShowCustomIndustryInput(false);
    setCustomIndustry('');
    handleInputChange('industry', '');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Metrics handlers
  const handleMetricChange = (index: number, field: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) => 
        i === index ? { ...metric, [field]: value } : metric
      )
    }));
  };

  const handleAddMetric = () => {
    if (formData.metrics.length < MAX_METRICS) {
      setFormData(prev => ({
        ...prev,
        metrics: [...prev.metrics, createEmptyMetric()]
      }));
    }
  };

  const handleRemoveMetric = (index: number) => {
    if (formData.metrics.length > MIN_METRICS) {
      setFormData(prev => ({
        ...prev,
        metrics: prev.metrics.filter((_, i) => i !== index)
      }));
    }
  };

  // Validate metrics - all must have both label and value filled
  const areMetricsValid = () => {
    return formData.metrics.length >= MIN_METRICS && 
           formData.metrics.slice(0, MIN_METRICS).every(m => m.label.trim() && m.value.trim());
  };

  // Handle file upload changes
  const handleFileChange = (field: keyof typeof fileData, result: FileUploadResult | FileUploadResult[]) => {
    if (Array.isArray(result)) {
      // For multiple files (not used in this form currently)
      return;
    }
    setFileData(prev => ({
      ...prev,
      [field]: result
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    // Validate metrics
    if (!areMetricsValid()) {
      setErrorMessage(`Please fill in at least ${MIN_METRICS} metrics with both label and value.`);
      return;
    }
    
    // Validate industry
    if (!formData.industry.trim()) {
      setErrorMessage('Please select or enter an industry.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Build FormData for multipart/form-data request
      const submitData = new FormData();

      // Generate slug from title: lowercase, replace spaces with hyphens, remove special chars
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replaceAll(/\s+/g, '-') // Replace spaces with hyphens
        .replaceAll(/-+/g, '-'); // Remove consecutive hyphens

      // Add text fields (converting to snake_case for API)
      submitData.append('title', formData.title);
      submitData.append('slug', slug);
      submitData.append('featured', String(formData.featured));
      submitData.append('status', formData.status);
      submitData.append('industry', formData.industry);
      submitData.append('tech_stack', JSON.stringify(formData.techStack));
      submitData.append('migration_type', formData.migrationType || '');
      submitData.append('company_name', formData.companyName);
      submitData.append('description', formData.description);
      submitData.append('challenges', formData.challenges);
      submitData.append('approach', formData.approach);
      submitData.append('business_outcomes', formData.businessOutcomes);
      submitData.append('testimonial_quote', formData.testimonialQuote || '');
      submitData.append('testimonial_author', formData.testimonialAuthor || '');
      submitData.append('testimonial_position', formData.testimonialPosition || '');

      // Add metrics as JSON array (filter out empty metrics)
      const validMetrics = formData.metrics.filter(m => m.label.trim() && m.value.trim());
      submitData.append('metrics', JSON.stringify(validMetrics));

      // Add file fields (only if file exists)
      if (fileData.pdfFile.file) {
        submitData.append('pdf_file', fileData.pdfFile.file);
      }

      if (editingId) {
        // Update existing case study
        await caseStudiesService.update(editingId, submitData);
      } else {
        // Create new case study
        await caseStudiesService.create(submitData);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
      const message = error?.response?.data?.detail || error?.message || 'An error occurred while saving the case study.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state when fetching case study data for editing
  if (isLoading) {
    return (
      <div className="case-study-form-container">
        <div className="form-header">
          <h2 className="form-title">Edit Case Study</h2>
          <button className="cancel-button" onClick={onCancel}>
            ← Back to List
          </button>
        </div>
        <div className="form-loading-state">
          <div className="loading-spinner"></div>
          <p>Loading case study data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="case-study-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {editingId ? 'Edit Case Study' : 'Add New Case Study'}
        </h2>
        <button className="cancel-button" onClick={onCancel}>
          ← Back to List
        </button>
      </div>

      <form className="case-study-form" onSubmit={handleSubmit}>
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
                placeholder="Enter case study title"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Client company name"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief company/project overview"
                rows={3}
              />
            </div>

            <div className="form-field full-width">
              <label>Industry *</label>
              {showCustomIndustryInput ? (
                <div className="industry-custom-input">
                  <input
                    type="text"
                    value={customIndustry}
                    onChange={handleCustomIndustryChange}
                    placeholder="Enter custom industry"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="industry-back-btn"
                    onClick={handleClearCustomIndustry}
                  >
                    ← Back to list
                  </button>
                </div>
              ) : (
                <select
                  value={formData.industry}
                  onChange={handleIndustrySelect}
                >
                  <option value="" disabled>Select Industry</option>
                  {INDUSTRY_OPTIONS.sort((a, b) => a.localeCompare(b)).map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                  <option value="__custom__">Other</option>
                </select>
              )}
            </div>

            <div className="form-field full-width">
              <label>Tech Stack</label>
              <div className="tech-stack-selector">
                <div className="tech-input-only">
                  <input
                    type="text"
                    value={customTech}
                    onChange={(e) => setCustomTech(e.target.value)}
                    placeholder="Enter technology and press Enter or click Add"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTech();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="add-tech-button"
                    onClick={handleAddCustomTech}
                    disabled={!customTech.trim()}
                  >
                    Add
                  </button>
                </div>
                {formData.techStack.length > 0 && (
                  <div className="tech-stack-tags">
                    {formData.techStack.map(tech => (
                      <span key={tech} className="tech-tag">
                        {tech}
                        <button
                          type="button"
                          className="tech-tag-remove"
                          onClick={() => handleRemoveTech(tech)}
                          aria-label={`Remove ${tech}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field full-width">
              <label>Migration Type</label>
              <input
                type="text"
                value={formData.migrationType}
                onChange={(e) => handleInputChange('migrationType', e.target.value)}
                placeholder="Enter migration type (e.g., SQL to MongoDB, Cloud Migration)"
              />
            </div>

            <div className="form-field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                />
                <span>Featured on Homepage</span>
              </label>
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'published' | 'draft')}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Case Study Details */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">2</span>
            Case Study Details
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Challenges</label>
              <textarea
                value={formData.challenges}
                onChange={(e) => handleInputChange('challenges', e.target.value)}
                placeholder="Describe the challenges faced"
                rows={4}
              />
            </div>

            <div className="form-field full-width">
              <label>Approach</label>
              <textarea
                value={formData.approach}
                onChange={(e) => handleInputChange('approach', e.target.value)}
                placeholder="Describe the solution approach"
                rows={4}
              />
            </div>

            <div className="form-field full-width">
              <label>Metrics * (Minimum {MIN_METRICS}, Maximum {MAX_METRICS})</label>
              <div className="metrics-builder">
                {formData.metrics.map((metric, index) => (
                  <div key={index} className="metric-row dynamic-metric">
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => handleMetricChange(index, 'label', e.target.value)}
                      placeholder="Metric label (e.g., Time Reduction)"
                      className="metric-label-input"
                    />
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => handleMetricChange(index, 'value', e.target.value)}
                      placeholder="Value (e.g., 50% faster)"
                      className="metric-value-input"
                    />
                    {formData.metrics.length > MIN_METRICS && (
                      <button
                        type="button"
                        className="metric-remove-btn"
                        onClick={() => handleRemoveMetric(index)}
                        aria-label="Remove metric"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {formData.metrics.length < MAX_METRICS && (
                  <button
                    type="button"
                    className="add-metric-btn"
                    onClick={handleAddMetric}
                  >
                    Add Metric
                  </button>
                )}
                {!areMetricsValid() && (
                  <p className="validation-hint">Please fill in at least {MIN_METRICS} metrics with both label and value</p>
                )}
              </div>
            </div>

            <div className="form-field full-width">
              <label>Business Outcomes (Separate with ' | ' for bullets)</label>
              <textarea
                value={formData.businessOutcomes}
                onChange={(e) => handleInputChange('businessOutcomes', e.target.value)}
                placeholder="Describe the business outcomes achieved"
                rows={4}
              />
            </div>

            <div className="form-field full-width">
              <label>Testimonial Quote (Optional)</label>
              <textarea
                value={formData.testimonialQuote}
                onChange={(e) => handleInputChange('testimonialQuote', e.target.value)}
                placeholder="Client testimonial quote"
                rows={4}
              />
            </div>

            <div className="form-field">
              <label>Testimonial Author</label>
              <input
                type="text"
                value={formData.testimonialAuthor}
                onChange={(e) => handleInputChange('testimonialAuthor', e.target.value)}
                placeholder="Person's name"
              />
            </div>

            <div className="form-field">
              <label>Author Position</label>
              <input
                type="text"
                value={formData.testimonialPosition}
                onChange={(e) => handleInputChange('testimonialPosition', e.target.value)}
                placeholder="Job title"
              />
            </div>
          </div>
        </div>

        {/* Section 3: PDF Document */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">3</span>
            PDF Document
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Case Study PDF</label>
              <FileUpload
                accept="application/pdf"
                maxSize={10}
                onUpload={(result) => handleFileChange('pdfFile', result)}
                currentFile={fileData.pdfFile.previewUrl}
                hint="PDF only (Max 10MB)"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="form-error-message">
            
            <span>⚠️ &nbsp; {errorMessage}</span>
            <button 
              type="button" 
              className="error-dismiss" 
              onClick={() => setErrorMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editingId ? 'Update Case Study' : 'Create Case Study')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseStudyForm;

