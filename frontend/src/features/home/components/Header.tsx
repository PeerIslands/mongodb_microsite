import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useToast } from '@/contexts/ToastContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { analytics } from '@/utils/analytics';
import { isAuthenticated, isAdmin as checkIsAdmin, getUserEmail, clearSession } from '@/utils/sessionStorage';
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);

  // Get current page label based on route
  const getCurrentPageLabel = () => {
    const path = location.pathname;
    if (path === ROUTES.OFFERINGS || path === '/offerings') return 'Offerings';
    if (path === ROUTES.ACCELERATORS || path === '/accelerators') return 'Accelerators';
    if (path === ROUTES.SUCCESS_STORIES || path === '/success-stories') return 'Success Stories';
    if (path === ROUTES.INSIGHTS || path === '/insights') return 'Insights';
    if (path === ROUTES.EVENTS || path === '/events') return 'Events';
    if (path === ROUTES.ABOUT || path === '/about') return 'About';
    if (path === '/contact') return 'Contact';
    if (path === '/profile') return 'Profile';
    if (path === ROUTES.ESTIMATOR || path === '/estimator') return 'Estimator';
    if (path === '/admin' || path.startsWith('/admin')) return 'Admin';
    // Default to Offerings for home page
    return 'Offerings';
  };

  // Get navigation items excluding current page
  const getDropdownItems = () => {
    const currentLabel = getCurrentPageLabel();
    const allItems = [
      { label: 'Offerings', path: ROUTES.OFFERINGS },
      { label: 'Accelerators', path: ROUTES.ACCELERATORS },
      { label: 'Success Stories', path: ROUTES.SUCCESS_STORIES },
      { label: 'Insights', path: ROUTES.INSIGHTS },
      { label: 'Events', path: ROUTES.EVENTS },
      { label: 'About', path: ROUTES.ABOUT },
      { label: 'Estimator', path: ROUTES.ESTIMATOR },
    ];
    // Filter out current page from dropdown
    return allItems.filter(item => item.label !== currentLabel);
  };

  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = isAuthenticated();
      const email = getUserEmail();
      const adminStatus = checkIsAdmin();
      
      setIsLoggedIn(authenticated);
      setUserEmail(email || '');
      setIsAdmin(adminStatus);
    };

    checkAuthStatus();
    
    // Listen for token expiration events from API client
    const handleTokenExpired = () => {
      checkAuthStatus();
    };
    
    globalThis.addEventListener('token-expired', handleTokenExpired);
    
    // Note: sessionStorage events only fire in other tabs/windows, not same tab
    // So we listen for custom token-expired events instead
    return () => {
      globalThis.removeEventListener('token-expired', handleTokenExpired);
    };
  }, []);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openLoginModal();
  };

  const handleLogout = () => {
    clearSession();
    // Note: rememberMe stays in localStorage as it's a user preference
    
    setIsLoggedIn(false);
    setUserEmail('');
    setIsAdmin(false);
    setShowUserMenu(false);
    setShowMobileUserMenu(false);
    
    showToast('Logged out successfully', 'success');
    
    setTimeout(() => {
      globalThis.location.reload();
    }, 500);
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const currentPageLabel = getCurrentPageLabel();
  const dropdownItems = getDropdownItems();

  return (
    <>
      {/* ===== DESKTOP/TABLET HEADER ===== */}
      {!isCalendarDownloadPage && (
        <header className="header header-desktop">
          <div className="header-content">
            <Link to={ROUTES.HOME} className="logo-section">
              <img src={logo} alt="PeerAI X MongoDB" className="logo-image" />
            </Link>

            {/* Desktop Navigation - All links */}
            <nav className="nav nav-desktop">
            <a href={ROUTES.OFFERINGS} className="nav-link">Offerings</a>
            <a href={ROUTES.ACCELERATORS} className="nav-link">Accelerators</a>
            <a href={ROUTES.SUCCESS_STORIES} className="nav-link">Success Stories</a>
            <a href={ROUTES.INSIGHTS} className="nav-link">Insights</a>
            <a href={ROUTES.EVENTS} className="nav-link">Events</a>
            <a href="https://gray-beach-085790c0f.2.azurestaticapps.net/" className="nav-link" target="_blank" rel="noopener noreferrer">Pricing</a>
            <a href={ROUTES.ABOUT} className="nav-link">About</a>
            <a href={ROUTES.ESTIMATOR} className="nav-link">Estimator</a>
            {isLoggedIn && isAdmin && (
              <a href={ROUTES.ADMIN} className="nav-link admin-link">Admin Dashboard</a>
            )}
          </nav>
          
          {/* Tablet Navigation - 4 links + dropdown */}
          <nav className="nav nav-tablet">
            <a href={ROUTES.OFFERINGS} className="nav-link">Offerings</a>
            <a href={ROUTES.ACCELERATORS} className="nav-link">Accelerators</a>
            <a href={ROUTES.SUCCESS_STORIES} className="nav-link">Success Stories</a>
            <a href={ROUTES.INSIGHTS} className="nav-link">Insights</a>
            
            <div className="nav-dropdown">
              <button className="nav-dropdown-button" onClick={() => setShowMoreMenu(!showMoreMenu)} aria-label="More">
                <svg className={`nav-dropdown-arrow ${showMoreMenu ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showMoreMenu && (
                <>
                  <button type="button" className="nav-dropdown-overlay" onClick={() => setShowMoreMenu(false)} aria-label="Close" />
                  <div className="nav-dropdown-menu">
                    <a href={ROUTES.EVENTS} className="nav-dropdown-link" onClick={() => setShowMoreMenu(false)}>Events</a>
                    <a href="https://gray-beach-085790c0f.2.azurestaticapps.net/" className="nav-dropdown-link" target="_blank" rel="noopener noreferrer" onClick={() => setShowMoreMenu(false)}>Pricing</a>
                    <a href={ROUTES.ABOUT} className="nav-dropdown-link" onClick={() => setShowMoreMenu(false)}>About</a>
                    <a href={ROUTES.ESTIMATOR} className="nav-dropdown-link" onClick={() => setShowMoreMenu(false)}>Estimator</a>
                    {isLoggedIn && isAdmin && (
                      <a href={ROUTES.ADMIN} className="nav-dropdown-link" onClick={() => setShowMoreMenu(false)}>Admin Dashboard</a>
                    )}
                  </div>
                </>
              )}
            </div>
          </nav>
          
          <div className="header-actions">
            {isLoggedIn ? (
              <div className="user-menu-container">
                <button className="user-avatar-button" onClick={() => setShowUserMenu(!showUserMenu)} aria-label="User menu">
                  <div className="user-avatar">{getInitials(userEmail)}</div>
                </button>
                {showUserMenu && (
                  <>
                    <button type="button" className="user-menu-overlay" onClick={() => setShowUserMenu(false)} aria-label="Close" />
                    <div className="user-menu-dropdown">
                      <div className="user-menu-header"><div className="user-menu-email">{userEmail}</div></div>
                      <div className="user-menu-divider" />
                      <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 0C6.79 0 5 1.79 5 4C5 6.21 6.79 8 9 8C11.21 8 13 6.21 13 4C13 1.79 11.21 0 9 0ZM9 6C7.9 6 7 5.1 7 4C7 2.9 7.9 2 9 2C10.1 2 11 2.9 11 4C11 5.1 10.1 6 9 6ZM15 16V18H3V16C3 13.34 8.33 12 9 12C9.67 12 15 13.34 15 16ZM13 16C13 15.36 10.95 14 9 14C7.05 14 5 15.36 5 16H13Z" fill="currentColor"/></svg>
                        Profile
                      </button>
                      <div className="user-menu-divider" />
                      {isAdmin && (
                        <>
                          <a href={ROUTES.ADMIN} className="user-menu-item-wrapper">
                            <div className="user-menu-item">
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 0L0 5V8.09C0 12.54 3.09 16.68 9 18C14.91 16.68 18 12.54 18 8.09V5L9 0ZM9 9H16C15.47 12.11 13.41 14.7 9 15.9V9H2V6.39L9 2.62V9Z" fill="currentColor"/></svg>
                              Admin Dashboard
                            </div>
                          </a>
                          <div className="user-menu-divider" />
                        </>
                      )}
                      <button className="user-menu-item user-menu-logout" onClick={handleLogout}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.5 14.5L5.09 13.09L8.67 9.5L5.09 5.91L6.5 4.5L11.5 9.5L6.5 14.5ZM0 18V0H9V2H2V16H9V18H0Z" fill="currentColor"/></svg>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={handleLoginClick} className="login-link login-button">Login</button>
            )}
            <button 
              className="demo-button" 
              onClick={() => {
                analytics.trackCTAClick('Contact Us Button', 'Header');
                navigate('/contact');
              }}
            >
              Contact Us
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ===== PHONE HEADER ===== */}
      {!isCalendarDownloadPage && (
        <div className="phone-header">
        <div className="phone-header-inner">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="phone-logo">
            <img src={logo} alt="PeerAI X MongoDB" className="phone-logo-img" />
          </Link>

          {/* Center Nav - Shows current page name */}
          <div className="phone-nav">
            {location.pathname === ROUTES.HOME || location.pathname === '/' ? (
              <a 
                href={ROUTES.OFFERINGS}
                className="phone-nav-text phone-nav-text-clickable"
              >
                {currentPageLabel}
              </a>
            ) : (
              <span className="phone-nav-text">{currentPageLabel}</span>
            )}
            <button className="phone-nav-arrow" onClick={() => setShowMobileDropdown(!showMobileDropdown)} aria-label="More">
              <svg className={showMobileDropdown ? 'rotated' : ''} width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {showMobileDropdown && (
              <>
                <div className="phone-dropdown-bg" onClick={() => setShowMobileDropdown(false)} />
                <div className="phone-dropdown">
                  {dropdownItems.map((item) => (
                    <a 
                      key={item.path}
                      href={item.path} 
                      className="phone-dropdown-item" 
                      onClick={() => setShowMobileDropdown(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                  <a href="https://gray-beach-085790c0f.2.azurestaticapps.net/" className="phone-dropdown-item" target="_blank" rel="noopener noreferrer" onClick={() => setShowMobileDropdown(false)}>Pricing</a>
                  {isLoggedIn && isAdmin && (
                    <a href={ROUTES.ADMIN} className="phone-dropdown-item" onClick={() => setShowMobileDropdown(false)}>Admin</a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="phone-actions">
            {isLoggedIn ? (
              <div className="phone-user-wrap">
                <button className="phone-avatar-btn" onClick={() => setShowMobileUserMenu(!showMobileUserMenu)}>
                  <span className="phone-avatar">{getInitials(userEmail)}</span>
                </button>
                {showMobileUserMenu && (
                  <>
                    <div className="phone-dropdown-bg" onClick={() => setShowMobileUserMenu(false)} />
                    <div className="phone-user-dropdown">
                      <div className="phone-user-email">{userEmail}</div>
                      <button className="phone-user-item" onClick={() => { setShowMobileUserMenu(false); navigate('/profile'); }}>Profile</button>
                      {isAdmin && <a href={ROUTES.ADMIN} className="phone-user-item" onClick={() => setShowMobileUserMenu(false)}>Admin</a>}
                      <button className="phone-user-item phone-logout" onClick={handleLogout}>Logout</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={handleLoginClick} className="phone-login">Login</button>
            )}
            <button 
              className="phone-contact" 
              onClick={() => {
                analytics.trackCTAClick('Contact Us', 'Header');
                navigate('/contact');
              }}
            >
              📞
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default Header;
