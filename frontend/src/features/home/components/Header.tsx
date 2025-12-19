import { useState } from 'react';
import '@/styles/features/home/Header.css';
import image2 from '@/assets/image 2.png';
import image3 from '@/assets/image 3.png';
import line1 from '@/assets/Line 1.png';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';

const Header = () => {
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

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
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


