import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthModal } from '@/contexts/AuthModalContext';
import LeafLoader from './LeafLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that ensures only authenticated users can access the route.
 * Redirects unauthenticated users to home page and opens login modal.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const authenticated = !!token;
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          // Open login modal after a brief delay to allow navigation
          setTimeout(() => {
            openLoginModal(() => {
              // After successful login, redirect to the originally requested page
              window.location.href = location.pathname;
            });
          }, 100);
        }
      } catch (error) {
        // Handle localStorage errors (e.g., in private browsing mode)
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setTimeout(() => {
          openLoginModal();
        }, 100);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location.pathname, openLoginModal]);

  // Show loading state while checking authentication
  if (isChecking) {
    return <LeafLoader message="Checking authentication..." />;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
