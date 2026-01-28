import { useState, useEffect } from 'react';
import { analytics } from '@/utils/analytics';
import '@/styles/features/home/Hero.css';
import image1 from '@/assets/image 1.png';
import arrowIcon from '@/assets/9676e79a76f01cf2ed247a83e933b0c8e983525f.svg';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const descriptionSlides = [
    {
      subtitle: "\"Modernize faster. Scale smarter. Stay in control – With MongoDB.\"",
      description: "PeerIslands helps enterprises modernize data and applications 75% faster using Accelerators purpose-built for MongoDB transformations.",
      description2: "",
      description3: "",
      bullets: [
        "Automated code & schema analysis",
        "AI-assisted design and refactoring",
        "Test generation, validation & rollback",
        "Zero-downtime migration with parity checks"
      ],
      boldText: "",
      boldItalic: false
    },
    {
      subtitle: "\"Modernization Built for Reality, Not Demos\"",
      description: "Most modernization fails because it ignores reality:",
      description2: "We design for those constraints from day one.",
      description3: "",
      bullets: [
        "Fragile legacy systems",
        "Limited SMEs",
        "Zero tolerance for downtime"
      ],
      boldText: "'AI accelerates the work. Experts protect the business.'",
      boldItalic: false
    },
    {
      subtitle: "For Enterprises Modernizing What Matters Most",
      description: "AI-native application and data modernization for enterprises moving to MongoDB.",
      description2: "Modernize complex, mission-critical systems — safely, predictably, and in weeks.",
      description3: "What We're Known For",
      bullets: [
        "Legacy-to-MongoDB modernization",
        "High-risk, business-critical transformations",
        "AI-accelerated delivery with human control"
      ],
      boldText: "",
      boldItalic: false
    },
    {
      subtitle: "Why Leaders Choose PeerIslands",
      description: "",
      description2: "",
      description3: "",
      bullets: [
        "Trusted for Enterprise-Scale Modernization",
        "12× Faster Development Velocity",
        "90% of Programs Go Live in ≤ 8 Weeks"
      ],
      boldText: "\"Not experiments. Not pilots. Proven at enterprise scale.\"",
      boldItalic: true
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % descriptionSlides.length);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [descriptionSlides.length]);

  return (
    <section className="hero">
      {/* Main background image - matches Figma node 3:4 */}
      <div className="hero-main-bg">
        <img src={image1} alt="" className="hero-bg-image" />
      </div>
      
      {/* Title - matches Figma node 11:792 */}
      <h1 className="hero-title">Powering Data Modernization with PeerAI & MongoDB.</h1>
      
      {/* Description Carousel - matches Figma node 5:265 */}
      <div className="hero-description-carousel">
        {descriptionSlides.map((slide, index) => (
          <div 
            key={index}
            className={`hero-description ${index === currentSlide ? 'active' : ''}`}
          >
            <h2 className="hero-description-subtitle">{slide.subtitle}</h2>
            <p className="hero-description-text">{slide.description}</p>
            {slide.description2 && (
              <p className="hero-description-text">{slide.description2}</p>
            )}
            {slide.description3 && (
              <p className="hero-description-text">{slide.description3}</p>
            )}
            {slide.bullets.length > 0 && (
              <ul className="hero-description-bullets">
                {slide.bullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            )}
            {slide.boldText && (
              <p className={slide.boldItalic ? "hero-description-bold-italic" : "hero-description-bold"}>{slide.boldText}</p>
            )}
          </div>
        ))}
      </div>
      
      {/* CTA Group - matches Figma node 6:277 */}
      <div className="hero-cta-group">
        {/* Primary button - matches Figma node 5:266 */}
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



