import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/api/client';
import { analytics } from '@/utils/analytics';
import { setSessionData } from '@/utils/sessionStorage';
import TOTPVerificationInput from './TOTPVerificationInput';
import BackupCodesDisplay from './BackupCodesDisplay';
import '@/styles/components/LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
  onSwitchToForgotPassword?: () => void;
  onLoginSuccess?: () => void;
}

type LoginStep = 'credentials' | 'verify-totp' | 'incomplete-registration' | 'backup-codes';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup, onSwitchToForgotPassword, onLoginSuccess }: LoginModalProps) => {
  // Credentials form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // TOTP verification state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [sessionToken, setSessionToken] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Incomplete registration state
  const [userId, setUserId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [resendingSetup, setResendingSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const { login, loading, clearError } = useAuth();
  const { showToast } = useToast();

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearError();
      setVerificationError('');
    }
  }, [isOpen, clearError]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('credentials');
      setSessionToken('');
      setVerificationError('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setUserId('');
      setQrCode('');
      setTotpSecret('');
      setResendingSetup(false);
      setBackupCodes([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ==========================================================================
  // STEP 1: Email + Password Authentication
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call login API
    const result = await login(email, password);

    if (result.success) {
      // Check if TOTP verification is required
      if (result.requiresTotp && result.sessionToken) {
        // Store session token and show TOTP verification screen
        setSessionToken(result.sessionToken);
        setStep('verify-totp');
        showToast('Enter code from your authenticator app', 'info');
      } else {
        // Standard login complete (no TOTP required)
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Update analytics session with user_id
        await analytics.updateSessionUser();

        // Reset form
        setEmail('');
        setPassword('');
        
        // Show success toast
        showToast('Login successful! Welcome back.', 'success');
        
        // Close modal
        onClose();

        // Execute success callback if provided (e.g., download PDF)
        if (onLoginSuccess) {
          onLoginSuccess();
        }

        // Reload page to update UI state and show logged-in header
        setTimeout(() => {
          globalThis.location.reload();
        }, 1000);
      }
    } else {
      // Check if registration is incomplete (TOTP not set up)
      if (result.registrationIncomplete) {
        const msg = result.message || 'Please complete MFA setup to access your account';
        showToast(msg, 'warning');
        
        // Show incomplete registration step
        setStep('incomplete-registration');
        return;
      }
      
      // Show error toast with message from API
      const errorMsg = result.error || 'Login failed. Please try again.';
      showToast(errorMsg, 'error');
    }
  };
  
  // ==========================================================================
  // INCOMPLETE REGISTRATION: Resend TOTP Setup
  // ==========================================================================
  const handleResendTotpSetup = async () => {
    setResendingSetup(true);
    setVerificationError('');
    
    try {
      const response = await apiClient.post('/api/v1/register/resend-totp-setup', {
        user_email: email,
        user_password: password,
      });

      if (response.data && response.data.totp_setup) {
        // Store TOTP setup data
        setUserId(response.data.user_id);
        setQrCode(response.data.totp_setup.qr_code);
        setTotpSecret(response.data.totp_setup.manual_entry_key);
        
        showToast('TOTP setup retrieved. Scan the QR code with your authenticator app.', 'success');
      } else {
        showToast('Failed to retrieve TOTP setup. Please try again.', 'error');
      }
    } catch (error: unknown) {
      const errorMsg = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Failed to retrieve TOTP setup';
      console.error('Resend TOTP Setup Error:', error);
      setVerificationError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setResendingSetup(false);
    }
  };
  
  // ==========================================================================
  // INCOMPLETE REGISTRATION: Complete TOTP Verification
  // ==========================================================================
  const handleCompleteRegistration = async (code: string) => {
    setVerifying(true);
    setVerificationError('');
    
    try {
      const response = await apiClient.post('/api/v1/register/verify-mfa', {
        user_id: userId,
        totp_code: code,
      });

      if (response.data && response.data.success) {
        showToast('MFA verified successfully!', 'success');
        
        // Store backup codes and move to backup codes step
        if (response.data.backup_codes && response.data.backup_codes.length > 0) {
          setBackupCodes(response.data.backup_codes);
          setStep('backup-codes');
        } else {
          // No backup codes, just complete registration
          showToast('Registration complete! You can now log in.', 'success');
          setStep('credentials');
          setEmail('');
          setPassword('');
          setUserId('');
          setQrCode('');
          setTotpSecret('');
        }
      } else {
        const errorMsg = response.data?.message || 'Verification failed';
        setVerificationError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error: unknown) {
      const errorMsg = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Verification failed';
      console.error('Complete Registration Error:', error);
      setVerificationError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setVerifying(false);
    }
  };
  
  // ==========================================================================
  // BACKUP CODES: Acknowledge and Complete
  // ==========================================================================
  const handleAcknowledgeBackupCodes = async () => {
    setVerifying(true);
    
    try {
      await apiClient.post('/api/v1/register/acknowledge-backup-codes', {
        user_id: userId,
        acknowledged: true,
      });

      showToast('Registration complete! You can now log in.', 'success');
      
      // Reset form and go back to login
      setStep('credentials');
      setEmail('');
      setPassword('');
      setUserId('');
      setQrCode('');
      setTotpSecret('');
      setBackupCodes([]);
    } catch (error: unknown) {
      const errorMsg = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Failed to complete registration';
      showToast(errorMsg, 'error');
    } finally {
      setVerifying(false);
    }
  };
  
  // ==========================================================================
  // STEP 2: TOTP Verification
  // ==========================================================================
  const handleVerifyTotp = async (code: string) => {
    setVerifying(true);
    setVerificationError('');
    
    try {
      const response = await apiClient.post('/api/v1/verify-login-totp', {
        session_token: sessionToken,
        totp_code: code,
      });

      if (response.data && response.data.access_token) {
        // Store tokens in sessionStorage
        setSessionData({
          authToken: response.data.access_token,
          userEmail: response.data.user_email,
          isAdmin: response.data.is_admin || false,
          isInternal: response.data.is_internal || false,
        });
        
        // Store rememberMe preference in localStorage (user preference, not auth data)
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Update analytics session with user_id
        await analytics.updateSessionUser();
        
        // Show success
        showToast('Login successful! Welcome back.', 'success');
        
        // Close modal
        onClose();
        
        // Execute success callback if provided (e.g., download PDF)
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Reload page
        setTimeout(() => {
          globalThis.location.reload();
        }, 1000);
      } else {
        const errorMsg = response.data?.detail || 'Invalid code';
        console.log('TOTP Login Error:', errorMsg);
        setVerificationError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error: unknown) {
      const errorMsg = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Verification failed';
      console.error('TOTP Login Verification Error:', error);
      setVerificationError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSignupClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    if (onSwitchToSignup) {
      onSwitchToSignup();
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    if (onSwitchToForgotPassword) {
      onSwitchToForgotPassword();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 'credentials' && 'Welcome Back'}
            {step === 'verify-totp' && 'Two-Factor Authentication'}
            {step === 'incomplete-registration' && 'Complete Your Registration'}
            {step === 'backup-codes' && 'Save Backup Codes'}
          </h2>
          <p className="modal-subtitle">
            {step === 'credentials' && 'Login to your account'}
            {step === 'verify-totp' && 'Step 2 of 2'}
            {step === 'incomplete-registration' && 'Set up Two-Factor Authentication'}
            {step === 'backup-codes' && 'Step 4 - Save for account recovery'}
          </p>
        </div>

        {/* =================================================================== */}
        {/* STEP 1: EMAIL + PASSWORD */}
        {/* =================================================================== */}
        {step === 'credentials' && (
          <>
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '18px',
                      opacity: loading ? 0.5 : 1
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    className="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Remember me</span>
                </label>
                <a 
                  href="#forgot" 
                  className="forgot-password"
                  onClick={handleForgotPasswordClick}
                >
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                className="login-submit-button"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="modal-footer">
              <p className="signup-prompt">
                Don't have an account? <a href="#signup" onClick={handleSignupClick} className="signup-link">Sign up</a>
              </p>
            </div>
          </>
        )}

        {/* =================================================================== */}
        {/* STEP 2: TOTP VERIFICATION */}
        {/* =================================================================== */}
        {step === 'verify-totp' && (
          <div className="totp-verification-step">
            <div className="totp-info-box">
              <p className="totp-info-text">
                Two-factor authentication is enabled on your account.
              </p>
              <p className="totp-info-subtext">
                Open your authenticator app and enter the 6-digit code for <strong>MongoDB Microsite</strong>.
              </p>
            </div>

            <TOTPVerificationInput
              onCodeComplete={handleVerifyTotp}
              loading={verifying}
              error={verificationError}
            />

            <button
              type="button"
              onClick={() => setStep('credentials')}
              className="back-to-login-button"
              disabled={verifying}
            >
              ← Back to Login
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: INCOMPLETE REGISTRATION - COMPLETE TOTP SETUP */}
        {/* =================================================================== */}
        {step === 'incomplete-registration' && (
          <div className="incomplete-registration-step">
            <div className="totp-info-box">
              <p className="totp-info-text">
                <span>⚠️</span>
                <span>Your account setup is incomplete</span>
              </p>
              <p className="totp-info-subtext">
                You need to complete the two-factor authentication (TOTP) setup before you can log in.
              </p>
            </div>

            {!qrCode ? (
              <div style={{ marginTop: '24px' }}>
                <p className="verification-instruction">
                  Click the button below to retrieve your TOTP setup QR code.
                </p>
                <button
                  type="button"
                  onClick={handleResendTotpSetup}
                  className="get-totp-setup-button"
                  disabled={resendingSetup}
                >
                  {resendingSetup ? (
                    <>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span>
                      Loading...
                    </>
                  ) : (
                    '🔐 Get TOTP Setup'
                  )}
                </button>
                {verificationError && (
                  <p style={{ color: '#ff6b6b', marginTop: '12px', textAlign: 'center', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                    {verificationError}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <div className="qr-code-container">
                  <span className="qr-code-label">Scan this QR code with your authenticator app</span>
                  <img 
                    src={qrCode} 
                    alt="TOTP QR Code"
                  />
                  <details className="manual-entry-details">
                    <summary>Can't scan? Enter manually</summary>
                    <div className="manual-entry-code">
                      {totpSecret}
                    </div>
                  </details>
                </div>

                <p className="verification-instruction">
                  After scanning, enter the 6-digit code from your app:
                </p>

                <TOTPVerificationInput
                  onCodeComplete={handleCompleteRegistration}
                  loading={verifying}
                  error={verificationError}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setQrCode('');
                setTotpSecret('');
                setUserId('');
                setVerificationError('');
              }}
              className="back-to-login-button"
              disabled={verifying || resendingSetup}
            >
              ← Back to Login
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: BACKUP CODES */}
        {/* =================================================================== */}
        {step === 'backup-codes' && (
          <div className="backup-codes-step">
            <BackupCodesDisplay
              backupCodes={backupCodes}
              onAcknowledge={handleAcknowledgeBackupCodes}
              loading={verifying}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;



