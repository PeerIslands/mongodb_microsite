import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuthModal } from '@/contexts/AuthModalContext';

/**
 * Component that listens for token expiration events and shows toast notification
 */
const TokenExpirationHandler = () => {
  const { showToast } = useToast();
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      const message = event.detail?.message || 'Session expired. Please log in again.';
      showToast(message, 'error');
      
      // Open login modal after a brief delay
      setTimeout(() => {
        openLoginModal();
      }, 500);
    };

    window.addEventListener('token-expired', handleTokenExpired as EventListener);

    return () => {
      window.removeEventListener('token-expired', handleTokenExpired as EventListener);
    };
  }, [showToast, openLoginModal]);

  return null;
};

export default TokenExpirationHandler;
