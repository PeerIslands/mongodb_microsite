import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import CaseStudyCard, { CaseStudyCardData } from './CaseStudyCard';
import LeafLoader from '@/components/LeafLoader';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/features/case-studies/CaseStudyArchitecture.css';

// Keep the old interface exports for backward compatibility
export interface ArchitectureColumn {
  title: string;
  description: string;
}

export interface CaseStudyArchitectureData {
  sectionTitle: string;
  subtitle: string;
  legacyColumn: ArchitectureColumn;
  targetColumn: ArchitectureColumn;
}

// New interface for the redesigned section
export interface SuccessStoriesHeroData {
  badge: string;
  title: {
    prefix: string;
    highlight: string;
    suffix: string;
  };
  subtitle: string;
  stats: {
    value: string;
    label: string;
    isHighlighted?: boolean;
  }[];
}

export interface FeaturedStoriesData {
  sectionTitle: {
    prefix: string;
    highlight: string;
    suffix: string;
  };
  badge: string;
  subtitle: string;
}

interface CaseStudyArchitectureProps {
  // Old props (kept for backward compatibility but not used in new design)
  data?: CaseStudyArchitectureData;
  // New props for redesigned section
  heroData?: SuccessStoriesHeroData;
  featuredData?: FeaturedStoriesData;
  caseStudies?: CaseStudyCardData[];
  // Loading state
  isLoading?: boolean;
  // Callback when a card is clicked
  onCardClick?: (caseStudyId: string) => void;
}

// Default mock data for hero section
const defaultHeroData: SuccessStoriesHeroData = {
  badge: 'Success Stories',
  title: {
    prefix: 'Real',
    highlight: 'Transformations',
    suffix: 'Real Results',
  },
  subtitle:
    'Discover how organizations across industries have achieved breakthrough results with our AI-powered Service as Software approach',
  stats: [
    { value: '100+', label: 'Projects Delivered' },
    { value: '$50M+', label: 'Cost Savings', isHighlighted: true },
    { value: '75%', label: 'Avg. Time Reduction' },
  ],
};

// Default mock data for featured section
const defaultFeaturedData: FeaturedStoriesData = {
  sectionTitle: {
    prefix: 'FEATURED',
    highlight: 'SUCCESS',
    suffix: 'STORIES',
  },
  badge: 'Featured Projects',
  subtitle:
    'Discover how PeerIslands transforms businesses across industries with real results and proven impact',
};

/**
 * CaseStudyArchitecture - Redesigned to show Success Stories Hero + Featured Carousel
 * Displays static hero section with stats and a swiper carousel of featured case studies
 */
const CaseStudyArchitecture = ({
  heroData = defaultHeroData,
  featuredData = defaultFeaturedData,
  caseStudies = [],
  isLoading = false,
  onCardClick,
}: CaseStudyArchitectureProps) => {
  const swiperRef = useRef<SwiperType | null>(null);

  const handlePrev = () => {
    swiperRef.current?.slidePrev();
  };

  const handleNext = () => {
    swiperRef.current?.slideNext();
  };

  const handleCardClick = (caseStudyId: string) => {
    if (onCardClick) {
      onCardClick(caseStudyId);
    }
  };

  return (
    <section className="success-stories">
      {/* Background gradient effects */}
      <div className="success-stories__bg-gradient success-stories__bg-gradient--left" />
      <div className="success-stories__bg-gradient success-stories__bg-gradient--right" />

      {/* ===== HERO SECTION ===== */}
      <div className="success-stories__hero">
        <div className="success-stories__hero-container">
          {/* Title */}
          <h1 className="success-stories__title">
            {heroData.title.prefix}{' '}
            <span className="success-stories__title-highlight">{heroData.title.highlight}</span>{' '}
            {heroData.title.suffix}
          </h1>

          {/* Subtitle */}
          <p className="success-stories__subtitle">{heroData.subtitle}</p>

          {/* Stats */}
          <div className="success-stories__stats">
            {heroData.stats.map((stat, index) => (
              <div key={index} className="success-stories__stat">
                <span
                  className={`success-stories__stat-value ${stat.isHighlighted ? 'success-stories__stat-value--highlighted' : ''}`}
                >
                  {stat.value}
                </span>
                <span className="success-stories__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FEATURED STORIES SECTION ===== */}
      <div className="featured-stories">
        <div className="featured-stories__container">
          {/* Header */}
          <div className="featured-stories__header">
            <h2 className="featured-stories__title">
              {featuredData.sectionTitle.prefix}{' '}
              <span className="featured-stories__title-highlight">
                {featuredData.sectionTitle.highlight}
              </span>{' '}
              {featuredData.sectionTitle.suffix}
            </h2>
          </div>

          {/* Subtitle */}
          <p className="featured-stories__subtitle">{featuredData.subtitle}</p>

          {/* Carousel Container */}
          <div className="featured-stories__carousel-wrapper">
            {/* Loading State */}
            {isLoading && <LeafLoader message="Loading case studies..." />}

            {/* Empty State */}
            {!isLoading && caseStudies.length === 0 && (
              <div className="featured-stories__empty">
                <p>No case studies available.</p>
              </div>
            )}

            {/* Carousel with case studies */}
            {!isLoading && caseStudies.length > 0 && (
              <>
                {/* Navigation - Previous */}
                <button
                  className="featured-stories__nav featured-stories__nav--prev"
                  onClick={handlePrev}
                  aria-label="Previous case study"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Swiper Carousel */}
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={24}
                  slidesPerView={1}
                  loop={caseStudies.length > 2}
                  pagination={{
                    clickable: true,
                    bulletClass: 'featured-stories__pagination-bullet',
                    bulletActiveClass: 'featured-stories__pagination-bullet--active',
                  }}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
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
                      slidesPerView: 2,
                      spaceBetween: 24,
                    },
                    1280: {
                      slidesPerView: 2,
                      spaceBetween: 32,
                    },
                  }}
                  className="featured-stories__swiper"
                >
                  {caseStudies.map((caseStudy) => (
                    <SwiperSlide key={caseStudy.id}>
                      <button
                        type="button"
                        onClick={() => handleCardClick(caseStudy.id)}
                        className="featured-stories__card-button"
                        aria-label={`View details for ${caseStudy.title}`}
                      >
                        <CaseStudyCard data={caseStudy} />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Navigation - Next */}
                <button
                  className="featured-stories__nav featured-stories__nav--next"
                  onClick={handleNext}
                  aria-label="Next case study"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseStudyArchitecture;
