import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
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

const navItems: { key: MainView; icon: string; label: string }[] = [
  { key: 'cases', icon: '📚', label: 'Case Studies' },
  { key: 'accelerators', icon: '🚀', label: 'Accelerators' },
  { key: 'blogs', icon: '📝', label: 'Blogs' },
  { key: 'events', icon: '📅', label: 'Events' },
  { key: 'analytics', icon: '📊', label: 'Analytics' },
  { key: 'emailtemplates', icon: '📭', label: 'Newsletters' },
];

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

  // Callback for when list components finish loading
  const handleLoadComplete = () => {
    setIsTabLoading(false);
  };
  const swiperRef = useRef<SwiperType | null>(null);

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
    // Skip loader for analytics (static) and emailtemplates (has its own loader)
    if (view !== mainView && view !== 'analytics' && view !== 'emailtemplates') {
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
      {/* Desktop Navigation - visible on desktop only */}
      <div className="main-navigation main-navigation-desktop">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`main-nav-tab ${mainView === item.key ? 'active' : ''}`}
            onClick={() => handleMainViewChange(item.key)}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Mobile/Tablet Navigation Carousel */}
      <div className="main-navigation-carousel">
        <button
          className="admin-nav-arrow admin-nav-arrow-left"
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Previous tab"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <Swiper
          modules={[Navigation]}
          spaceBetween={8}
          slidesPerView="auto"
          centeredSlides={false}
          initialSlide={0}
          loop={false}
          rewind={false}
          watchOverflow={true}
          resistance={true}
          resistanceRatio={0}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          className="admin-nav-swiper"
        >
          {navItems.map((item) => (
            <SwiperSlide key={item.key} className="admin-nav-slide">
              <button
                className={`main-nav-tab ${mainView === item.key ? 'active' : ''}`}
                onClick={() => handleMainViewChange(item.key)}
              >
                {item.icon} {item.label}
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          className="admin-nav-arrow admin-nav-arrow-right"
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next tab"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

        {/* Loading Overlay */}
        {isTabLoading && <LeafLoader message={loadingMessage} />}

        {/* Content - rendered immediately so components can fetch and call onLoadComplete */}
        {mainView === 'cases' && (
          <>
            {caseView === 'list' && (
              <CaseStudyList onAddNew={handleCaseAddNew} onEdit={handleCaseEdit} onLoadComplete={handleLoadComplete} />
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
              <AcceleratorList onAddNew={handleAccAddNew} onEdit={handleAccEdit} onLoadComplete={handleLoadComplete} />
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
              <BlogList onAddNew={handleBlogAddNew} onEdit={handleBlogEdit} onLoadComplete={handleLoadComplete} />
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

        {mainView === 'events' && (
          <>
            {eventView === 'list' && (
              <EventList onAddNew={handleEventAddNew} onEdit={handleEventEdit} onLoadComplete={handleLoadComplete} />
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
        
        {mainView === 'analytics' && <AnalyticsDashboard />}
        
        {mainView === 'emailtemplates' && (
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
