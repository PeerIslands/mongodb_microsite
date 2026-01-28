import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import '@/styles/layouts/AdminLayout.css';
// Pre-import admin component CSS to prevent flash of unstyled content during lazy loading
import '@/styles/pages/AdminDashboardPage.css';
import '@/styles/features/admin/CaseStudyList.css';
import '@/styles/features/admin/AcceleratorList.css';
import '@/styles/features/admin/BlogList.css';
import '@/styles/features/admin/AnalyticsDashboard.css';
import '@/styles/features/admin/EmailTemplateList.css';
import '@/styles/features/admin/EmailTemplateForm.css';
import logo from '@/assets/logo.svg';

/**
 * Admin layout with header and sidebar
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if we're on admin page
  const isOnAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Get user email from localStorage
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isInternal');
    localStorage.removeItem('userId');
    localStorage.removeItem('rememberMe');
    
    setShowUserMenu(false);
    showToast('Logged out successfully', 'success');
    
    // Redirect to login
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo-section">
            <img src={logo} alt="PeerAI X MongoDB" className="logo-image" />
          </div>
          
          <div className="admin-title">
            <h1>Content Manager</h1>
          </div>
          
          <div className="admin-actions">
            <span className="admin-badge">ADMIN</span>
            {userEmail && (
              <div className="user-menu-container">
                <button 
                  className="user-avatar-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User menu"
                >
                  <div className="admin-user-avatar">
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
                      {!isOnAdminPage && (
                        <>
                          <a href="/admin" className="user-menu-item-wrapper">
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
            )}
            <Link to="/" className="view-site-link">View Site</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;