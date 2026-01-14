import { useState } from 'react';
import '@/styles/components/admin/BlogList.css';

interface BlogListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

// Mock data - will be replaced with API calls
const mockBlogs = [
  {
    id: '1',
    title: 'Getting Started with MongoDB Atlas',
    category: 'Tutorial',
    author: 'John Doe',
    status: 'published',
    published_date: '2024-01-15',
    tags: ['MongoDB', 'Atlas', 'Cloud'],
    views: 2134,
    created_at: '2024-01-10'
  },
  {
    id: '2',
    title: 'Building Scalable Applications with MongoDB',
    category: 'Best Practices',
    author: 'Jane Smith',
    status: 'published',
    published_date: '2024-02-20',
    tags: ['MongoDB', 'Scalability', 'Architecture'],
    views: 1856,
    created_at: '2024-02-15'
  },
  {
    id: '3',
    title: 'MongoDB Performance Optimization Tips',
    category: 'Performance',
    author: 'Mike Johnson',
    status: 'draft',
    published_date: null,
    tags: ['MongoDB', 'Performance', 'Optimization'],
    views: 0,
    created_at: '2024-03-05'
  }
];

const BlogList = ({ onAddNew, onEdit }: BlogListProps) => {
  const [blogs] = useState(mockBlogs);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      // API call to delete
      console.log('Delete blog:', id);
    }
  };

  const handleTogglePublish = (id: string) => {
    // API call to toggle published status
    console.log('Toggle publish status:', id);
  };

  return (
    <div className="blog-list">
      {/* Header Section */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Blog Posts</h2>
          <span className="list-count">{blogs.length} Total</span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Blog Post
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
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-value">{blogs.reduce((sum, b) => sum + b.views, 0)}</div>
            <div className="stat-label">Total Views</div>
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
              <th>Tags</th>
              <th>Status</th>
              <th>Published Date</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id}>
                <td>
                  <div className="title-cell">
                    {blog.title}
                  </div>
                </td>
                <td>{blog.category}</td>
                <td>{blog.author || 'Anonymous'}</td>
                <td>
                  <div className="tech-tags">
                    {blog.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="tech-tag">{tag}</span>
                    ))}
                    {blog.tags.length > 2 && (
                      <span className="tech-tag">+{blog.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td>
                  <button 
                    className={`status-badge ${blog.status === 'published' ? 'published' : 'draft'}`}
                    onClick={() => handleTogglePublish(blog.id)}
                  >
                    {blog.status === 'published' ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td>
                  {blog.published_date 
                    ? new Date(blog.published_date).toLocaleDateString()
                    : '-'
                  }
                </td>
                <td>{blog.views.toLocaleString()}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlogList;
