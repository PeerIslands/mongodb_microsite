import { useState } from 'react';
import '@/styles/components/admin/BlogForm.css';

interface BlogFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const BlogForm = ({ editingId, onCancel, onSuccess }: BlogFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    author: '',
    url: '',
    published_date: '',
    tags: [] as string[],
    status: 'draft'
  });

  const [tagInput, setTagInput] = useState('');

  const categories = [
    'Tutorial',
    'Best Practices',
    'Performance',
    'Security',
    'Architecture',
    'Case Study',
    'News',
    'Community'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting blog:', formData);
    // API call here
    onSuccess();
  };

  return (
    <div className="blog-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {editingId ? 'Edit Blog Post' : 'Add New Blog Post'}
        </h2>
        <button className="cancel-button" onClick={onCancel}>
          ← Back to List
        </button>
      </div>

      <form className="blog-form" onSubmit={handleSubmit}>
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
                placeholder="Enter blog post title"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the blog post"
                rows={4}
                maxLength={500}
                required
              />
              <span className="char-count">{formData.description.length}/500</span>
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

            <div className="form-field">
              <label>Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Author name (optional)"
              />
            </div>

            <div className="form-field full-width">
              <label>External URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com/blog-post"
                required
              />
              <small>Link to the full blog post on Medium, Dev.to, or your blog</small>
            </div>

            <div className="form-field">
              <label>Published Date</label>
              <input
                type="date"
                value={formData.published_date}
                onChange={(e) => handleInputChange('published_date', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="form-field full-width">
              <label>Tags</label>
              <div className="tag-input-container">
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                  />
                  <button
                    type="button"
                    className="add-tag-button"
                    onClick={handleAddTag}
                  >
                    Add Tag
                  </button>
                </div>
                <div className="tags-display">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag-chip">
                      {tag}
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {editingId ? 'Update Blog Post' : 'Create Blog Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;
