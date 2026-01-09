import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';
import '@/styles/features/home/CaseStudies.css';
import caseStudiesBg from '@/assets/case-studies-bg.png';
import arrowIcon from '@/assets/case-studies-arrow.svg';
import caseStudyCard1 from '@/assets/case-study-card-1.png';
import caseStudyCard2 from '@/assets/case-study-card-2.png';
import { caseStudiesService } from '@/api/services/case-studies.service';
import type { CaseStudy } from '@/types/models/case-study';

const CaseStudies = () => {
  const [featuredCaseStudies, setFeaturedCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // Fetch featured case studies on mount
  useEffect(() => {
    const fetchFeaturedCaseStudies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await caseStudiesService.getAll({ featured: true });
        setFeaturedCaseStudies(data);
      } catch (err) {
        console.error('Failed to fetch featured case studies:', err);
        setError('Failed to load case studies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedCaseStudies();
  }, []);

  const showCarouselControls = featuredCaseStudies.length > 2;

  // Render static fallback (original design)
  const renderFallback = () => (
    <div className="case-studies-cards">
      <div className="case-study-card case-study-card-1">
        <div className="case-study-card-gradient"></div>
        <div className="case-study-card-image-container">
          <img src={caseStudyCard1} alt="" className="case-study-card-image" />
        </div>
        <div className="case-study-button-container">
          <Link to="/case-studies" className="case-study-button">
            <div className="case-study-button-icon">
              <img src={arrowIcon} alt="" className="case-study-arrow" />
            </div>
          </Link>
        </div>
      </div>
      
      <div className="case-study-card case-study-card-2">
        <div className="case-study-card-gradient"></div>
        <div className="case-study-card-image-container">
          <img src={caseStudyCard2} alt="" className="case-study-card-image" />
        </div>
        <div className="case-study-button-container">
          <Link to="/case-studies" className="case-study-button">
            <div className="case-study-button-icon">
              <img src={arrowIcon} alt="" className="case-study-arrow" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  // Render dynamic case study cards with Swiper
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
        modules={[Navigation, EffectCoverflow]}
        spaceBetween={24}
        slidesPerView={1}
        loop={featuredCaseStudies.length > 2}
        speed={600}
        effect={featuredCaseStudies.length > 2 ? 'coverflow' : undefined}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
        breakpoints={{
          768: {
            slidesPerView: 2,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 2,
            spaceBetween: 40,
          },
        }}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        className="case-studies-swiper"
      >
        {featuredCaseStudies.map((caseStudy, index) => (
          <SwiperSlide key={caseStudy.id} className="case-study-slide">
            <div className="case-study-card">
              <div className="case-study-card-gradient"></div>
              <div className="case-study-card-image-container">
                <img 
                  src={caseStudy.hero_image} 
                  alt={caseStudy.title}
                  className="case-study-card-image"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    const target = e.target as HTMLImageElement;
                    target.src = index % 2 === 0 ? caseStudyCard1 : caseStudyCard2;
                  }}
                />
              </div>
              <div className="case-study-button-container">
                <Link to={`/case-studies/${caseStudy.slug}`} className="case-study-button">
                  <div className="case-study-button-icon">
                    <img src={arrowIcon} alt="" className="case-study-arrow" />
                  </div>
                </Link>
              </div>
            </div>
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
    <section className="case-studies">
      {/* Background image - matches Figma node 17:1577 */}
      <div className="case-studies-background">
        <img 
          src={caseStudiesBg} 
          alt="" 
          className="case-studies-bg-image"
          onError={(e) => {
            console.error('Failed to load case studies background image:', e);
          }}
          onLoad={() => {
            console.log('Case studies background image loaded successfully');
          }}
        />
      </div>
      
      {/* Title - matches Figma node 17:1578 */}
      <h2 className="case-studies-title">
        <span>Featured</span>
        <span>Case Studies</span>
      </h2>
      
      {/* Cards - show API data or fallback */}
      {isLoading || error || featuredCaseStudies.length === 0
        ? renderFallback()
        : renderCaseStudyCards()
      }
    </section>
  );
};

export default CaseStudies;
