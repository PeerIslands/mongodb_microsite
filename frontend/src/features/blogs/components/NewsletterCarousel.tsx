/**
 * Newsletter Carousel Component
 * Displays active newsletters in a Swiper carousel
 * Includes newsletter access control
 */

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import NewsletterCard from './NewsletterCard';
import { PreviewModal } from '@/features/admin/components/PreviewModal';
import { newsletterService } from '@/api/services/newsletter.service';
import { newsletterAccessService } from '@/api/services/newsletter-access.service';
import { Newsletter } from '@/types/newsletter';
import { useAuthModal } from '@/contexts/AuthModalContext';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/features/blogs/NewsletterCarousel.css';

const NewsletterCarousel = () => {
  const { openLoginModal } = useAuthModal();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // Get user email from localStorage (if logged in)
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
    fetchNewsletters(email);
  }, []);

  const fetchNewsletters = async (email: string | null) => {
    try {
      setLoading(true);
      console.log('📬 Fetching newsletters from:', '/api/v1/email-templates/newsletters');
      console.log('📬 API Base URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('📬 User email:', email || 'Not logged in');
      
      const data = await newsletterService.getAllNewsletters(email);
      console.log('📬 Newsletters received:', data.length, 'items');
      setNewsletters(data);
      setError(null);
      
      // Check if there's a pending request for this user
      if (email && data.length > 0 && !data[0].has_access) {
        try {
          const accessStatus = await newsletterAccessService.checkAccess(email);
          setRequestPending(accessStatus.pending_request);
        } catch (err) {
          console.error('Failed to check access status:', err);
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching newsletters:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Request URL:', err.config?.url);
      console.error('❌ Full URL:', err.config?.baseURL + err.config?.url);
      console.error('❌ Error details:', err.response?.data || err.message);
      setError('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
  };

  const handleCloseModal = () => {
    setSelectedNewsletter(null);
  };

  const handleRequestAccess = async () => {
    // If not logged in, show login prompt
    if (!userEmail) {
      setShowLoginPrompt(true);
      return;
    }

    // User is logged in, proceed with request
    try {
      await newsletterAccessService.requestAccess({
        user_email: userEmail,
        newsletter_id: undefined // Request access to all newsletters
      });
      
      setRequestPending(true);
      alert('Access request submitted successfully! You will be notified once an admin approves your request.');
    } catch (err: any) {
      console.error('Failed to request access:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to submit access request';
      alert(errorMessage);
    }
  };

  const handleLoginRedirect = () => {
    // Close the preview modal
    setSelectedNewsletter(null);
    setShowLoginPrompt(false);
    
    // Open login modal with callback to reload newsletters after login
    openLoginModal(() => {
      // After successful login, reload the page to update user state
      // The page reload will fetch newsletters with the user's email
      window.location.reload();
    });
  };

  if (loading) {
    return (
      <section className="newsletter-carousel-section">
        <div className="newsletter-carousel__container">
          <h2 className="newsletter-carousel__title">
            PeerIslands <span className="newsletter-carousel__title-gradient">Newsletter</span>
          </h2>
          <div className="newsletter-carousel__loading">
            <div className="newsletter-carousel__spinner" />
            <p>Loading newsletters...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    // Show error for debugging
    return (
      <section className="newsletter-carousel-section">
        <div className="newsletter-carousel__container">
          <h2 className="newsletter-carousel__title">
            PeerIslands <span className="newsletter-carousel__title-gradient">Newsletter</span>
          </h2>
          <div className="newsletter-carousel__error" style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
            <p>{error}</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Check console for details</p>
          </div>
        </div>
      </section>
    );
  }

  if (newsletters.length === 0) {
    return null; // Don't show section if there are no newsletters
  }

  return (
    <>
      <section className="newsletter-carousel-section">
        <div className="newsletter-carousel__container">
          <h2 className="newsletter-carousel__title">
            PeerIslands <span className="newsletter-carousel__title-gradient">Newsletter</span>
          </h2>
          
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={newsletters.length > 3}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 28,
              },
            }}
            className="newsletter-carousel__swiper"
          >
            {newsletters.map((newsletter) => (
              <SwiperSlide key={newsletter._id}>
                <NewsletterCard 
                  newsletter={newsletter} 
                  onClick={() => handleCardClick(newsletter)} 
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Preview Modal - Insights Page Custom Styling with Access Control */}
      <PreviewModal
        isOpen={!!selectedNewsletter}
        onClose={handleCloseModal}
        title={selectedNewsletter?.subject || 'Newsletter'}
        htmlContent={selectedNewsletter?.html_content || null}
        className="newsletter-insights-modal"
        hasAccess={selectedNewsletter?.has_access !== false}
        onRequestAccess={handleRequestAccess}
        requestPending={requestPending}
        showLoginPrompt={showLoginPrompt}
        onLoginRedirect={handleLoginRedirect}
      />
    </>
  );
};

export default NewsletterCarousel;

