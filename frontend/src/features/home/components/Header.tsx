import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useToast } from '@/contexts/ToastContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { analytics } from '@/utils/analytics';
import '@/styles/features/home/Header.css';
import logo from '@/assets/logo.svg';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { openLoginModal } = useAuthModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if current route is the calendar download page
  const isCalendarDownloadPage = /^\/events\/[^/]+\/calendar$/.test(location.pathname);

  // Check login status on mount and when storage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const email = localStorage.getItem('userEmail');
      const adminStatus = localStorage.getItem('isAdmin') === 'true';
      
      setIsLoggedIn(!!token);
      setUserEmail(email || '');
      setIsAdmin(adminStatus);
    };

    checkAuthStatus();
    
    // Listen for storage changes (in case user logs in/out in another tab)
    globalThis.addEventListener('storage', checkAuthStatus);
    return () => globalThis.removeEventListener('storage', checkAuthStatus);
  }, []);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openLoginModal();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isInternal');
    localStorage.removeItem('userId');
    localStorage.removeItem('rememberMe');
    
    setIsLoggedIn(false);
    setUserEmail('');
    setIsAdmin(false);
    setShowUserMenu(false);
    
    showToast('Logged out successfully', 'success');
    
    // Reload to update UI
    setTimeout(() => {
      globalThis.location.reload();
    }, 500);
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string, ctaName: string) => {
    e.preventDefault();
    // Track CTA click
    analytics.trackCTAClick(ctaName, 'Header Navigation');
    navigate(path);
    // Scroll to top after navigation
    setTimeout(() => {
      globalThis.scrollTo(0, 0);
    }, 100);
  };

  const handleAdminNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Navigate without CTA tracking for admin dashboard
    navigate('/admin');
    setTimeout(() => {
      globalThis.scrollTo(0, 0);
    }, 100);
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to={ROUTES.HOME} className="logo-section">
          <img src={logo} alt="PeerAI X MongoDB" className="logo-image" />
        </Link>
        
        {/* Hide navigation on calendar download page */}
        {!isCalendarDownloadPage && (
          <nav className="nav">
            <a 
              href={ROUTES.OFFERINGS}
              className="nav-link"
              onClick={(e) => handleNavigation(e, ROUTES.OFFERINGS, 'Offerings Nav')}
            >
              Offerings
            </a>
            <a 
              href={ROUTES.ACCELERATORS} 
              className="nav-link with-dropdown"
              onClick={(e) => handleNavigation(e, ROUTES.ACCELERATORS, 'Accelerators Nav')}
            >
              Accelerators
            </a>
            <a 
              href={ROUTES.SUCCESS_STORIES} 
              className="nav-link"
              onClick={(e) => handleNavigation(e, ROUTES.SUCCESS_STORIES, 'Success Stories Nav')}
            >
              Success Stories
            </a>
            <a 
              href={ROUTES.INSIGHTS} 
              className="nav-link"
              onClick={(e) => handleNavigation(e, ROUTES.INSIGHTS, 'Insights Nav')}
            >
              Insights
            </a>
            <a
              href={ROUTES.EVENTS}
              className="nav-link"
              onClick={(e) => handleNavigation(e, ROUTES.EVENTS, 'Events Nav')}
            >
              Events
            </a>
            <a 
              href={ROUTES.ABOUT} 
              className="nav-link"
              onClick={(e) => handleNavigation(e, ROUTES.ABOUT, 'About Nav')}
            >
              About
            </a>
            {isLoggedIn && isAdmin && (
              <a 
                href={ROUTES.ADMIN} 
                className="nav-link admin-link"
                onClick={handleAdminNavigation}
              >
                Admin Dashboard
              </a>
            )}
          </nav>
        )}
        
        <div className="header-actions">
          {/* Hide user menu/login on calendar download page */}
          {!isCalendarDownloadPage && (
            <>
              {isLoggedIn ? (
                <div className="user-menu-container">
                  <button 
                    className="user-avatar-button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label="User menu"
                  >
                    <div className="user-avatar">
                      {getInitials(userEmail)}
                    </div>
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <button 
                        type="button"
                        className="user-menu-overlay" 
                        onClick={() => setShowUserMenu(false)}
                        aria-label="Close menu"
                      />
                      <div className="user-menu-dropdown">
                        <div className="user-menu-header">
                          <div className="user-menu-email">{userEmail}</div>
                        </div>
                        <div className="user-menu-divider" />
                        <button
                          className="user-menu-item"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/profile');
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 0C6.79 0 5 1.79 5 4C5 6.21 6.79 8 9 8C11.21 8 13 6.21 13 4C13 1.79 11.21 0 9 0ZM9 6C7.9 6 7 5.1 7 4C7 2.9 7.9 2 9 2C10.1 2 11 2.9 11 4C11 5.1 10.1 6 9 6ZM15 16V18H3V16C3 13.34 8.33 12 9 12C9.67 12 15 13.34 15 16ZM13 16C13 15.36 10.95 14 9 14C7.05 14 5 15.36 5 16H13Z" fill="currentColor"/>
                          </svg>
                          Profile
                        </button>
                        <div className="user-menu-divider" />
                        {isAdmin && (
                          <>
                            <a href={ROUTES.ADMIN} className="user-menu-item-wrapper">
                              <div className="user-menu-item">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                  <path d="M9 0L0 5V8.09C0 12.54 3.09 16.68 9 18C14.91 16.68 18 12.54 18 8.09V5L9 0ZM9 9H16C15.47 12.11 13.41 14.7 9 15.9V9H2V6.39L9 2.62V9Z" fill="currentColor"/>
                                </svg>
                                Admin Dashboard
                              </div>
                            </a>
                            <div className="user-menu-divider" />
                          </>
                        )}
                        <button
                          className="user-menu-item user-menu-logout"
                          onClick={handleLogout}
                        >
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M6.5 14.5L5.09 13.09L8.67 9.5L5.09 5.91L6.5 4.5L11.5 9.5L6.5 14.5ZM0 18V0H9V2H2V16H9V18H0Z" fill="currentColor"/>
                          </svg>
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className="login-link login-button"
                >
                  Login
                </button>
              )}
            </>
          )}
          <button 
            className="demo-button"
            onClick={(e) => {
              analytics.trackCTAClick('Contact Us Button', 'Header');
              handleNavigation(e as any, '/contact', 'Contact Us');
            }}
          >
            Contact Us
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;


