import { useState } from 'react';
import '@/styles/pages/AdminDashboard.css';
import AdminLayout from '../components/admin/AdminLayout';
import CaseStudyList from '../components/admin/CaseStudyList';
import CaseStudyForm from '../components/admin/CaseStudyForm';
import AcceleratorList from '../components/admin/AcceleratorList';
import AcceleratorForm from '../components/admin/AcceleratorForm';
import BlogList from '../components/admin/BlogList';
import BlogForm from '../components/admin/BlogForm';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';

type MainView = 'cases' | 'accelerators' | 'blogs' | 'analytics';
type SubView = 'list' | 'add' | 'edit';

const AdminDashboard = () => {
  const [mainView, setMainView] = useState<MainView>('cases');
  const [caseView, setCaseView] = useState<SubView>('list');
  const [accView, setAccView] = useState<SubView>('list');
  const [blogView, setBlogView] = useState<SubView>('list');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  // Case Study handlers
  const handleCaseAddNew = () => {
    setEditingCaseId(null);
    setCaseView('add');
  };

  const handleCaseEdit = (id: string) => {
    setEditingCaseId(id);
    setCaseView('edit');
  };

  const handleCaseBackToList = () => {
    setCaseView('list');
    setEditingCaseId(null);
  };

  // Accelerator handlers
  const handleAccAddNew = () => {
    setEditingAccId(null);
    setAccView('add');
  };

  const handleAccEdit = (id: string) => {
    setEditingAccId(id);
    setAccView('edit');
  };

  const handleAccBackToList = () => {
    setAccView('list');
    setEditingAccId(null);
  };

  // Blog handlers
  const handleBlogAddNew = () => {
    setEditingBlogId(null);
    setBlogView('add');
  };

  const handleBlogEdit = (id: string) => {
    setEditingBlogId(id);
    setBlogView('edit');
  };

  const handleBlogBackToList = () => {
    setBlogView('list');
    setEditingBlogId(null);
  };

  // Main view change
  const handleMainViewChange = (view: MainView) => {
    setMainView(view);
    if (view === 'cases') {
      setCaseView('list');
      setEditingCaseId(null);
    } else if (view === 'accelerators') {
      setAccView('list');
      setEditingAccId(null);
    } else if (view === 'blogs') {
      setBlogView('list');
      setEditingBlogId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        {/* Main Navigation */}
        <div className="main-navigation">
          <button
            className={`main-nav-tab ${mainView === 'cases' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('cases')}
          >
            📚 Case Studies
          </button>
          <button
            className={`main-nav-tab ${mainView === 'accelerators' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('accelerators')}
          >
            🚀 Accelerators
          </button>
          <button
            className={`main-nav-tab ${mainView === 'blogs' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('blogs')}
          >
            📝 Blogs
          </button>
          <button
            className={`main-nav-tab ${mainView === 'analytics' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('analytics')}
          >
            📊 Analytics
          </button>
        </div>

        {/* Content */}
        {mainView === 'cases' && (
          <>
            {caseView === 'list' && (
              <CaseStudyList onAddNew={handleCaseAddNew} onEdit={handleCaseEdit} />
            )}
            {(caseView === 'add' || caseView === 'edit') && (
              <CaseStudyForm 
                editingId={editingCaseId} 
                onCancel={handleCaseBackToList}
                onSuccess={handleCaseBackToList}
              />
            )}
          </>
        )}
        
        {mainView === 'accelerators' && (
          <>
            {accView === 'list' && (
              <AcceleratorList onAddNew={handleAccAddNew} onEdit={handleAccEdit} />
            )}
            {(accView === 'add' || accView === 'edit') && (
              <AcceleratorForm 
                editingId={editingAccId} 
                onCancel={handleAccBackToList}
                onSuccess={handleAccBackToList}
              />
            )}
          </>
        )}
        
        {mainView === 'blogs' && (
          <>
            {blogView === 'list' && (
              <BlogList onAddNew={handleBlogAddNew} onEdit={handleBlogEdit} />
            )}
            {(blogView === 'add' || blogView === 'edit') && (
              <BlogForm 
                editingId={editingBlogId} 
                onCancel={handleBlogBackToList}
                onSuccess={handleBlogBackToList}
              />
            )}
          </>
        )}
        
        {mainView === 'analytics' && <AnalyticsDashboard />}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

