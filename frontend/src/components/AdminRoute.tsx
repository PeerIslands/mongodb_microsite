import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/contexts/ToastContext';
import { isAuthenticated, isAdmin } from '@/utils/sessionStorage';
import LeafLoader from './LeafLoader';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute component that ensures only admin users can access the route.
 * Checks both authentication and admin status.
 * Redirects non-admin users to home page with error message.
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();
  const { openLoginModal } = useAuthModal();
  const { showToast } = useToast();

  useEffect(() => {
    // Check authentication and admin status
    const checkAuth = () => {
      try {
        const authenticated = isAuthenticated();
        const adminStatus = isAdmin();
        
        const authorized = authenticated && adminStatus;
        
        setIsAuthorized(authorized);
        
        if (!authenticated) {
          // User is not authenticated - open login modal
          setTimeout(() => {
            openLoginModal(() => {
              // After successful login, check if they're admin
              const newIsAdmin = isAdmin();
              if (newIsAdmin) {
                window.location.href = location.pathname;
              } else {
                showToast('You do not have permission to access this page', 'error');
              }
            });
          }, 100);
        } else if (!adminStatus) {
          // User is authenticated but not admin
          showToast('You do not have permission to access this page. Admin access required.', 'error');
        }
      } catch (error) {
        // Handle sessionStorage errors
        console.error('Error checking authentication:', error);
        setIsAuthorized(false);
        setTimeout(() => {
          openLoginModal();
        }, 100);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location.pathname, openLoginModal, showToast]);

  // Show loading state while checking authorization
  if (isChecking) {
    return <LeafLoader message="Checking permissions..." />;
  }

  // Redirect to home if not authorized
  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  // Render children if authorized (authenticated and admin)
  return <>{children}</>;
};

export default AdminRoute;
