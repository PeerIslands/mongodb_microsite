import { useState } from 'react';
import '@/styles/components/admin/AcceleratorForm.css';
import FileUpload from './FileUpload';
import VideoUploader from './VideoUploader';
import FileManager from './FileManager';

interface AcceleratorFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Benefit {
  title: string;
  metric: string;
  description: string;
  category: string;
}

interface Download {
  name: string;
  description: string;
  file_url: string;
  version: string;
}

const AcceleratorForm = ({ editingId, onCancel, onSuccess }: AcceleratorFormProps) => {
  const [formData, setFormData] = useState({
    // Section 1: Basic Information
    name: '',
    slug: '',
    tagline: '',
    category: '',
    sourceTech: '',
    targetTech: 'MongoDB Atlas',
    migrationType: '',
    status: 'active',
    featured: false,
    published: false,
    
    // Section 2: Overview
    description: '',
    useCases: [''],
    idealFor: [''],
    techStack: [] as string[],
    
    // Section 3: Features
    features: [{ icon: '', title: '', description: '' }] as Feature[],
    
    // Section 4: Benefits
    benefits: [{ title: '', metric: '', description: '', category: 'Time' }] as Benefit[],
    
    // Section 5: Technical Specs
    supportedVersions: [''],
    prerequisites: [''],
    limitations: [''],
    compatibility: [] as string[],
    
    // Section 6: Demo Video
    videoSource: 'upload',
    videoFile: '',
    videoUrl: '',
    videoThumbnail: '',
    videoDuration: '',
    videoTitle: '',
    
    // Section 7: Media & Assets
    cardImage: '',
    heroImage: '',
    logoImage: '',
    screenshots: [] as string[],
    architectureDiagram: '',
    
    // Section 8: Downloads
    downloads: [{ name: '', description: '', file_url: '', version: '' }] as Download[],
    
    // Section 9: Documentation
    gettingStartedUrl: '',
    fullDocsUrl: '',
    apiReferenceUrl: '',
    githubUrl: '',
    supportUrl: '',
    
    // Section 10: Performance Metrics
    performanceMetrics: [{ name: '', value: '', description: '' }],
    
    // Section 11: Testimonials
    testimonials: [{ quote: '', author: '', company: '', position: '' }],
    
    // Section 12: Pricing
    pricingModel: 'Free',
    price: '',
    licenseType: 'Open Source',
    
    // Section 13: SEO
    metaTitle: '',
    metaDescription: '',
    keywords: [] as string[]
  });

  const categories = ['Migration', 'Modernization', 'Integration', 'Analytics'];
  const migrationTypes = ['Database', 'Application', 'Data', 'Full Stack'];
  const statuses = ['active', 'beta', 'coming_soon', 'deprecated'];
  const techOptions = ['MongoDB', 'HBase', 'Cassandra', 'Cosmos DB', 'PostgreSQL', 'MySQL', 'Oracle', 'Node.js', 'Python', 'Java', 'Kafka', 'Spark'];
  const compatibilityOptions = ['Linux', 'macOS', 'Windows', 'Docker', 'Kubernetes'];
  const benefitCategories = ['Time', 'Cost', 'Performance', 'Risk'];
  const pricingModels = ['Free', 'Enterprise', 'Contact Sales'];
  const licenseTypes = ['Open Source', 'Proprietary', 'Hybrid'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const handleArrayItemAdd = (field: string, template: any = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as any[], template]
    }));
  };

  const handleArrayItemRemove = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as any[]).filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, field: keyof Feature, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => 
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const handleBenefitChange = (index: number, field: keyof Benefit, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => 
        i === index ? { ...benefit, [field]: value } : benefit
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting:', formData);
    onSuccess();
  };

  return (
    <div className="accelerator-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {editingId ? 'Edit Accelerator' : 'Add New Accelerator'}
        </h2>
        <button className="cancel-button" onClick={onCancel}>
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
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., HBase → MongoDB Accelerator"
                required
              />
            </div>

            <div className="form-field">
              <label>Slug (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="hbase-mongodb-accelerator"
                required
              />
            </div>

            <div className="form-field">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label>Tagline *</label>
              <textarea
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Short description for card (max 150 chars)"
                rows={2}
                maxLength={150}
                required
              />
              <span className="char-count">{formData.tagline.length}/150</span>
            </div>

            <div className="form-field">
              <label>Source Technology *</label>
              <select
                value={formData.sourceTech}
                onChange={(e) => handleInputChange('sourceTech', e.target.value)}
                required
              >
                <option value="">Select Source</option>
                {techOptions.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Target Technology *</label>
              <input
                type="text"
                value={formData.targetTech}
                onChange={(e) => handleInputChange('targetTech', e.target.value)}
                required
              />
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

            <div className="form-field">
              <label>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                required
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
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

        {/* Section 2: Overview */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">2</span>
            Overview
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description (500-1000 chars)"
                rows={6}
                maxLength={1000}
                required
              />
              <span className="char-count">{formData.description.length}/1000</span>
            </div>

            <div className="form-field full-width">
              <label>Use Cases * (Add at least 2)</label>
              <div className="dynamic-list">
                {formData.useCases.map((useCase, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={useCase}
                      onChange={(e) => handleArrayItemChange('useCases', index, e.target.value)}
                      placeholder={`Use case ${index + 1}`}
                      required
                    />
                    {formData.useCases.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('useCases', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('useCases')}
                >
                  + Add Use Case
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Ideal For * (Target scenarios)</label>
              <div className="dynamic-list">
                {formData.idealFor.map((item, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayItemChange('idealFor', index, e.target.value)}
                      placeholder={`Scenario ${index + 1}`}
                      required
                    />
                    {formData.idealFor.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('idealFor', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('idealFor')}
                >
                  + Add Scenario
                </button>
              </div>
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
          </div>
        </div>

        {/* Section 3: Features */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">3</span>
            Features
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Feature List * (Add at least 3)</label>
              <div className="features-builder">
                {formData.features.map((feature, index) => (
                  <div key={index} className="feature-builder-item">
                    <div className="feature-builder-header">
                      <h4>Feature {index + 1}</h4>
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => handleArrayItemRemove('features', index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="feature-builder-fields">
                      <input
                        type="text"
                        value={feature.icon}
                        onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                        placeholder="Icon (emoji or identifier)"
                        required
                      />
                      <input
                        type="text"
                        value={feature.title}
                        onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                        placeholder="Feature title"
                        required
                      />
                      <textarea
                        value={feature.description}
                        onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                        placeholder="Feature description"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('features', { icon: '', title: '', description: '' })}
                >
                  + Add Feature
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Benefits */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">4</span>
            Benefits
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Benefit List * (Add at least 3)</label>
              <div className="benefits-builder">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-builder-item">
                    <div className="benefit-builder-header">
                      <h4>Benefit {index + 1}</h4>
                      {formData.benefits.length > 1 && (
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => handleArrayItemRemove('benefits', index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="benefit-builder-fields">
                      <div className="benefit-row">
                        <input
                          type="text"
                          value={benefit.title}
                          onChange={(e) => handleBenefitChange(index, 'title', e.target.value)}
                          placeholder="Benefit title (e.g., 40% Faster)"
                          required
                        />
                        <input
                          type="text"
                          value={benefit.metric}
                          onChange={(e) => handleBenefitChange(index, 'metric', e.target.value)}
                          placeholder="Metric (e.g., 40%)"
                          required
                        />
                      </div>
                      <select
                        value={benefit.category}
                        onChange={(e) => handleBenefitChange(index, 'category', e.target.value)}
                        required
                      >
                        {benefitCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <textarea
                        value={benefit.description}
                        onChange={(e) => handleBenefitChange(index, 'description', e.target.value)}
                        placeholder="Benefit description"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('benefits', { title: '', metric: '', description: '', category: 'Time' })}
                >
                  + Add Benefit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Technical Specifications */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">5</span>
            Technical Specifications
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Supported Versions *</label>
              <div className="dynamic-list">
                {formData.supportedVersions.map((version, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => handleArrayItemChange('supportedVersions', index, e.target.value)}
                      placeholder="e.g., HBase 2.x"
                      required
                    />
                    {formData.supportedVersions.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('supportedVersions', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('supportedVersions')}
                >
                  + Add Version
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Prerequisites *</label>
              <div className="dynamic-list">
                {formData.prerequisites.map((prereq, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={prereq}
                      onChange={(e) => handleArrayItemChange('prerequisites', index, e.target.value)}
                      placeholder="e.g., Java 8+"
                      required
                    />
                    {formData.prerequisites.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('prerequisites', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('prerequisites')}
                >
                  + Add Prerequisite
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Limitations (Optional)</label>
              <div className="dynamic-list">
                {formData.limitations.map((limitation, index) => (
                  <div key={index} className="dynamic-item">
                    <input
                      type="text"
                      value={limitation}
                      onChange={(e) => handleArrayItemChange('limitations', index, e.target.value)}
                      placeholder="Known limitation"
                    />
                    {formData.limitations.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('limitations', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('limitations')}
                >
                  + Add Limitation
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Compatibility *</label>
              <div className="checkbox-group">
                {compatibilityOptions.map(platform => (
                  <label key={platform} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.compatibility.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('compatibility', [...formData.compatibility, platform]);
                        } else {
                          handleInputChange('compatibility', formData.compatibility.filter(p => p !== platform));
                        }
                      }}
                    />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Demo Video */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">6</span>
            Demo Video
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Video Source *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="upload"
                    checked={formData.videoSource === 'upload'}
                    onChange={(e) => handleInputChange('videoSource', e.target.value)}
                  />
                  <span>Upload Video File</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="youtube"
                    checked={formData.videoSource === 'youtube'}
                    onChange={(e) => handleInputChange('videoSource', e.target.value)}
                  />
                  <span>YouTube URL</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="vimeo"
                    checked={formData.videoSource === 'vimeo'}
                    onChange={(e) => handleInputChange('videoSource', e.target.value)}
                  />
                  <span>Vimeo URL</span>
                </label>
              </div>
            </div>

            {formData.videoSource === 'upload' ? (
              <div className="form-field full-width">
                <label>Upload Video *</label>
                <VideoUploader
                  onUpload={(url) => handleInputChange('videoFile', url)}
                  currentFile={formData.videoFile}
                />
              </div>
            ) : (
              <div className="form-field full-width">
                <label>Video URL *</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
              </div>
            )}

            <div className="form-field full-width">
              <label>Video Thumbnail *</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(url) => handleInputChange('videoThumbnail', url)}
                currentFile={formData.videoThumbnail}
                hint="PNG or JPG (Max 5MB, 1920x1080 recommended)"
              />
            </div>

            <div className="form-field">
              <label>Duration *</label>
              <input
                type="text"
                value={formData.videoDuration}
                onChange={(e) => handleInputChange('videoDuration', e.target.value)}
                placeholder="e.g., 8:45"
                pattern="[0-9]{1,2}:[0-9]{2}"
                required
              />
            </div>

            <div className="form-field">
              <label>Video Title *</label>
              <input
                type="text"
                value={formData.videoTitle}
                onChange={(e) => handleInputChange('videoTitle', e.target.value)}
                placeholder="Video title"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 7: Media & Assets */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">7</span>
            Media & Assets
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Card Image *</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(url) => handleInputChange('cardImage', url)}
                currentFile={formData.cardImage}
                hint="PNG or JPG (Max 5MB, 600x400px)"
              />
            </div>

            <div className="form-field full-width">
              <label>Hero Image *</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(url) => handleInputChange('heroImage', url)}
                currentFile={formData.heroImage}
                hint="PNG or JPG (Max 5MB, 1920x600px)"
              />
            </div>

            <div className="form-field full-width">
              <label>Logo Image *</label>
              <FileUpload
                accept="image/png"
                maxSize={2}
                onUpload={(url) => handleInputChange('logoImage', url)}
                currentFile={formData.logoImage}
                hint="PNG with transparency (Max 2MB, 200x200px)"
              />
            </div>

            <div className="form-field full-width">
              <label>Screenshots (Optional, Max 8)</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={3}
                multiple
                maxFiles={8}
                onUpload={(urls) => handleInputChange('screenshots', urls)}
                currentFile={formData.screenshots}
                hint="PNG or JPG (Max 3MB each)"
              />
            </div>

            <div className="form-field full-width">
              <label>Architecture Diagram (Optional)</label>
              <FileUpload
                accept="image/png,image/jpeg"
                maxSize={5}
                onUpload={(url) => handleInputChange('architectureDiagram', url)}
                currentFile={formData.architectureDiagram}
                hint="PNG or JPG (Max 5MB)"
              />
            </div>
          </div>
        </div>

        {/* Section 8: Downloads */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">8</span>
            Downloads & Files
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Download Files * (Add at least 1)</label>
              <FileManager
                files={formData.downloads}
                onChange={(files) => handleInputChange('downloads', files)}
              />
            </div>
          </div>
        </div>

        {/* Section 9: Documentation Links */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">9</span>
            Documentation Links
          </h3>
          
          <div className="form-grid">
            <div className="form-field">
              <label>Getting Started URL *</label>
              <input
                type="url"
                value={formData.gettingStartedUrl}
                onChange={(e) => handleInputChange('gettingStartedUrl', e.target.value)}
                placeholder="https://docs.example.com/quickstart"
                required
              />
            </div>

            <div className="form-field">
              <label>Full Documentation URL</label>
              <input
                type="url"
                value={formData.fullDocsUrl}
                onChange={(e) => handleInputChange('fullDocsUrl', e.target.value)}
                placeholder="https://docs.example.com"
              />
            </div>

            <div className="form-field">
              <label>API Reference URL</label>
              <input
                type="url"
                value={formData.apiReferenceUrl}
                onChange={(e) => handleInputChange('apiReferenceUrl', e.target.value)}
                placeholder="https://docs.example.com/api"
              />
            </div>

            <div className="form-field">
              <label>GitHub URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="form-field">
              <label>Support URL</label>
              <input
                type="url"
                value={formData.supportUrl}
                onChange={(e) => handleInputChange('supportUrl', e.target.value)}
                placeholder="https://support.example.com"
              />
            </div>
          </div>
        </div>

        {/* Section 10: Performance Metrics */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">10</span>
            Performance Metrics (Optional)
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Metrics</label>
              <div className="metrics-builder">
                {formData.performanceMetrics.map((metric, index) => (
                  <div key={index} className="metric-row">
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => {
                        const newMetrics = [...formData.performanceMetrics];
                        newMetrics[index].name = e.target.value;
                        handleInputChange('performanceMetrics', newMetrics);
                      }}
                      placeholder="Metric name (e.g., Migration Speed)"
                    />
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => {
                        const newMetrics = [...formData.performanceMetrics];
                        newMetrics[index].value = e.target.value;
                        handleInputChange('performanceMetrics', newMetrics);
                      }}
                      placeholder="Value (e.g., 10x faster)"
                    />
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          performanceMetrics: prev.performanceMetrics.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('performanceMetrics', { name: '', value: '', description: '' })}
                >
                  + Add Metric
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 11: Testimonials */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">11</span>
            Testimonials (Optional)
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Client Testimonials</label>
              <div className="testimonials-builder">
                {formData.testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-builder-item">
                    <div className="testimonial-builder-header">
                      <h4>Testimonial {index + 1}</h4>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleArrayItemRemove('testimonials', index)}
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      value={testimonial.quote}
                      onChange={(e) => {
                        const newTestimonials = [...formData.testimonials];
                        newTestimonials[index].quote = e.target.value;
                        handleInputChange('testimonials', newTestimonials);
                      }}
                      placeholder="Testimonial quote"
                      rows={3}
                    />
                    <div className="testimonial-fields">
                      <input
                        type="text"
                        value={testimonial.author}
                        onChange={(e) => {
                          const newTestimonials = [...formData.testimonials];
                          newTestimonials[index].author = e.target.value;
                          handleInputChange('testimonials', newTestimonials);
                        }}
                        placeholder="Author name"
                      />
                      <input
                        type="text"
                        value={testimonial.position}
                        onChange={(e) => {
                          const newTestimonials = [...formData.testimonials];
                          newTestimonials[index].position = e.target.value;
                          handleInputChange('testimonials', newTestimonials);
                        }}
                        placeholder="Position"
                      />
                      <input
                        type="text"
                        value={testimonial.company}
                        onChange={(e) => {
                          const newTestimonials = [...formData.testimonials];
                          newTestimonials[index].company = e.target.value;
                          handleInputChange('testimonials', newTestimonials);
                        }}
                        placeholder="Company"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => handleArrayItemAdd('testimonials', { quote: '', author: '', company: '', position: '' })}
                >
                  + Add Testimonial
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 12: Pricing */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">12</span>
            Pricing (Optional)
          </h3>
          
          <div className="form-grid">
            <div className="form-field">
              <label>Pricing Model *</label>
              <select
                value={formData.pricingModel}
                onChange={(e) => handleInputChange('pricingModel', e.target.value)}
                required
              >
                {pricingModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {formData.pricingModel !== 'Contact Sales' && (
              <div className="form-field">
                <label>Price</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., $5,000 or Free"
                />
              </div>
            )}

            <div className="form-field">
              <label>License Type *</label>
              <select
                value={formData.licenseType}
                onChange={(e) => handleInputChange('licenseType', e.target.value)}
                required
              >
                {licenseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 13: SEO & Metadata */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-number">13</span>
            SEO & Metadata
          </h3>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Meta Title *</label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                placeholder="SEO title (max 60 chars)"
                maxLength={60}
                required
              />
              <span className="char-count">{formData.metaTitle.length}/60</span>
            </div>

            <div className="form-field full-width">
              <label>Meta Description *</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                placeholder="SEO description (max 160 chars)"
                rows={3}
                maxLength={160}
                required
              />
              <span className="char-count">{formData.metaDescription.length}/160</span>
            </div>

            <div className="form-field full-width">
              <label>Keywords (Comma-separated)</label>
              <input
                type="text"
                placeholder="hbase, mongodb, migration, toolkit"
                onChange={(e) => {
                  const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                  handleInputChange('keywords', keywords);
                }}
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
            {editingId ? 'Update Accelerator' : 'Create Accelerator'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AcceleratorForm;


