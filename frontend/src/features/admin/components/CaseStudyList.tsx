import { useState, useEffect, useRef } from 'react';
import '@/styles/features/admin/CaseStudyList.css';
import { caseStudiesService } from '@/api/services/case-studies.service';

interface CaseStudyListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

// Interface for API response (snake_case from backend)
interface CaseStudyApiResponse {
  id: string;
  title: string;
  slug: string;
  industry: string;
  tech_stack: string[];
  migration_type?: string;
  status: 'published' | 'draft';
  featured: boolean;
  created_at: string;
  updated_at: string;
  company_name: string;
  company_logo: string;
  hero_image: string;
  description: string;
}

const CaseStudyList = ({ onAddNew, onEdit }: CaseStudyListProps) => {
  const [caseStudies, setCaseStudies] = useState<CaseStudyApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch case studies on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseStudiesService.getAll();
      // API returns snake_case, cast to our interface
      setCaseStudies(data as unknown as CaseStudyApiResponse[]);
    } catch (err) {
      console.error('Failed to fetch case studies:', err);
      setError('Failed to load case studies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this case study?')) {
      try {
        await caseStudiesService.delete(id);
        // Refresh the list after deletion
        fetchCaseStudies();
      } catch (err) {
        console.error('Failed to delete case study:', err);
        alert('Failed to delete case study. Please try again.');
      }
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const formData = new FormData();
      formData.append('status', newStatus);
      await caseStudiesService.update(id, formData);
      // Refresh the list after update
      fetchCaseStudies();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="case-study-list">
        <div className="loading-state">Loading case studies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="case-study-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchCaseStudies} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            <div className="stat-value">{caseStudies.filter(cs => cs.status === 'published').length}</div>
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
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{caseStudies.filter(cs => cs.status === 'draft').length}</div>
            <div className="stat-label">Drafts</div>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {caseStudies.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No case studies found. Click "Add New Case Study" to create one.
                </td>
              </tr>
            ) : (
              caseStudies.map((caseStudy) => (
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
                      {caseStudy.tech_stack?.map((tech, idx) => (
                        <span key={idx} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </td>
                  <td>{caseStudy.migration_type || '-'}</td>
                  <td>
                    <button 
                      className={`status-badge ${caseStudy.status === 'published' ? 'published' : 'draft'}`}
                      onClick={() => handleTogglePublish(caseStudy.id, caseStudy.status)}
                    >
                      {caseStudy.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>{new Date(caseStudy.created_at).toLocaleDateString()}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CaseStudyList;

