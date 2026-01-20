import { Outlet } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext';
import ToastContainer from '@/components/ToastContainer';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import '@/styles/layouts/RootLayout.css';
import { ReactNode } from 'react';

/**
 * Global Auth Modals - rendered once at the root level
 */
const GlobalAuthModals = () => {
  const {
    isLoginModalOpen,
    isSignupModalOpen,
    isForgotPasswordModalOpen,
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
          {children || <Outlet />}
          <ToastContainer />
          <GlobalAuthModals />
        </div>
      </AuthModalProvider>
    </ToastProvider>
  );
};

export default RootLayout;

