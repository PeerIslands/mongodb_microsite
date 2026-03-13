import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { analytics } from '@/utils/analytics';
import '@/styles/features/home/Hero.css';
import heroCard1 from '@/assets/HeroCard1.png';
import onDemandWebinarsHero from '@/assets/Gemini_Generated_Image_mfduncmfduncmfdu (2).png';
import heroCard3 from '@/assets/Herocard3.png';
import heroCard5 from '@/assets/Herocard5.png';
import arrowIcon from '@/assets/9676e79a76f01cf2ed247a83e933b0c8e983525f.svg';

const Hero = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const heroImages: { src: string; alt: string; linkTo?: string }[] = [
    { src: heroCard1, alt: "Powering Data Modernization with PeerAI & MongoDB" },
    { src: heroCard3, alt: "Accelerators Purpose-Built for MongoDB Transformations" },
    { src: heroCard5, alt: "Why Leaders Choose PeerIslands" },
    { src: onDemandWebinarsHero, alt: "Visit our Events Tab to see our On-Demand Webinars", linkTo: ROUTES.EVENTS_ON_DEMAND },
  ];

  useEffect(() => {
    if (isHovered) return; // Don't start interval if hovered
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [heroImages.length, isHovered]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <section className="hero">
      {/* Image Carousel */}
      <div 
        className="hero-carousel"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="hero-carousel-container">
          {heroImages.map((image, index) => (
            <div 
              key={index}
              className={`hero-carousel-slide ${index === currentSlide ? 'active' : ''} ${image.linkTo ? 'hero-carousel-slide--on-demand' : ''}`}
            >
              {image.linkTo ? (
                <button
                  type="button"
                  className="hero-carousel-slide-link"
                  onClick={() => {
                    analytics.trackCTAClick('On-Demand Webinars Hero', 'Hero Section');
                    navigate(image.linkTo!);
                  }}
                  aria-label={`${image.alt} - Go to events`}
                >
                  <img src={image.src} alt={image.alt} className="hero-carousel-image" />
                </button>
              ) : (
                <img src={image.src} alt={image.alt} className="hero-carousel-image" />
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button 
          className="hero-carousel-arrow hero-carousel-arrow-left"
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          &#8249;
        </button>
        <button 
          className="hero-carousel-arrow hero-carousel-arrow-right"
          onClick={goToNext}
          aria-label="Next slide"
        >
          &#8250;
        </button>

        {/* Dots Navigation */}
        <div className="hero-carousel-dots">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`hero-carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {/* CTA Group */}
      <div className="hero-cta-group">
        {/* Primary button */}
        <div className="hero-button-wrapper-centered">
          <button 
            className="btn-primary"
            onClick={() => {
              analytics.trackCTAClick('Explore Accelerators', 'Hero Section');
              window.location.href = '/accelerators';
            }}
          >
            <span className="btn-blur"></span>
            <span className="btn-text">Explore Accelerators</span>
          </button>
        </div>

        {/* Links Group */}
        <div className="hero-links-group">
          {/* View Offerings link */}
          <a 
            href="#capabilities" 
            className="btn-link"
            onClick={(e) => {
              e.preventDefault();
              analytics.trackCTAClick('View Offerings', 'Hero Section');
              document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="btn-link-text">View Offerings</span>
            <div className="btn-link-icon">
              <img src={arrowIcon} alt="" className="btn-link-arrow" />
            </div>
          </a>

          {/* View Success Stories link */}
          <a 
            href="#case-studies" 
            className="btn-link"
            onClick={(e) => {
              e.preventDefault();
              analytics.trackCTAClick('View Success Stories', 'Hero Section');
              document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="btn-link-text">View Success Stories</span>
            <div className="btn-link-icon">
              <img src={arrowIcon} alt="" className="btn-link-arrow" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;



