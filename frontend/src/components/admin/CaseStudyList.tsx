import { useState } from 'react';
import '@/styles/components/admin/CaseStudyList.css';

interface CaseStudyListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

// Mock data - will be replaced with API calls
const mockCaseStudies = [
  {
    id: '1',
    title: 'Healthcare Provider Migration',
    industry: 'Healthcare',
    techStack: ['MongoDB', 'Node.js', 'React'],
    migrationType: 'SQL to MongoDB',
    published: true,
    featured: true,
    createdAt: '2024-01-15',
    views: 1234
  },
  {
    id: '2',
    title: 'E-commerce Platform Modernization',
    industry: 'E-commerce',
    techStack: ['MongoDB', 'Python', 'Vue.js'],
    migrationType: 'Cloud Migration',
    published: true,
    featured: false,
    createdAt: '2024-02-20',
    views: 856
  },
  {
    id: '3',
    title: 'Financial Services Data Lake',
    industry: 'Finance',
    techStack: ['MongoDB', 'Kafka', 'Spark'],
    migrationType: 'Modernization',
    published: false,
    featured: false,
    createdAt: '2024-03-10',
    views: 0
  }
];

const CaseStudyList = ({ onAddNew, onEdit }: CaseStudyListProps) => {
  const [caseStudies] = useState(mockCaseStudies);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this case study?')) {
      // API call to delete
      console.log('Delete case study:', id);
    }
  };

  const handleTogglePublish = (id: string) => {
    // API call to toggle published status
    console.log('Toggle publish status:', id);
  };

  return (
    <div className="case-study-list">
      {/* Header Section */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Case Studies</h2>
          <span className="list-count">{caseStudies.length} Total</span>
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Case Study
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{caseStudies.length}</div>
            <div className="stat-label">Total Case Studies</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{caseStudies.filter(cs => cs.published).length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{caseStudies.filter(cs => cs.featured).length}</div>
            <div className="stat-label">Featured</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-value">{caseStudies.reduce((sum, cs) => sum + cs.views, 0)}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="case-study-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Industry</th>
              <th>Tech Stack</th>
              <th>Migration Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {caseStudies.map((caseStudy) => (
              <tr key={caseStudy.id}>
                <td>
                  <div className="title-cell">
                    {caseStudy.title}
                    {caseStudy.featured && <span className="featured-badge">Featured</span>}
                  </div>
                </td>
                <td>{caseStudy.industry}</td>
                <td>
                  <div className="tech-tags">
                    {caseStudy.techStack.map((tech, idx) => (
                      <span key={idx} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </td>
                <td>{caseStudy.migrationType}</td>
                <td>
                  <button 
                    className={`status-badge ${caseStudy.published ? 'published' : 'draft'}`}
                    onClick={() => handleTogglePublish(caseStudy.id)}
                  >
                    {caseStudy.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td>{new Date(caseStudy.createdAt).toLocaleDateString()}</td>
                <td>{caseStudy.views.toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-button edit"
                      onClick={() => onEdit(caseStudy.id)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(caseStudy.id)}
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

export default CaseStudyList;


