import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { isAuthenticated, isAdmin as checkIsAdmin, getUserEmail, clearSession } from '@/utils/sessionStorage';
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
import { newsletterAccessService } from '@/api/services/newsletter-access.service';
import { eventResourceRequestService } from '@/api/services/eventResourceRequest.service';
import { AccessRequestsPanel } from '@/features/admin/components/AccessRequestsPanel';

/**
 * Admin layout with header and sidebar
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { openLoginModal } = useAuthModal();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if we're on admin page
  const isOnAdminPage = location.pathname.startsWith('/admin');

  // Check authentication and admin status on mount (additional security layer)
  // Note: AdminRoute component handles the main protection, this is defense-in-depth
  useEffect(() => {
    const checkAuthAndAdmin = () => {
      try {
        const authenticated = isAuthenticated();
        const adminStatus = checkIsAdmin();
        const email = getUserEmail();
        
        const authorized = authenticated && adminStatus;
        
        setIsAuthorized(authorized);
        setUserEmail(email);
        
        // Additional security check - if somehow we reach here without proper auth,
        // show error and redirect (AdminRoute should have caught this, but this is a safety net)
        if (!authenticated) {
          showToast('Please log in to access the admin dashboard', 'error');
          setTimeout(() => {
            openLoginModal(() => {
              const newIsAdmin = checkIsAdmin();
              if (newIsAdmin) {
                window.location.href = location.pathname;
              } else {
                showToast('You do not have permission to access this page', 'error');
              }
            });
          }, 100);
          navigate('/', { replace: true });
        } else if (!adminStatus) {
          showToast('You do not have permission to access this page. Admin access required.', 'error');
          navigate('/', { replace: true });
        }
      } catch (error) {
        // Handle sessionStorage errors
        console.error('Error checking authentication:', error);
        setIsAuthorized(false);
        showToast('Error checking authentication. Please try again.', 'error');
        setTimeout(() => {
          openLoginModal();
        }, 100);
        navigate('/', { replace: true });
      }
    };

    checkAuthAndAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Fetch pending requests count for admin users
  useEffect(() => {
    // Check if user is admin from state (already set by first useEffect)
    const adminStatus = checkIsAdmin();
    setIsAdmin(adminStatus);
    
    // Fetch pending requests count if admin
    if (adminStatus) {
      const fetchPendingCount = async () => {
        try {
          const [newsletterCount, eventResourceCount] = await Promise.all([
            newsletterAccessService.getPendingCount(),
            eventResourceRequestService.getPendingCount().catch(() => 0),
          ]);
          setPendingRequestsCount(newsletterCount + eventResourceCount);
        } catch (error) {
          console.error('Failed to fetch pending requests count:', error);
        }
      };

      fetchPendingCount();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  // Don't render content if not authorized (safety check - AdminRoute should have handled redirect)
  if (!isAuthorized) {
    return null;
  }

  const fetchPendingCount = async () => {
    try {
      const [newsletterCount, eventResourceCount] = await Promise.all([
        newsletterAccessService.getPendingCount(),
        eventResourceRequestService.getPendingCount().catch(() => 0),
      ]);
      setPendingRequestsCount(newsletterCount + eventResourceCount);
    } catch (error) {
      console.error('Failed to fetch pending requests count:', error);
    }
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    clearSession();
    // Note: rememberMe stays in localStorage as it's a user preference
    
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
            
            {/* Notification Bell Icon - Only show for admin users */}
            {isAdmin && (
              <button
                className="notification-bell-button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                title="Newsletter Access Requests"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {pendingRequestsCount > 0 && (
                  <span className="notification-badge">{pendingRequestsCount}</span>
                )}
              </button>
            )}
            
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
            <Link to="/admin" className="view-site-link">Content</Link>
            <Link to="/admin/pricing" className="view-site-link">Pricing</Link>
            <Link to="/" className="view-site-link">View Site</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>

      {/* Access Requests Panel */}
      <AccessRequestsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onRequestHandled={fetchPendingCount}
      />
    </div>
  );
};

export default AdminLayout;