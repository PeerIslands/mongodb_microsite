import '@/styles/components/Footer.css';
import image2 from '@/assets/image 2.png';
import image3 from '@/assets/image 3.png';
import line1 from '@/assets/Line 1.png';
import discordIcon from '@/assets/discord-icon.svg';
import twitterIcon from '@/assets/twitter-icon.svg';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-with-name">
              <img src={image2} alt="PeerAI" className="footer-logo-image footer-logo-image-2" />
              <div className="footer-logo-separator">
                <img src={line1} alt="" className="footer-separator-line" />
              </div>
              <img src={image3} alt="MongoDB" className="footer-logo-image footer-logo-image-3" />
            </div>
            <div className="footer-social-media">
              <a href="#" className="social-link">
                <img src={discordIcon} alt="Discord" className="social-icon" />
              </a>
              <a href="#" className="social-link">
                <img src={twitterIcon} alt="Twitter" className="social-icon" />
              </a>
            </div>
          </div>
          <div className="footer-nav">
            <div className="footer-nav-group">
              <h4 className="footer-nav-heading">Product</h4>
              <ul className="footer-nav-list">
                <li><a href="#">Features</a></li>
                <li><a href="#">Integrations</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Roadmap</a></li>
              </ul>
            </div>
            <div className="footer-nav-group">
              <h4 className="footer-nav-heading">Company</h4>
              <ul className="footer-nav-list">
                <li><a href="#">Our team</a></li>
                <li><a href="#">Our values</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer-nav-group">
              <h4 className="footer-nav-heading">Resources</h4>
              <ul className="footer-nav-list">
                <li><a href="#">Downloads</a></li>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-newsletter">
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
        </div>
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


