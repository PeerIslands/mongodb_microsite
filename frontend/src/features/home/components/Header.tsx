import '@/styles/features/home/Header.css';
import image2 from '@/assets/image 2.png';
import image3 from '@/assets/image 3.png';
import line1 from '@/assets/Line 1.png';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-image-container">
            <img src={image2} alt="PeerAI" className="logo-image logo-image-2" />
          </div>
          <div className="logo-separator">
            <img src={line1} alt="" className="separator-line" />
          </div>
          <div className="logo-image-container">
            <img src={image3} alt="MongoDB" className="logo-image logo-image-3" />
          </div>
        </div>
        
        <nav className="nav">
          <a href="#offerings" className="nav-link">
            Offerings
            <span className="dropdown-arrow"></span>
          </a>
          <a 
            href="/accelerators" 
            className="nav-link with-dropdown"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/accelerators';
            }}
          >
            Accelerators
            <span className="dropdown-arrow"></span>
          </a>
          <a href="#success-stories" className="nav-link">Success Stories</a>
          <a href="#resources" className="nav-link">
            Resources
            <span className="dropdown-arrow"></span>
          </a>
          <a href="#about" className="nav-link">About</a>
        </nav>
        
        <div className="header-actions">
          <a href="#login" className="login-link">Login</a>
          <button className="demo-button">Demo</button>
        </div>
      </div>
    </header>
  );
};

export default Header;


