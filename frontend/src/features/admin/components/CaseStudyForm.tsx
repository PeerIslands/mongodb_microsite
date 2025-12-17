import { useState } from 'react';
import '@/styles/features/admin/CaseStudyForm.css';
import FileUpload from './FileUpload';

interface CaseStudyFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface Metric {
  label: string;
  value: string;
}

const CaseStudyForm = ({ editingId, onCancel, onSuccess }: CaseStudyFormProps) => {
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    slug: '',
    featured: false,
    published: false,
    industry: '',
    techStack: [] as string[],
    migrationType: '',
    
    // Client Background
    companyName: '',
    companyLogo: '',
    description: '',
    industryDetails: '',
    
    // Problem Statement
    challenges: [''],
    businessImpact: '',
    technicalConstraints: '',
    
    // Solution & Architecture
    approach: '',
    architectureDiagram: '',
    technologiesUsed: [] as string[],
    implementationDetails: '',
    codeSnippets: [''],
    
    // Value Delivered
    metrics: [{ label: '', value: '' }] as Metric[],
    businessOutcomes: [''],
    testimonialQuote: '',
    testimonialAuthor: '',
    testimonialPosition: '',
    
    // Media
    heroImage: '',
    galleryImages: [] as string[],
    pdfUrl: ''
  });

  const industries = ['Healthcare', 'Finance', 'E-commerce', 'Retail', 'Manufacturing', 'Technology', 'Education', 'Government'];
  const techOptions = ['MongoDB', 'PostgreSQL', 'MySQL', 'Node.js', 'Python', 'React', 'Vue.js', 'Angular', 'Java', 'Kafka', 'Spark'];
  const migrationTypes = ['SQL to MongoDB', 'Cloud Migration', 'Modernization', 'Data Lake', 'Microservices'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const handleArrayItemAdd = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as any[], '']
    }));
  };

  const handleArrayItemRemove = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as any[]).filter((_, i) => i !== index)
    }));
  };

  const handleMetricChange = (index: number, field: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) => 
        i === index ? { ...metric, [field]: value } : metric
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting:', formData);
    // API call here
    onSuccess();
  };

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
              <label>Migration Type *</label>
              <select
                value={formData.migrationType}
                onChange={(e) => handleInputChange('migrationType', e.target.value)}
                required
              >
                <option value="">Select Type</option>
                {migrationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label>Tech Stack *</label>
              <div className="checkbox-group">
                {techOptions.map(tech => (
                  <label key={tech} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.techStack.includes(tech)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('techStack', [...formData.techStack, tech]);
                        } else {
                          handleInputChange('techStack', formData.techStack.filter(t => t !== tech));
                        }
                      }}
                    />
                    <span>{tech}</span>
                  </label>
                ))}
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

            <div className="form-field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => handleInputChange('published', e.target.checked)}
                />
                <span>Published (Visible to Public)</span>
              </label>
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
                onUpload={(url) => handleInputChange('companyLogo', url)}
                currentFile={formData.companyLogo}
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
              <label>Challenges * (Add at least 2)</label>
              <div className="dynamic-list">
                {formData.challenges.map((challenge, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={challenge}
                      onChange={(e) => handleArrayItemChange('challenges', index, e.target.value)}
                      placeholder={`Challenge ${index + 1}`}
                      required
                    />
                    {formData.challenges.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('challenges', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('challenges')}
                >
                  + Add Challenge
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Business Impact *</label>
              <textarea
                value={formData.businessImpact}
                onChange={(e) => handleInputChange('businessImpact', e.target.value)}
                placeholder="Describe the business impact"
                rows={4}
                maxLength={1000}
                required
              />
              <span className="char-count">{formData.businessImpact.length}/1000</span>
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
              <label>Architecture Diagram *</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(url) => handleInputChange('architectureDiagram', url)}
                currentFile={formData.architectureDiagram}
                hint="PNG or JPG (Max 5MB, Min 800x600px)"
              />
            </div>

            <div className="form-field full-width">
              <label>Implementation Details *</label>
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

            <div className="form-field full-width">
              <label>Code Snippets (Optional)</label>
              <div className="dynamic-list">
                {formData.codeSnippets.map((snippet, index) => (
                  <div key={index} className="dynamic-item">
                    <textarea
                      value={snippet}
                      onChange={(e) => handleArrayItemChange('codeSnippets', index, e.target.value)}
                      placeholder={`Code snippet ${index + 1}`}
                      rows={4}
                    />
                    {formData.codeSnippets.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('codeSnippets', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('codeSnippets')}
                >
                  + Add Code Snippet
                </button>
              </div>
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
              <label>Metrics * (Label + Value pairs)</label>
              <div className="metrics-builder">
                {formData.metrics.map((metric, index) => (
                  <div key={index} className="metric-row">
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => handleMetricChange(index, 'label', e.target.value)}
                      placeholder="e.g., Performance Improvement"
                      required
                    />
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => handleMetricChange(index, 'value', e.target.value)}
                      placeholder="e.g., 300% faster"
                      required
                    />
                    {formData.metrics.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            metrics: prev.metrics.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      metrics: [...prev.metrics, { label: '', value: '' }]
                    }));
                  }}
                >
                  + Add Metric
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Business Outcomes * (Add at least 2)</label>
              <div className="dynamic-list">
                {formData.businessOutcomes.map((outcome, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => handleArrayItemChange('businessOutcomes', index, e.target.value)}
                      placeholder={`Outcome ${index + 1}`}
                      required
                    />
                    {formData.businessOutcomes.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('businessOutcomes', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('businessOutcomes')}
                >
                  + Add Outcome
                </button>
              </div>
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
                onUpload={(url) => handleInputChange('heroImage', url)}
                currentFile={formData.heroImage}
                hint="PNG or JPG (Max 5MB, Recommended 1920x1080px)"
              />
            </div>

            <div className="form-field full-width">
              <label>Gallery Images (Optional, Max 8)</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={3}
                multiple
                maxFiles={8}
                onUpload={(urls) => handleInputChange('galleryImages', urls)}
                currentFile={formData.galleryImages}
                hint="PNG or JPG (Max 3MB each, up to 8 images)"
              />
            </div>

            <div className="form-field full-width">
              <label>Case Study PDF *</label>
              <FileUpload
                accept="application/pdf"
                maxSize={10}
                onUpload={(url) => handleInputChange('pdfUrl', url)}
                currentFile={formData.pdfUrl}
                hint="PDF only (Max 10MB)"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {editingId ? 'Update Case Study' : 'Create Case Study'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseStudyForm;

