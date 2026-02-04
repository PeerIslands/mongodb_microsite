import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// PDF Download modal resource info
interface PDFDownloadResource {
  resourceType: 'accelerator' | 'case_study';
  resourceId: string;
  resourceTitle: string;
  onSuccess: () => void;
}

interface AuthModalContextValue {
  // Modal state
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  isForgotPasswordModalOpen: boolean;
  isPDFDownloadModalOpen: boolean;
  pdfDownloadResource: PDFDownloadResource | null;
  
  // Modal controls
  openLoginModal: (onSuccessCallback?: () => void) => void;
  openSignupModal: () => void;
  openForgotPasswordModal: () => void;
  openPDFDownloadModal: (resource: PDFDownloadResource) => void;
  closeAllModals: () => void;
  
  // Switch between modals
  switchToSignup: () => void;
  switchToLogin: () => void;
  switchToForgotPassword: () => void;
  
  // Success callback (used after successful login)
  onLoginSuccess: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
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
  const [isPDFDownloadModalOpen, setIsPDFDownloadModalOpen] = useState(false);
  const [pdfDownloadResource, setPdfDownloadResource] = useState<PDFDownloadResource | null>(null);
  
  // Store the callback to execute after successful login
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);

  const closeAllModals = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsPDFDownloadModalOpen(false);
    setPdfDownloadResource(null);
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

  const openPDFDownloadModal = useCallback((resource: PDFDownloadResource) => {
    closeAllModals();
    setPdfDownloadResource(resource);
    setIsPDFDownloadModalOpen(true);
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
        isPDFDownloadModalOpen,
        pdfDownloadResource,
        openLoginModal,
        openSignupModal,
        openForgotPasswordModal,
        openPDFDownloadModal,
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
