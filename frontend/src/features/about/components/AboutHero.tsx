import '@/styles/features/about/AboutHero.css';
import peerislandsLogo from '@/assets/about/peerislands-logo.png';

/**
 * About Hero Section - Main title and subtitle
 */
const AboutHero = () => {
  return (
    <section className="about-hero">
      <div className="about-hero__container">
        <a 
          href="https://peerislands.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="about-hero__logo-link"
        >
          <div className="about-hero__image-wrapper">
            <img 
              src={peerislandsLogo} 
              alt="Peerislands" 
              className="about-hero__image"
            />
          </div>
          <span className="about-hero__visit-label">
            Visit Peerislands.io
            <svg 
              className="about-hero__external-icon" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </a>
        <h1 className="about-hero__title">
          Leading the <span className="about-hero__title-gradient">AI-Native</span> Transformation
        </h1>
        <p className="about-hero__subtitle">
          Driving innovation through certified expertise and deep technical integration.
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
