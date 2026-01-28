/**
 * Newsletter Carousel Component
 * Displays active newsletters in a Swiper carousel
 */

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import NewsletterCard from './NewsletterCard';
import { PreviewModal } from '@/features/admin/components/PreviewModal';
import { newsletterService } from '@/api/services/newsletter.service';
import { Newsletter } from '@/types/newsletter';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/features/blogs/NewsletterCarousel.css';

const NewsletterCarousel = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      console.log('📬 Fetching newsletters from:', '/api/v1/email-templates/newsletters');
      console.log('📬 API Base URL:', import.meta.env.VITE_API_BASE_URL);
      const data = await newsletterService.getAllNewsletters();
      console.log('📬 Newsletters received:', data.length, 'items');
      setNewsletters(data);
      setError(null);
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

      {/* Preview Modal - Insights Page Custom Styling */}
      <PreviewModal
        isOpen={!!selectedNewsletter}
        onClose={handleCloseModal}
        title={selectedNewsletter?.subject || 'Newsletter'}
        htmlContent={selectedNewsletter?.html_content || ''}
        className="newsletter-insights-modal"
      />
    </>
  );
};

export default NewsletterCarousel;

