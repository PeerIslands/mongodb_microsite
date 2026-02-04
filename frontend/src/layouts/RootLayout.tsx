import { Outlet, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext';
import ToastContainer from '@/components/ToastContainer';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import PDFDownloadModal from '@/components/PDFDownloadModal';
import '@/styles/layouts/RootLayout.css';
import { ReactNode, useEffect } from 'react';
import { analytics } from '@/utils/analytics';

/**
 * Analytics Tracker - tracks route changes for analytics
 */
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change (including query params)
    const fullPath = location.pathname + location.search;
    analytics.trackPageView(fullPath);
  }, [location]);

  return null;
};

/**
 * Global Auth Modals - rendered once at the root level
 */
const GlobalAuthModals = () => {
  const {
    isLoginModalOpen,
    isSignupModalOpen,
    isForgotPasswordModalOpen,
    isPDFDownloadModalOpen,
    pdfDownloadResource,
    closeAllModals,
    switchToSignup,
    switchToLogin,
    switchToForgotPassword,
    onLoginSuccess,
  } = useAuthModal();

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeAllModals}
        onSwitchToSignup={switchToSignup}
        onSwitchToForgotPassword={switchToForgotPassword}
        onLoginSuccess={onLoginSuccess}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={closeAllModals}
        onSwitchToLogin={switchToLogin}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={closeAllModals}
        onSwitchToLogin={switchToLogin}
      />
      {pdfDownloadResource && (
        <PDFDownloadModal
          isOpen={isPDFDownloadModalOpen}
          onClose={closeAllModals}
          onSuccess={pdfDownloadResource.onSuccess}
          resourceType={pdfDownloadResource.resourceType}
          resourceId={pdfDownloadResource.resourceId}
          resourceTitle={pdfDownloadResource.resourceTitle}
        />
      )}
    </>
  );
};

/**
 * Root layout wrapper for all pages
 */
const RootLayout = ({ children }: { children?: ReactNode }) => {
  return (
    <ToastProvider>
      <AuthModalProvider>
        <div className="root-layout">
          <AnalyticsTracker />
          {children || <Outlet />}
          <ToastContainer />
          <GlobalAuthModals />
        </div>
      </AuthModalProvider>
    </ToastProvider>
  );
};

export default RootLayout;

