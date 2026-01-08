import { useState, useEffect } from 'react';
import '@/styles/features/admin/CaseStudyForm.css';
import FileUpload, { FileUploadResult } from './FileUpload';
import { caseStudiesService } from '@/api/services/case-studies.service';

const TECH_STACK_OPTIONS = [
  'Angular',
  'Vue.js',
  'Node.js',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'HTML5',
  'CSS3',
  'SQL',
  'MongoDB',
  'Express.js',
  'Next.js',
  'Docker',
  'Git',
  'AWS',
  'Redux',
  'REST API',
  'GraphQL',
  'Spring Boot',
  'Django',
  'Flutter',
  'React Native',
  'Kubernetes',
  'DevOps',
  'React',
  'PostgreSQL',
  'Hibernate',
  'Kafka',
  'TensorFlow',
  'Keras',
  'Microservices',
  'CI/CD',
  'JUnit',
  'Maven',
  'PyTorch',
  'scikit-learn',
  'NumPy',
  'Pandas',
  'FastAPI',
  'Computer Vision',
  'NLP',
  'MLOps',
  'Jupyter Notebooks',
  'Go',
  'Terraform',
  'CloudFormation',
  'Lambda',
  'EC2',
  'S3',
  'DynamoDB',
  'Prometheus',
  'Grafana',
  'EKS'
];

interface CaseStudyFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
  techStackOptions?: string[];
}

interface MetricsData {
  timeReduction: string;
  ingestionSpeed: string;
  dataAccuracy: string;
}

interface FileData {
  file: File | null;
  previewUrl: string;
}

const CaseStudyForm = ({ editingId, onCancel, onSuccess, techStackOptions = TECH_STACK_OPTIONS }: CaseStudyFormProps) => {
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    slug: '',
    featured: false,
    status: 'draft' as 'published' | 'draft',
    industry: '',
    techStack: [] as string[],
    migrationType: '',
    
    // Client Background
    companyName: '',
    description: '',
    industryDetails: '',
    
    // Problem Statement
    challenges: '',
    technicalConstraints: '',
    
    // Solution & Architecture
    approach: '',
    implementationDetails: '',
    
    // Value Delivered
    metrics: {
      timeReduction: '',
      ingestionSpeed: '',
      dataAccuracy: '',
    } as MetricsData,
    businessOutcomes: '',
    testimonialQuote: '',
    testimonialAuthor: '',
    testimonialPosition: '',
  });

  // File data state (stores both File objects and preview URLs)
  const [fileData, setFileData] = useState({
    heroImage: { file: null, previewUrl: '' } as FileData,
    companyLogo: { file: null, previewUrl: '' } as FileData,
    pdfFile: { file: null, previewUrl: '' } as FileData,
    architectureDiagram: { file: null, previewUrl: '' } as FileData,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customTech, setCustomTech] = useState('');
  const [availableTechOptions, setAvailableTechOptions] = useState<string[]>(techStackOptions);

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
      
      setFormData({
        title: apiData.title || '',
        slug: apiData.slug || '',
        featured: apiData.featured || false,
        status: apiData.status || 'draft',
        industry: apiData.industry || '',
        techStack: apiData.tech_stack || [],
        migrationType: apiData.migration_type || '',
        companyName: apiData.company_name || '',
        description: apiData.description || '',
        industryDetails: apiData.industry_details || '',
        challenges: apiData.challenges || '',
        technicalConstraints: apiData.technical_constraints || '',
        approach: apiData.approach || '',
        implementationDetails: apiData.implementation_details || '',
        metrics: {
          timeReduction: apiData.metrics?.time_reduction || '',
          ingestionSpeed: apiData.metrics?.ingestion_speed || '',
          dataAccuracy: apiData.metrics?.data_accuracy || '',
        },
        businessOutcomes: apiData.business_outcomes || '',
        testimonialQuote: apiData.testimonial_quote || '',
        testimonialAuthor: apiData.testimonial_author || '',
        testimonialPosition: apiData.testimonial_position || '',
      });

      // Set file preview URLs for existing files
      setFileData({
        heroImage: { 
          file: null, 
          previewUrl: apiData.hero_image || '' 
        },
        companyLogo: { 
          file: null, 
          previewUrl: apiData.company_logo || '' 
        },
        pdfFile: { 
          file: null, 
          previewUrl: apiData.pdf_url || '' 
        },
        architectureDiagram: { 
          file: null, 
          previewUrl: apiData.architecture_diagram || '' 
        },
      });

      // Add any custom tech stack items to available options
      const customTechs = (apiData.tech_stack || []).filter(
        (tech: string) => !techStackOptions.includes(tech)
      );
      if (customTechs.length > 0) {
        setAvailableTechOptions(prev => 
          [...new Set([...prev, ...customTechs])].sort((a, b) => a.localeCompare(b))
        );
      }
    } catch (err) {
      console.error('Failed to fetch case study:', err);
      setErrorMessage('Failed to load case study data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const industries = ['Healthcare', 'Finance', 'E-commerce', 'Retail', 'Manufacturing', 'Technology', 'Education', 'Government'];
  const migrationTypes = ['SQL to MongoDB', 'Cloud Migration', 'Modernization', 'Data Lake', 'Microservices'];

  const handleTechSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTech = e.target.value;
    if (selectedTech && !formData.techStack.includes(selectedTech)) {
      handleInputChange('techStack', [...formData.techStack, selectedTech]);
    }
    e.target.value = ''; // Reset dropdown
  };

  const handleAddCustomTech = () => {
    const trimmedTech = customTech.trim();
    if (trimmedTech && !formData.techStack.includes(trimmedTech)) {
      // Add to selected tech stack
      handleInputChange('techStack', [...formData.techStack, trimmedTech]);
      // If it's not in the available options, add it
      if (!availableTechOptions.includes(trimmedTech)) {
        setAvailableTechOptions(prev => [...prev, trimmedTech].sort((a, b) => a.localeCompare(b)));
      }
      setCustomTech('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    handleInputChange('techStack', formData.techStack.filter(t => t !== tech));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMetricChange = (metricKey: keyof MetricsData, value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [metricKey]: value
      }
    }));
  };

  // Check if at least one metric has a value (for validation)
  const hasAtLeastOneMetric = () => {
    return formData.metrics.timeReduction || formData.metrics.ingestionSpeed || formData.metrics.dataAccuracy;
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
    setIsSubmitting(true);

    try {
      // Build FormData for multipart/form-data request
      const submitData = new FormData();

      // Add text fields (converting to snake_case for API)
      submitData.append('title', formData.title);
      submitData.append('slug', formData.slug);
      submitData.append('industry', formData.industry);
      submitData.append('company_name', formData.companyName);
      submitData.append('featured', String(formData.featured));
      submitData.append('status', formData.status);
      submitData.append('tech_stack', JSON.stringify(formData.techStack));
      submitData.append('migration_type', formData.migrationType);
      submitData.append('description', formData.description);
      submitData.append('industry_details', formData.industryDetails);
      submitData.append('challenges', formData.challenges);
      submitData.append('technical_constraints', formData.technicalConstraints);
      submitData.append('approach', formData.approach);
      submitData.append('implementation_details', formData.implementationDetails);
      submitData.append('business_outcomes', formData.businessOutcomes);
      submitData.append('testimonial_quote', formData.testimonialQuote);
      submitData.append('testimonial_author', formData.testimonialAuthor);
      submitData.append('testimonial_position', formData.testimonialPosition);

      // Add metrics fields
      submitData.append('time_reduction', formData.metrics.timeReduction);
      submitData.append('ingestion_speed', formData.metrics.ingestionSpeed);
      submitData.append('data_accuracy', formData.metrics.dataAccuracy);

      // Add file fields (only if file exists)
      if (fileData.heroImage.file) {
        submitData.append('hero_image', fileData.heroImage.file);
      }
      if (fileData.companyLogo.file) {
        submitData.append('company_logo', fileData.companyLogo.file);
      }
      if (fileData.pdfFile.file) {
        submitData.append('pdf_file', fileData.pdfFile.file);
      }
      if (fileData.architectureDiagram.file) {
        submitData.append('architecture_diagram', fileData.architectureDiagram.file);
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

            <div className="form-field">
              <label>Slug (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="url-friendly-name"
                required
              />
            </div>

            <div className="form-field">
              <label>Industry *</label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                required
              >
                <option value="">Select Industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Migration Type</label>
              <select
                value={formData.migrationType}
                onChange={(e) => handleInputChange('migrationType', e.target.value)}
              >
                <option value="">Select Type</option>
                {migrationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label>Tech Stack *</label>
              <div className="tech-stack-selector">
                <div className="tech-stack-controls">
                  <select
                    onChange={handleTechSelect}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Technology</option>
                    {availableTechOptions
                      .filter(tech => !formData.techStack.includes(tech))
                      .sort((a, b) => a.localeCompare(b))
                      .map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                  </select>
                  <div className="custom-tech-input">
                    <input
                      type="text"
                      value={customTech}
                      onChange={(e) => setCustomTech(e.target.value)}
                      placeholder="Add custom technology"
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
                      + Add
                    </button>
                  </div>
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

        {/* Section 2: Client Background */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">2</span>
            Client Background
          </h3>
          
          <div className="form-grid">
            <div className="form-field">
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
              <label>Company Logo *</label>
              <FileUpload
                accept="image/png,image/jpeg,image/svg+xml"
                maxSize={2}
                onUpload={(result) => handleFileChange('companyLogo', result)}
                currentFile={fileData.companyLogo.previewUrl}
                hint="PNG, JPG, or SVG (Max 2MB)"
              />
            </div>

            <div className="form-field full-width">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief company overview (max 500 chars)"
                rows={3}
                maxLength={500}
                required
              />
              <span className="char-count">{formData.description.length}/500</span>
            </div>

            <div className="form-field full-width">
              <label>Industry Details</label>
              <textarea
                value={formData.industryDetails}
                onChange={(e) => handleInputChange('industryDetails', e.target.value)}
                placeholder="Detailed industry context"
                rows={5}
                maxLength={2000}
              />
              <span className="char-count">{formData.industryDetails.length}/2000</span>
            </div>
          </div>
        </div>

        {/* Section 3: Problem Statement */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">3</span>
            Problem Statement
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Challenges *</label>
              <textarea
                value={formData.challenges}
                onChange={(e) => handleInputChange('challenges', e.target.value)}
                placeholder="Describe the challenges faced"
                rows={4}
                maxLength={2000}
                required
              />
              <span className="char-count">{formData.challenges.length}/2000</span>
            </div>


            <div className="form-field full-width">
              <label>Technical Constraints</label>
              <textarea
                value={formData.technicalConstraints}
                onChange={(e) => handleInputChange('technicalConstraints', e.target.value)}
                placeholder="Technical challenges faced"
                rows={4}
                maxLength={2000}
              />
              <span className="char-count">{formData.technicalConstraints.length}/2000</span>
            </div>
          </div>
        </div>

        {/* Section 4: Solution & Architecture */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">4</span>
            Solution & Architecture
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Solution Approach *</label>
              <textarea
                value={formData.approach}
                onChange={(e) => handleInputChange('approach', e.target.value)}
                placeholder="Describe the solution overview"
                rows={6}
                maxLength={3000}
                required
              />
              <span className="char-count">{formData.approach.length}/3000</span>
            </div>

            <div className="form-field full-width">
              <label>Architecture Diagram</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(result) => handleFileChange('architectureDiagram', result)}
                currentFile={fileData.architectureDiagram.previewUrl}
                hint="PNG or JPG (Max 5MB, Min 800x600px)"
              />
            </div>

            <div className="form-field full-width">
              <label>Implementation Details</label>
              <textarea
                value={formData.implementationDetails}
                onChange={(e) => handleInputChange('implementationDetails', e.target.value)}
                placeholder="Detailed implementation description"
                rows={8}
                maxLength={5000}
                required
              />
              <span className="char-count">{formData.implementationDetails.length}/5000</span>
            </div>

            
          </div>
        </div>

        {/* Section 5: Value Delivered */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">5</span>
            Value Delivered
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Metrics * (At least one metric is required)</label>
              <div className="metrics-builder">
                <div className="metric-row">
                  <div className="metric-label">Time Reduction</div>
                  <input
                    type="text"
                    value={formData.metrics.timeReduction}
                    onChange={(e) => handleMetricChange('timeReduction', e.target.value)}
                    placeholder="e.g., 50% faster"
                  />
                </div>
                <div className="metric-row">
                  <div className="metric-label">Ingestion Speed</div>
                  <input
                    type="text"
                    value={formData.metrics.ingestionSpeed}
                    onChange={(e) => handleMetricChange('ingestionSpeed', e.target.value)}
                    placeholder="e.g., 10x improvement"
                  />
                </div>
                <div className="metric-row">
                  <div className="metric-label">Data Accuracy</div>
                  <input
                    type="text"
                    value={formData.metrics.dataAccuracy}
                    onChange={(e) => handleMetricChange('dataAccuracy', e.target.value)}
                    placeholder="e.g., 99.9% accuracy"
                  />
                </div>
                {!hasAtLeastOneMetric() && (
                  <p className="validation-hint">Please provide at least one metric value</p>
                )}
              </div>
            </div>

            <div className="form-field full-width">
              <label>Business Outcomes *</label>
              <textarea
                value={formData.businessOutcomes}
                onChange={(e) => handleInputChange('businessOutcomes', e.target.value)}
                placeholder="Describe the business outcomes achieved"
                rows={4}
                maxLength={2000}
                required
              />
              <span className="char-count">{formData.businessOutcomes.length}/2000</span>
            </div>

            <div className="form-field full-width">
              <label>Client Testimonial (Optional)</label>
              <textarea
                value={formData.testimonialQuote}
                onChange={(e) => handleInputChange('testimonialQuote', e.target.value)}
                placeholder="Client testimonial quote"
                rows={4}
                maxLength={500}
              />
              <span className="char-count">{formData.testimonialQuote.length}/500</span>
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

        {/* Section 6: Media & Files */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">6</span>
            Media & Files
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Hero Image * (Card Preview)</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(result) => handleFileChange('heroImage', result)}
                currentFile={fileData.heroImage.previewUrl}
                hint="PNG or JPG (Max 5MB, Recommended 1920x1080px)"
              />
            </div>


            <div className="form-field full-width">
              <label>Case Study PDF *</label>
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
            <span className="error-icon">⚠️</span>
            <span>{errorMessage}</span>
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

