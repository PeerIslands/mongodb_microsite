import { useState, useEffect } from 'react';
import '@/styles/pages/AdminDashboardPage.css';
import {
  CaseStudyList,
  CaseStudyForm,
  AcceleratorList,
  AcceleratorForm,
  BlogList,
  BlogForm,
  EventList,
  EventForm,
  AnalyticsDashboard,
  EmailTemplateList,
  EmailTemplateForm,
} from '@/features/admin/components';
import LeafLoader from '@/components/LeafLoader';

type MainView = 'cases' | 'accelerators' | 'blogs' | 'events' | 'analytics' | 'emailtemplates';
type SubView = 'list' | 'add' | 'edit' | 'upload';

const AdminDashboard = () => {
  const [mainView, setMainView] = useState<MainView>('cases');
  const [caseView, setCaseView] = useState<SubView>('list');
  const [accView, setAccView] = useState<SubView>('list');
  const [blogView, setBlogView] = useState<SubView>('list');
  const [eventView, setEventView] = useState<SubView>('list');
  const [emailTemplateView, setEmailTemplateView] = useState<SubView>('list');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEmailTemplateId, setEditingEmailTemplateId] = useState<string | null>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // Loading message map for each tab
  const getLoadingMessage = (view: MainView): string => {
    const messages: Record<MainView, string> = {
      cases: 'Loading Case Studies...',
      accelerators: 'Loading Accelerators...',
      blogs: 'Loading Blogs...',
      events: 'Loading Events...',
      analytics: 'Loading Analytics...',
      emailtemplates: 'Loading Newsletters...',
    };
    return messages[view];
  };

  // Effect to handle tab loading transition
  useEffect(() => {
    if (isTabLoading) {
      const timer = setTimeout(() => {
        setIsTabLoading(false);
      }, 500); // Brief loading transition
      return () => clearTimeout(timer);
    }
  }, [isTabLoading]);

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

  // Event handlers
  const handleEventAddNew = () => {
    setEditingEventId(null);
    setEventView('add');
  };

  const handleEventEdit = (id: string) => {
    setEditingEventId(id);
    setEventView('edit');
  };

  const handleEventBackToList = () => {
    setEventView('list');
    setEditingEventId(null);
  };

  // Email Template handlers
  const handleEmailTemplateUpload = () => {
    setEditingEmailTemplateId(null);
    setEmailTemplateView('upload');
  };

  const handleEmailTemplateEdit = (id: string) => {
    setEditingEmailTemplateId(id);
    setEmailTemplateView('edit');
  };

  const handleEmailTemplateBackToList = () => {
    setEmailTemplateView('list');
    setEditingEmailTemplateId(null);
  };

  // Main view change
  const handleMainViewChange = (view: MainView) => {
    // Only show loader if switching to a different tab
    if (view !== mainView) {
      setLoadingMessage(getLoadingMessage(view));
      setIsTabLoading(true);
    }
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
    } else if (view === 'events') {
      setEventView('list');
      setEditingEventId(null);
    } else if (view === 'emailtemplates') {
      setEmailTemplateView('list');
      setEditingEmailTemplateId(null);
    }
  };

  return (
    <div className="admin-dashboard">
        {/* Main Navigation */}
        <div className="main-navigation">
          <button
            className={`main-nav-tab ${mainView === 'cases' ? 'active' : ''}`}
            onClick={() => { handleMainViewChange('cases'); console.log('cases') }}
          >
            📚 Case Studies
          </button>
          <button
            className={`main-nav-tab ${mainView === 'accelerators' ? 'active' : ''}`}
            onClick={() => { handleMainViewChange('accelerators'); console.log('accelerators') }}
          >
            🚀 Accelerators
          </button>
          <button
            className={`main-nav-tab ${mainView === 'blogs' ? 'active' : ''}`}
            onClick={() => { handleMainViewChange('blogs'); console.log('blogs') }}
          >
            📝 Blogs
          </button>
          <button
            className={`main-nav-tab ${mainView === 'events' ? 'active' : ''}`}
            onClick={() => { handleMainViewChange('events'); console.log('events') }}
          >
            📅 Events
          </button>
          <button
            className={`main-nav-tab ${mainView === 'analytics' ? 'active' : ''}`}
            onClick={() => { handleMainViewChange('analytics'); console.log('analytics') }}
          >
            📊 Analytics
          </button>
          <button
            className={`main-nav-tab ${mainView === 'emailtemplates' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('emailtemplates')}
          >
            📭 Newsletters
          </button>
        </div>

        {/* Content */}
        {isTabLoading && <LeafLoader message={loadingMessage} />}
        
        {!isTabLoading && mainView === 'cases' && (
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
        
        {!isTabLoading && mainView === 'accelerators' && (
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
        
        {!isTabLoading && mainView === 'blogs' && (
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

        {!isTabLoading && mainView === 'events' && (
          <>
            {eventView === 'list' && (
              <EventList onAddNew={handleEventAddNew} onEdit={handleEventEdit} />
            )}
            {(eventView === 'add' || eventView === 'edit') && (
              <EventForm 
                editingId={editingEventId} 
                onCancel={handleEventBackToList}
                onSuccess={handleEventBackToList}
              />
            )}
          </>
        )}
        
        {!isTabLoading && mainView === 'analytics' && <AnalyticsDashboard />}
        
        {!isTabLoading && mainView === 'emailtemplates' && (
          <>
            {emailTemplateView === 'list' && (
              <EmailTemplateList 
                onEdit={handleEmailTemplateEdit}
                onUploadHTML={handleEmailTemplateUpload}
              />
            )}
            {(emailTemplateView === 'edit' || emailTemplateView === 'upload') && (
              <EmailTemplateForm 
                editingId={editingEmailTemplateId}
                mode={emailTemplateView as 'edit' | 'upload'}
                onCancel={handleEmailTemplateBackToList}
                onSuccess={handleEmailTemplateBackToList}
              />
            )}
          </>
        )}
      </div>
  );
};

export default AdminDashboard;

