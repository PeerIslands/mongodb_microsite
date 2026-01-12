import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import '@/styles/features/home/CaseStudies.css';
import caseStudiesBg from '@/assets/case-studies-bg.png';
import { caseStudiesService } from '@/api/services/case-studies.service';
import type { CaseStudy } from '@/types/models/case-study';
import { CaseStudyCard } from '@/features/case-studies/components';
import type { CaseStudyCardData } from '@/features/case-studies/components';

/**
 * Transform API response to CaseStudyCardData format
 */
const transformToCaseStudyCardData = (caseStudy: CaseStudy): CaseStudyCardData => ({
  id: caseStudy.id,
  slug: caseStudy.slug,
  industry: caseStudy.industry,
  title: caseStudy.title,
  description: caseStudy.description,
  metrics: caseStudy.metrics || [],
});

const CaseStudies = () => {
  const navigate = useNavigate();
  const [featuredCaseStudies, setFeaturedCaseStudies] = useState<CaseStudyCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // Handle case study card click - navigate to success-stories with ID
  const handleCaseStudyClick = (caseStudyId: string) => {
    navigate(`/success-stories?id=${caseStudyId}`);
  };

  // Fetch featured case studies on mount
  useEffect(() => {
    const fetchFeaturedCaseStudies = async () => {
      try {
        setIsLoading(true);
        const data = await caseStudiesService.getAll({ featured: true, status: 'published' });
        setFeaturedCaseStudies(data.map(transformToCaseStudyCardData));
      } catch (err) {
        console.error('Failed to fetch featured case studies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedCaseStudies();
  }, []);

  const showCarouselControls = featuredCaseStudies.length > 2;

  // Render loading state
  const renderLoading = () => (
    <div className="case-studies-loading">
      <div className="case-studies-loading__spinner" />
      <p>Loading case studies...</p>
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="case-studies-empty">
      <p>No featured case studies available.</p>
    </div>
  );

  // Render case study cards with Swiper
  const renderCaseStudyCards = () => (
    <div className="case-studies-carousel-wrapper">
      {showCarouselControls && (
        <button 
          className="case-studies-carousel-arrow case-studies-carousel-arrow-left"
          onClick={() => swiperInstance?.slidePrev()}
          aria-label="Previous case studies"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <Swiper
        modules={[Navigation]}
        spaceBetween={24}
        slidesPerView={1}
        loop={featuredCaseStudies.length > 2}
        speed={600}
        breakpoints={{
          640: {
            slidesPerView: 1.5,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 2.5,
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
        }}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        className="case-studies-swiper"
      >
        {featuredCaseStudies.map((caseStudy) => (
          <SwiperSlide key={caseStudy.id} className="case-study-slide">
            <button 
              type="button"
              className="case-study-card-button"
              onClick={() => handleCaseStudyClick(caseStudy.id)}
              aria-label={`View details for ${caseStudy.title}`}
            >
              <CaseStudyCard data={caseStudy} />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {showCarouselControls && (
        <button 
          className="case-studies-carousel-arrow case-studies-carousel-arrow-right"
          onClick={() => swiperInstance?.slideNext()}
          aria-label="Next case studies"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <section id="case-studies" className="case-studies">
      {/* Background image */}
      <div className="case-studies-background">
        <img 
          src={caseStudiesBg} 
          alt="" 
          className="case-studies-bg-image"
        />
      </div>
      
      {/* Title */}
      <h2 className="case-studies-title">
        <span>Featured</span>
        <span>Case Studies</span>
      </h2>
      
      {/* Cards - show loading, empty, or cards */}
      {isLoading 
        ? renderLoading()
        : featuredCaseStudies.length === 0
          ? renderEmpty()
          : renderCaseStudyCards()
      }
    </section>
  );
};

export default CaseStudies;
