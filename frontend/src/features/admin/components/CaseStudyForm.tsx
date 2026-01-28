import { useState, useEffect, useCallback } from 'react';
import '@/styles/features/admin/CaseStudyForm.css';
import FileUpload, { FileUploadResult } from './FileUpload';
import RichTextEditor from './RichTextEditor';
import { caseStudiesService } from '@/api/services/case-studies.service';
import { aiExtractService } from '@/api/services/ai-extract.service';

const INDUSTRY_OPTIONS = [
  'Healthcare',
  'Finance',
  'Banking',
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
  
  // AI Extraction states
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const [customTech, setCustomTech] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomIndustryInput, setShowCustomIndustryInput] = useState(false);

  const fetchCaseStudyData = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await caseStudiesService.getById(id);
      
      // Parse metrics from API response (ensure at least MIN_METRICS)
      const metricsFromApi: MetricItem[] = Array.isArray(data.metrics)
        ? data.metrics.map((m) => ({ label: m.label || '', value: m.value || '' }))
        : [];
      while (metricsFromApi.length < MIN_METRICS) {
        metricsFromApi.push(createEmptyMetric());
      }
      
      // Map snake_case API response to camelCase form data
      setFormData({
        title: data.title || '',
        featured: data.featured || false,
        status: data.status || 'draft',
        industry: data.industry || '',
        techStack: data.tech_stack || [],
        migrationType: data.migration_type || '',
        companyName: data.company_name || '',
        description: data.description || '',
        challenges: data.challenges || '',
        approach: data.approach || '',
        metrics: metricsFromApi,
        businessOutcomes: data.business_outcomes || '',
        testimonialQuote: data.testimonial_quote || '',
        testimonialAuthor: data.testimonial_author || '',
        testimonialPosition: data.testimonial_position || '',
      });

      setFileData({
        pdfFile: { file: null, previewUrl: data.pdf_url || '' },
      });

      // Check if industry is custom (not in predefined options)
      const industry = data.industry || '';
      if (industry && !industryOptions.includes(industry)) {
        setCustomIndustry(industry);
        setShowCustomIndustryInput(true);
      }
    } catch (err) {
      console.error('Failed to fetch case study:', err);
      setErrorMessage('Failed to load case study data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [industryOptions]);

  // Fetch case study data when editing
  useEffect(() => {
    if (editingId) {
      fetchCaseStudyData(editingId);
    }
  }, [editingId, fetchCaseStudyData]);

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

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
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

  // Validate testimonial fields - all three must be filled together or all empty
  const areTestimonialFieldsValid = () => {
    const quote = formData.testimonialQuote.trim();
    const author = formData.testimonialAuthor.trim();
    const position = formData.testimonialPosition.trim();
    
    const filledCount = [quote, author, position].filter(Boolean).length;
    // Valid if all empty (0) or all filled (3)
    return filledCount === 0 || filledCount === 3;
  };

  const hasPartialTestimonial = () => {
    const quote = formData.testimonialQuote.trim();
    const author = formData.testimonialAuthor.trim();
    const position = formData.testimonialPosition.trim();
    
    const filledCount = [quote, author, position].filter(Boolean).length;
    return filledCount > 0 && filledCount < 3;
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

  // AI Extraction handlers
  const handleAIFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setExtractionError('File size exceeds 10MB limit');
      return;
    }

    await handleAIExtraction(file);
  };

  const handleAIExtraction = async (file: File) => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const response = await aiExtractService.extractCaseStudy(file);
      
      if (response.success && response.data) {
        const extracted = response.data;
        
        // Auto-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          title: extracted.title || prev.title,
          companyName: extracted.companyName || prev.companyName,
          description: extracted.description || prev.description,
          industry: extracted.industry || prev.industry,
          techStack: extracted.techStack?.length > 0 ? extracted.techStack : prev.techStack,
          migrationType: extracted.migrationType || prev.migrationType,
          challenges: extracted.challenges || prev.challenges,
          approach: extracted.approach || prev.approach,
          businessOutcomes: extracted.businessOutcomes || prev.businessOutcomes,
          testimonialQuote: extracted.testimonialQuote || prev.testimonialQuote,
          testimonialAuthor: extracted.testimonialAuthor || prev.testimonialAuthor,
          testimonialPosition: extracted.testimonialPosition || prev.testimonialPosition,
        }));

        // Handle metrics
        if (extracted.metrics && extracted.metrics.length > 0) {
          setFormData(prev => ({
            ...prev,
            metrics: extracted.metrics as MetricItem[]
          }));
        }
      }
    } catch (error: any) {
      console.error('AI extraction error:', error);
      const message = error?.response?.data?.detail || error?.message || 'Failed to extract data from document';
      setExtractionError(message);
    } finally {
      setIsExtracting(false);
    }
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
    
    // Validate testimonial fields - all or none
    if (!areTestimonialFieldsValid()) {
      setErrorMessage('Testimonial fields must be either all filled or all empty. Please complete Quote, Author, and Position.');
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
    } catch (error: unknown) {
      console.error('Submit error:', error);
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      const message = axiosError?.response?.data?.detail || axiosError?.message || 'An error occurred while saving the case study.';
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
        {/* AI-Powered Auto-Fill Section */}
        <div className="form-section ai-extract-section">
          <div className="ai-extract-glow"></div>
          
          <h3 className="ai-section-title">AI-Powered Auto-Fill</h3>
          
          <p className="ai-extract-description">
            Upload a document to automatically extract and fill case study information.
          </p>
          
          <div className="ai-upload-area">
            <input
              type="file"
              id="ai-extract-file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp"
              onChange={handleAIFileUpload}
              disabled={isExtracting}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="ai-extract-file" 
              className={`ai-upload-button ${isExtracting ? 'disabled' : ''}`}
            >
              {isExtracting ? (
                <>
                  <span className="spinner"></span>
                  Extracting data...
                </>
              ) : (
                'Upload here'
              )}
            </label>
            <p className="ai-upload-hint">
              Supported: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, GIF, BMP (Max 10MB)
            </p>
          </div>
          
          {extractionError && (
            <div className="extraction-error">
              ⚠️ {extractionError}
            </div>
          )}
        </div>

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
              <RichTextEditor
                value={formData.challenges}
                onChange={(markdown) => handleInputChange('challenges', markdown)}
                placeholder="Describe the challenges faced..."
                height="240px"
              />
            </div>

            <div className="form-field full-width">
              <label>Approach</label>
              <RichTextEditor
                value={formData.approach}
                onChange={(markdown) => handleInputChange('approach', markdown)}
                placeholder="Describe the solution approach..."
                height="240px"
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
              <label>Business Outcomes</label>
              <RichTextEditor
                value={formData.businessOutcomes}
                onChange={(markdown) => handleInputChange('businessOutcomes', markdown)}
                placeholder="List the business outcomes achieved (use bullet points)..."
                height="240px"
              />
            </div>

            <div className="form-field full-width">
              <label>Testimonial Quote {hasPartialTestimonial() && '*'}</label>
              <textarea
                value={formData.testimonialQuote}
                onChange={(e) => handleInputChange('testimonialQuote', e.target.value)}
                placeholder="Client testimonial quote"
                rows={4}
              />
            </div>

            <div className="form-field">
              <label>Testimonial Author {hasPartialTestimonial() && '*'}</label>
              <input
                type="text"
                value={formData.testimonialAuthor}
                onChange={(e) => handleInputChange('testimonialAuthor', e.target.value)}
                placeholder="Person's name"
              />
            </div>

            <div className="form-field">
              <label>Author Position {hasPartialTestimonial() && '*'}</label>
              <input
                type="text"
                value={formData.testimonialPosition}
                onChange={(e) => handleInputChange('testimonialPosition', e.target.value)}
                placeholder="Job title"
              />
            </div>

            {hasPartialTestimonial() && (
              <div className="form-field full-width">
                <p className="validation-hint">All testimonial fields (Quote, Author, Position) must be filled</p>
              </div>
            )}
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

