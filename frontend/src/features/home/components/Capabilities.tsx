import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import '@/styles/features/home/Capabilities.css';
import image4 from '@/assets/image 4.png';
import image5 from '@/assets/image 5.png';
import image6 from '@/assets/image 6.png';
import offeringImage1 from '@/assets/offering_image_1.png';
import offeringImage2 from '@/assets/offerings_image_2.png';
import offeringImage3 from '@/assets/offerings_image_3.png';

const Capabilities = () => {
  const navigate = useNavigate();
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const capabilities = [
    {
      title: 'Application Modernization',
      image: image4,
      section: 'application-modernization',
    },
    {
      title: 'Data & Database Modernization',
      image: image5,
      section: 'data-database-modernization',
    },
    {
      title: 'AI-Native Products',
      image: image6,
      section: 'ai-native-products',
    },
    {
      title: 'AI Quality Engineering & Testing',
      image: offeringImage1,
      section: 'ai-quality-engineering-testing',
    },
    {
      title: 'Data Engineering & Platforms',
      image: offeringImage2,
      section: 'data-engineering-platforms',
    },
    {
      title: 'AI Consulting & Governance',
      image: offeringImage3,
      section: 'ai-consulting-governance',
    },
  ];

  const handleCardClick = (section: string) => {
    navigate(`/offerings#${section}`);
  };

  return (
    <section id="capabilities" className="capabilities">
      <div className="capabilities-content">
        <div className="capabilities-header">
          <h2 className="section-title">End-to-End Modernization Capabilities</h2>
          <p className="section-description">
            From legacy migration to cloud-native architecture, we deliver predictable outcomes using our proven framework.
          </p>
        </div>
        
        {/* Desktop Grid - shown only on desktop */}
        <div className="capabilities-grid capabilities-grid-desktop">
          {capabilities.map((capability, index) => (
            <div 
              key={index} 
              className="capability-card"
              onClick={() => handleCardClick(capability.section)}
            >
              <div className="capability-card__glow"></div>
              <div className="capability-image-container">
                <img src={capability.image} alt={capability.title} className="capability-image" />
              </div>
              <h3 className="capability-title">{capability.title}</h3>
            </div>
          ))}
        </div>

        {/* Mobile/Tablet Carousel - shown only on mobile/tablet */}
        <div className="capabilities-carousel-wrapper capabilities-carousel-mobile">
          <button 
            className="capabilities-carousel-arrow capabilities-carousel-arrow-left"
            onClick={() => swiperInstance?.slidePrev()}
            aria-label="Previous capability"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={16}
            slidesPerView={1}
            loop={true}
            speed={600}
            autoplay={{
              delay: 10000, // 10 seconds
              disableOnInteraction: false,
            }}
            breakpoints={{
              769: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
            }}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            className="capabilities-swiper"
          >
            {capabilities.map((capability, index) => (
              <SwiperSlide key={index} className="capability-slide">
                <div 
                  className="capability-card"
                  onClick={() => handleCardClick(capability.section)}
                >
                  <div className="capability-card__glow"></div>
                  <div className="capability-image-container">
                    <img src={capability.image} alt={capability.title} className="capability-image" />
                  </div>
                  <h3 className="capability-title">{capability.title}</h3>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <button
            className="capabilities-carousel-arrow capabilities-carousel-arrow-right"
            onClick={() => swiperInstance?.slideNext()}
            aria-label="Next capability"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Capabilities;


