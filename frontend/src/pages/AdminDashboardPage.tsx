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
  const handleEmailTemplateAddNew = () => {
    setEditingEmailTemplateId(null);
    setEmailTemplateView('add');
  };

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

  // Get current index for swiper
  const currentIndex = navItems.findIndex(item => item.key === mainView);

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

      {mainView === 'events' && (
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
      
      {mainView === 'analytics' && <AnalyticsDashboard />}
      
      {mainView === 'emailtemplates' && (
        <>
          {emailTemplateView === 'list' && (
            <EmailTemplateList 
              onAddNew={handleEmailTemplateAddNew} 
              onEdit={handleEmailTemplateEdit} 
              onUploadHTML={handleEmailTemplateUpload}
            />
          )}
          {(emailTemplateView === 'add' || emailTemplateView === 'edit' || emailTemplateView === 'upload') && (
            <EmailTemplateForm 
              editingId={editingEmailTemplateId} 
              mode={emailTemplateView === 'add' ? 'create' : emailTemplateView as 'edit' | 'upload'}
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
