import { useState, useEffect, useRef } from 'react';
import '@/styles/features/admin/BlogList.css';
import { blogsService } from '@/features/blogs';
import type { BlogCardData } from '@/features/blogs/components/BlogCard';

interface BlogListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

const BlogList = ({ onAddNew, onEdit }: BlogListProps) => {
  const [blogs, setBlogs] = useState<BlogCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch blogs on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setError(null);
      
      // Fetch from API
      const data = await blogsService.getAll();
      setBlogs(data);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blogs. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        // Delete via API
        await blogsService.delete(id);
        alert('Blog deleted successfully!');
        
        // Refresh the list
        fetchBlogs();
      } catch (err) {
        console.error('Failed to delete blog:', err);
        alert('Failed to delete blog. Please try again.');
      }
    }
  };

  if (error) {
    return (
      <div className="blog-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchBlogs} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list">
      {/* Header Section */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Blogs</h2>
          <span className="list-count">{blogs.length} Total</span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Blog
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{blogs.length}</div>
            <div className="stat-label">Total Blogs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{blogs.filter(b => b.status === 'published').length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-value">{blogs.filter(b => b.status === 'draft').length}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{new Set(blogs.map(b => b.category)).size}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="blog-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Author</th>
              <th>Date</th>
              <th>Status</th>
              <th>URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No blogs found. Click "Add New Blog" to create one.
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog.id}>
                  <td>
                    <div className="title-cell">
                      {blog.title}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{blog.category}</span>
                  </td>
                  <td>{blog.author || '-'}</td>
                  <td>{blog.published_date || blog.date || '-'}</td>
                  <td>
                    <span className={`status-badge ${blog.status === 'published' ? 'published' : 'draft'}`}>
                      {blog.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <a 
                      href={blog.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="url-link"
                      title={blog.url}
                    >
                      View 🔗
                    </a>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-button edit"
                        onClick={() => onEdit(blog.id)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleDelete(blog.id)}
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

export default BlogList;

