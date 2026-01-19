import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AuthModalContextValue {
  // Modal state
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  isForgotPasswordModalOpen: boolean;
  
  // Modal controls
  openLoginModal: (onSuccessCallback?: () => void) => void;
  openSignupModal: () => void;
  openForgotPasswordModal: () => void;
  closeAllModals: () => void;
  
  // Switch between modals
  switchToSignup: () => void;
  switchToLogin: () => void;
  switchToForgotPassword: () => void;
  
  // Success callback (used after successful login)
  onLoginSuccess: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider = ({ children }: AuthModalProviderProps) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  
  // Store the callback to execute after successful login
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);

  const closeAllModals = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    setIsForgotPasswordModalOpen(false);
  }, []);

  const openLoginModal = useCallback((onSuccessCallback?: () => void) => {
    closeAllModals();
    if (onSuccessCallback) {
      setSuccessCallback(() => onSuccessCallback);
    } else {
      setSuccessCallback(null);
    }
    setIsLoginModalOpen(true);
  }, [closeAllModals]);

  const openSignupModal = useCallback(() => {
    closeAllModals();
    setSuccessCallback(null);
    setIsSignupModalOpen(true);
  }, [closeAllModals]);

  const openForgotPasswordModal = useCallback(() => {
    closeAllModals();
    setIsForgotPasswordModalOpen(true);
  }, [closeAllModals]);

  const switchToSignup = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsSignupModalOpen(true);
  }, []);

  const switchToLogin = useCallback(() => {
    setIsSignupModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsLoginModalOpen(true);
  }, []);

  const switchToForgotPassword = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    setIsForgotPasswordModalOpen(true);
  }, []);

  // Called when login is successful - executes the stored callback
  const onLoginSuccess = useCallback(() => {
    if (successCallback) {
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        successCallback();
        setSuccessCallback(null);
      }, 100);
    }
  }, [successCallback]);

  return (
    <AuthModalContext.Provider
      value={{
        isLoginModalOpen,
        isSignupModalOpen,
        isForgotPasswordModalOpen,
        openLoginModal,
        openSignupModal,
        openForgotPasswordModal,
        closeAllModals,
        switchToSignup,
        switchToLogin,
        switchToForgotPassword,
        onLoginSuccess,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
