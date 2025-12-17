import { useState } from 'react';
import '@/styles/components/admin/AcceleratorList.css';

interface AcceleratorListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

// Mock data - will be replaced with API calls
const mockAccelerators = [
  {
    id: '1',
    name: 'HBase → MongoDB Accelerator',
    category: 'Migration',
    sourceTech: 'HBase',
    version: '2.3.0',
    status: 'active',
    featured: true,
    published: true,
    downloads: 1234,
    views: 5678,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Cassandra → MongoDB Toolkit',
    category: 'Migration',
    sourceTech: 'Cassandra',
    version: '1.8.5',
    status: 'active',
    featured: true,
    published: true,
    downloads: 892,
    views: 4234,
    createdAt: '2024-02-20'
  },
  {
    id: '3',
    name: 'Cosmos DB → MongoDB Mapping Tool',
    category: 'Migration',
    sourceTech: 'Cosmos DB',
    version: '1.5.2',
    status: 'active',
    featured: false,
    published: true,
    downloads: 567,
    views: 2891,
    createdAt: '2024-03-10'
  },
  {
    id: '4',
    name: 'MCP-based Migration Demo',
    category: 'Modernization',
    sourceTech: 'Monolithic',
    version: '1.0.0',
    status: 'beta',
    featured: false,
    published: false,
    downloads: 445,
    views: 1789,
    createdAt: '2024-04-05'
  }
];

const AcceleratorList = ({ onAddNew, onEdit }: AcceleratorListProps) => {
  const [accelerators] = useState(mockAccelerators);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this accelerator?')) {
      console.log('Delete accelerator:', id);
      // API call to delete
    }
  };

  const handleTogglePublish = (id: string) => {
    console.log('Toggle publish status:', id);
    // API call to toggle
  };

  const handleToggleStatus = (id: string) => {
    console.log('Toggle active status:', id);
    // API call to change status
  };

  return (
    <div className="accelerator-list">
      {/* Header */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Accelerators</h2>
          <span className="list-count">{accelerators.length} Total</span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Accelerator
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.length}</div>
            <div className="stat-label">Total Accelerators</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter(a => a.published).length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter(a => a.featured).length}</div>
            <div className="stat-label">Featured</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.reduce((sum, a) => sum + a.downloads, 0).toLocaleString()}</div>
            <div className="stat-label">Total Downloads</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="accelerator-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Source Tech</th>
              <th>Version</th>
              <th>Status</th>
              <th>Downloads</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accelerators.map((accelerator) => (
              <tr key={accelerator.id}>
                <td>
                  <div className="title-cell">
                    {accelerator.name}
                    {accelerator.featured && <span className="featured-badge">Featured</span>}
                  </div>
                </td>
                <td>
                  <span className="category-tag">{accelerator.category}</span>
                </td>
                <td>{accelerator.sourceTech}</td>
                <td>
                  <span className="version-badge">v{accelerator.version}</span>
                </td>
                <td>
                  <div className="status-buttons">
                    <button 
                      className={`status-badge ${accelerator.status}`}
                      onClick={() => handleToggleStatus(accelerator.id)}
                      title="Click to change status"
                    >
                      {accelerator.status}
                    </button>
                    <button 
                      className={`publish-badge ${accelerator.published ? 'published' : 'draft'}`}
                      onClick={() => handleTogglePublish(accelerator.id)}
                      title="Click to toggle publish"
                    >
                      {accelerator.published ? 'Published' : 'Draft'}
                    </button>
                  </div>
                </td>
                <td>{accelerator.downloads.toLocaleString()}</td>
                <td>{accelerator.views.toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-button edit"
                      onClick={() => onEdit(accelerator.id)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(accelerator.id)}
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

export default AcceleratorList;

