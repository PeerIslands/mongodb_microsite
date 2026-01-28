import { useState, useEffect } from 'react';
import '@/styles/features/admin/BlogForm.css';
import { blogsService } from '@/features/blogs';

interface BlogFormProps {
  editingId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface BlogFormData {
  title: string;
  description: string;
  category: string; // Stored as comma-separated string in form
  author: string;
  date: string;
  url: string;
  tags: string;
  status: 'published' | 'draft';
}

const BlogForm = ({ editingId, onCancel, onSuccess }: BlogFormProps) => {
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    description: '',
    category: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    url: '',
    tags: '',
    status: 'draft',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<BlogFormData>>({});
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);

  // Count words in a string
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Load existing blog data if editing
  useEffect(() => {
    if (editingId) {
      const fetchBlogData = async () => {
        try {
          // Fetch blog data from API
          const blog = await blogsService.getById(editingId);
          if (blog) {
            setFormData({
              title: blog.title,
              description: blog.description,
              category: blog.category,
              author: blog.author || '',
              date: blog.published_date || blog.date || new Date().toISOString().split('T')[0],
              url: blog.url,
              tags: blog.tags?.join(', ') || '',
              status: blog.status || 'draft',
            });
            // Update word count for loaded description
            setDescriptionWordCount(countWords(blog.description));
          }
        } catch (error) {
          console.error('Failed to fetch blog data:', error);
          alert('Failed to load blog data. Please try again.');
        }
      };
      
      fetchBlogData();
    }
  }, [editingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Enforce 30 word limit for description
    if (name === 'description') {
      // Split into words and filter out empty strings
      const words = value.split(/\s+/).filter(word => word.length > 0);
      
      // If word count exceeds 30, prevent the change
      if (words.length > 30) {
        // Keep only first 30 words and preserve trailing space if present
        const truncated = words.slice(0, 30).join(' ');
        const hasTrailingSpace = value.endsWith(' ');
        const finalValue = hasTrailingSpace ? truncated + ' ' : truncated;
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        setDescriptionWordCount(30);
        
        // Clear error for this field
        if (errors.description) {
          setErrors(prev => ({ ...prev, description: '' }));
        }
        return; // Don't update with the original value
      }
      
      setDescriptionWordCount(words.length);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof BlogFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BlogFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Published date is required';
    }

    if (!formData.tags.trim()) {
      newErrors.tags = 'Tags are required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const blogData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        url: formData.url,
        author: formData.author || undefined,
        published_date: formData.date || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: formData.status,
      };

      if (editingId) {
        await blogsService.update(editingId, blogData);
        alert('Blog updated successfully!');
      } else {
        await blogsService.create(blogData);
        alert('Blog created successfully!');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save blog:', error);
      alert('Failed to save blog. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="blog-form">
      {/* Header */}
      <div className="form-header">
        <div>
          <h2 className="form-title">
            {editingId ? 'Edit Blog' : 'Add New Blog'}
          </h2>
          <p className="form-subtitle">
            {editingId ? 'Update the blog information below' : 'Fill in the blog details below'}
          </p>
        </div>
        <button onClick={onCancel} className="close-button" type="button">
          ✕
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="blog-form-content">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="Enter blog title"
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Enter blog description (max 30 words)"
            rows={4}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
          <span className={`form-hint ${descriptionWordCount >= 30 ? 'limit-reached' : ''}`}>
            {descriptionWordCount}/30 words {descriptionWordCount >= 30 && '(limit reached)'}
          </span>
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category" className="form-label">
            Category <span className="required">*</span>
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-input ${errors.category ? 'error' : ''}`}
            placeholder="Enter category (e.g., Tutorial, Development, Best Practices)"
          />
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        {/* Author */}
        <div className="form-group">
          <label htmlFor="author" className="form-label">
            Author <span className="required">*</span>
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className={`form-input ${errors.author ? 'error' : ''}`}
            placeholder="Enter author name"
          />
          {errors.author && <span className="error-message">{errors.author}</span>}
        </div>

        {/* URL and Date Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="url" className="form-label">
              URL <span className="required">*</span>
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className={`form-input ${errors.url ? 'error' : ''}`}
              placeholder="https://example.com/blog-post"
            />
            {errors.url && <span className="error-message">{errors.url}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date" className="form-label">
              Published Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`form-input ${errors.date ? 'error' : ''}`}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label htmlFor="tags" className="form-label">
            Tags <span className="required">*</span>
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={`form-input ${errors.tags ? 'error' : ''}`}
            placeholder="Enter tags separated by commas (e.g., MongoDB, Cloud, Tutorial)"
          />
          {errors.tags && <span className="error-message">{errors.tags}</span>}
          <span className="form-hint">Separate multiple tags with commas</span>
        </div>

        {/* Status */}
        <div className="form-group">
          <label htmlFor="status" className="form-label">
            Status <span className="required">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
          <span className="form-hint">Only published blogs will appear on the Insights page</span>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editingId ? 'Update Blog' : 'Create Blog'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;

