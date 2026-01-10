import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import '@/styles/features/home/Header.css';
import image2 from '@/assets/image 2.png';
import image3 from '@/assets/image 3.png';
import line1 from '@/assets/Line 1.png';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';

const Header = () => {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginModalOpen(true);
  };

  const handleSwitchToSignup = () => {
    setIsSignupModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to={ROUTES.HOME} className="logo-section">
            <div className="logo-image-container">
              <img src={image2} alt="PeerAI" className="logo-image logo-image-2" />
            </div>
            <div className="logo-separator">
              <div className="separator-wrapper">
                <img src={line1} alt="" className="separator-line" />
              </div>
            </div>
            <div className="logo-image-container">
              <img src={image3} alt="MongoDB" className="logo-image logo-image-3" />
            </div>
          </Link>
          
          <nav className="nav">
            <a href="#offerings" className="nav-link">
              Offerings
              <span className="dropdown-arrow"></span>
            </a>
            <a 
              href={ROUTES.ACCELERATORS} 
              className="nav-link with-dropdown"
              onClick={(e) => handleNavigation(e, ROUTES.ACCELERATORS)}
            >
              Accelerators
              <span className="dropdown-arrow"></span>
            </a>
            <a 
              href={ROUTES.SUCCESS_STORIES} 
              className="nav-link"
              onClick={(e) => handleNavigation(e, ROUTES.SUCCESS_STORIES)}
            >
              Success Stories
            </a>
            <a href="#resources" className="nav-link">
              Resources
              <span className="dropdown-arrow"></span>
            </a>
            <a href="#about" className="nav-link">About</a>
          </nav>
          
          <div className="header-actions">
            <button 
              onClick={handleLoginClick}
              className="login-link login-button"
            >
              Login
            </button>
            <button className="demo-button">Demo</button>
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />

      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default Header;


