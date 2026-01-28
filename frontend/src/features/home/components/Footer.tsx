import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import '@/styles/features/home/Footer.css';
import linkedinIcon from '@/assets/linkedin-icon.svg';
import githubIcon from '@/assets/github-logo.svg';
import logoImage from '@/assets/logo.svg';

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    // Smooth scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Navigate after a brief delay for smooth transition
    setTimeout(() => {
      navigate(path);
    }, 150);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-with-name">
              <img src={logoImage} alt="PeerAI" className="footer-logo-image" />
            </div>
            <div className="footer-social-media">
              <a href="https://www.linkedin.com/company/peerislands/?viewAsMember=true" className="social-link" target="_blank" rel="noopener noreferrer">
                <img src={linkedinIcon} alt="LinkedIn" className="social-icon" />
              </a>
              <a href="https://github.com/peerislands" className="social-link" target="_blank" rel="noopener noreferrer">
                <img src={githubIcon} alt="GitHub" className="social-icon" />
              </a>
            </div>
          </div>
          <div className="footer-nav">
            <div className="footer-nav-group">
              <h4 className="footer-nav-heading">Solutions</h4>
              <ul className="footer-nav-list">
                <li>
                  <a href={ROUTES.ACCELERATORS} onClick={(e) => handleNavigation(e, ROUTES.ACCELERATORS)}>
                    Accelerators
                  </a>
                </li>
                <li>
                  <a href={ROUTES.SUCCESS_STORIES} onClick={(e) => handleNavigation(e, ROUTES.SUCCESS_STORIES)}>
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-nav-group">
              <h4 className="footer-nav-heading">Company</h4>
              <ul className="footer-nav-list">
                <li>
                  <a href={ROUTES.ABOUT} onClick={(e) => handleNavigation(e, ROUTES.ABOUT)}>
                    About Us
                  </a>
                </li>
                <li>
                  <a href={ROUTES.EVENTS} onClick={(e) => handleNavigation(e, ROUTES.EVENTS)}>
                    Events
                  </a>
                </li>
                <li>
                  <a href={ROUTES.INSIGHTS} onClick={(e) => handleNavigation(e, ROUTES.INSIGHTS)}>
                    Insights
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-nav-group">
              <h4 className="footer-nav-heading">Resources</h4>
              <ul className="footer-nav-list">
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
        {/* <div className="footer-newsletter">
          <div className="footer-newsletter-text">
            <h4 className="footer-newsletter-title">Join our newsletter</h4>
            <p className="footer-newsletter-subtitle">Keep up to date with everything Reflect</p>
          </div>
          <div className="footer-newsletter-form">
            <div className="footer-input">
              <input type="email" placeholder="Enter your email" className="footer-email-input" />
            </div>
            <button className="footer-subscribe-btn">
              <span>Subscribe</span>
            </button>
          </div>
        </div> */}
        <div className="footer-bottom">
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <span className="footer-separator">·</span>
            <a href="#">Terms of Conditions</a>
          </div>
          <div className="footer-copyright">
            <p>PeerAI, LLC. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


