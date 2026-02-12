import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { isAuthenticated as checkIsAuthenticated, isAdmin as checkIsAdmin } from '@/utils/sessionStorage';

interface UseRouteGuardOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  showErrorToast?: boolean;
}

interface UseRouteGuardReturn {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  checkAuth: () => void;
}

/**
 * Hook for route protection logic that can be reused across components.
 * Checks authentication and admin status, and optionally redirects unauthorized users.
 * 
 * @param options Configuration options for the route guard
 * @returns Object containing auth state and check function
 */
export const useRouteGuard = (options: UseRouteGuardOptions = {}): UseRouteGuardReturn => {
  const {
    requireAuth = false,
    requireAdmin = false,
    redirectTo = '/',
    showErrorToast = true,
  } = options;

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openLoginModal } = useAuthModal();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    try {
      const authenticated = checkIsAuthenticated();
      const adminStatus = checkIsAdmin();
      
      const authorized = authenticated && (requireAdmin ? adminStatus : true);
      
      setIsAuthenticated(authenticated);
      setIsAdmin(adminStatus);
      setIsAuthorized(authorized);
      
      if (requireAuth && !authenticated) {
        // User is not authenticated
        if (showErrorToast) {
          showToast('Please log in to access this page', 'error');
        }
        setTimeout(() => {
          openLoginModal(() => {
            // After successful login, check authorization again
            const newIsAdmin = checkIsAdmin();
            if (requireAdmin && !newIsAdmin) {
              if (showErrorToast) {
                showToast('You do not have permission to access this page', 'error');
              }
            } else {
              window.location.href = window.location.pathname;
            }
          });
        }, 100);
        navigate(redirectTo, { replace: true });
      } else if (requireAdmin && authenticated && !adminStatus) {
        // User is authenticated but not admin
        if (showErrorToast) {
          showToast('You do not have permission to access this page. Admin access required.', 'error');
        }
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      // Handle sessionStorage errors
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsAuthorized(false);
      if (showErrorToast) {
        showToast('Error checking authentication. Please try again.', 'error');
      }
      if (requireAuth) {
        setTimeout(() => {
          openLoginModal();
        }, 100);
        navigate(redirectTo, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requireAuth || requireAdmin) {
      checkAuth();
    } else {
      // If no requirements, just check status without redirecting
      try {
        const authenticated = checkIsAuthenticated();
        const adminStatus = checkIsAdmin();
        setIsAuthenticated(authenticated);
        setIsAdmin(adminStatus);
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    }
  }, [requireAuth, requireAdmin, navigate, redirectTo, showToast, openLoginModal]);

  return {
    isAuthenticated,
    isAdmin,
    isAuthorized,
    isLoading,
    checkAuth,
  };
};
