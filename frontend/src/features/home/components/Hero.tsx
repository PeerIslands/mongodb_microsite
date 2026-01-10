import '@/styles/features/home/Hero.css';
import image1 from '@/assets/image 1.png';
import arrowIcon from '@/assets/9676e79a76f01cf2ed247a83e933b0c8e983525f.svg';

const Hero = () => {
  return (
    <section className="hero">
      {/* Main background image - matches Figma node 3:4 */}
      <div className="hero-main-bg">
        <img src={image1} alt="" className="hero-bg-image" />
      </div>
      
      {/* Title - matches Figma node 11:792 */}
      <h1 className="hero-title">Powering Data Modernization with PeerAI & MongoDB.</h1>
      
      {/* Description - matches Figma node 5:265 */}
      <p className="hero-description">
        We combine specialized expertise with automated accelerators to simplify legacy migrations and accelerate application modernization on MongoDB Atlas.
      </p>
      
      {/* CTA Group - matches Figma node 6:277 */}
      <div className="hero-cta-group">
        {/* Primary button - matches Figma node 5:266 */}
        <div className="hero-button-wrapper">
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/accelerators'}
          >
            <span className="btn-blur"></span>
            <span className="btn-text">Explore Accelerators</span>
          </button>
        </div>
        
        {/* Link - matches Figma node 5:271 */}
        <a 
          href="#case-studies" 
          className="btn-link"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="btn-link-text">View Success Stories</span>
          <div className="btn-link-icon">
            <img src={arrowIcon} alt="" className="btn-link-arrow" />
          </div>
        </a>
      </div>
      
      {/* Gradient fade at bottom - matches Figma node 6:278 */}
      <div className="hero-gradient-fade"></div>
    </section>
  );
};

export default Hero;



