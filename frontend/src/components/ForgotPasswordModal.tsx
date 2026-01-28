/**
 * ForgotPasswordModal Component
 * 
 * Handles complete password reset flow with TOTP verification
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/api/client';
import TOTPVerificationInput from './TOTPVerificationInput';
import '@/styles/components/ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

type ResetStep = 'email-input' | 'verify-totp' | 'new-password' | 'email-sent' | 'success';

const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }: ForgotPasswordModalProps) => {
  const [step, setStep] = useState<ResetStep>('email-input');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwordResetToken, setPasswordResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showToast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email-input');
      setEmail('');
      setResetToken('');
      setPasswordResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setVerificationError('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ==========================================================================
  // PASSWORD VALIDATION
  // ==========================================================================
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('One lowercase letter');
    }
    if (!/\d/.test(pwd)) {
      errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(pwd)) {
      errors.push('One special character');
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPwd = e.target.value;
    setNewPassword(newPwd);
  };

  // ==========================================================================
  // STEP 1: Email Input & Request Reset
  // ==========================================================================
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/api/v1/password-reset/request', {
        user_email: email,
      });

      if (response.data) {
        setResetToken(response.data.reset_token);
        
        if (response.data.totp_required) {
          // User has TOTP enabled - show TOTP verification
          setStep('verify-totp');
          showToast('Enter code from your authenticator app', 'info');
        } else {
          // User doesn't have TOTP - show email sent
          setStep('email-sent');
          showToast('Password reset instructions sent', 'success');
        }
      }
    } catch (error) {
      // Still show success to prevent email enumeration
      setStep('email-sent');
      showToast('If an account exists, reset instructions have been sent', 'success');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // STEP 2: Verify TOTP Code
  // ==========================================================================
  const handleVerifyTotp = async (code: string) => {
    setLoading(true);
    setVerificationError('');
    
    try {
      const response = await apiClient.post('/api/v1/password-reset/verify-totp', {
        reset_token: resetToken,
        totp_code: code,
      });

      if (response.data && response.data.success) {
        setPasswordResetToken(response.data.password_reset_token);
        setStep('new-password');
        showToast('TOTP verified! Set your new password', 'success');
      } else {
        setVerificationError(response.data?.detail || 'Invalid code. Please try again.');
      }
    } catch (error: unknown) {
      setVerificationError((error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // STEP 3: Set New Password
  // ==========================================================================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength
    const passwordValidationErrors = validatePassword(newPassword);
    if (passwordValidationErrors.length > 0) {
      showToast('Password does not meet requirements. Please check below.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/api/v1/password-reset/complete', {
        password_reset_token: passwordResetToken,
        new_password: newPassword,
      });

      if (response.data && response.data.success) {
        setStep('success');
        showToast('Password reset successfully!', 'success');
        
        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          onClose();
          if (onSwitchToLogin) {
            onSwitchToLogin();
          }
        }, 2000);
      } else {
        showToast(response.data?.detail || 'Failed to reset password', 'error');
      }
    } catch (error: unknown) {
      showToast((error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Modal Handlers
  // ==========================================================================
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackToLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    onClose();
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  const getStepInfo = () => {
    switch (step) {
      case 'email-input':
        return { title: 'Reset Password', subtitle: 'Enter your email address' };
      case 'verify-totp':
        return { title: 'Verification Required', subtitle: 'Enter code from your authenticator' };
      case 'new-password':
        return { title: 'Create New Password', subtitle: 'Authentication successful' };
      case 'email-sent':
        return { title: 'Check Your Email', subtitle: 'Instructions sent' };
      case 'success':
        return { title: 'Password Reset Complete', subtitle: 'You can now log in' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="forgot-password-modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <h2 className="modal-title">{stepInfo.title}</h2>
          <p className="modal-subtitle">{stepInfo.subtitle}</p>
        </div>

        {/* ================================================================ */}
        {/* STEP 1: EMAIL INPUT */}
        {/* ================================================================ */}
        {step === 'email-input' && (
          <form className="forgot-password-form" onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>

            <div className="form-footer">
              <p className="back-to-login">
                Remember your password? 
                <a href="#login" onClick={handleBackToLogin} className="login-link">
                  Back to Login
                </a>
              </p>
            </div>
          </form>
        )}

        {/* ================================================================ */}
        {/* STEP 2: TOTP VERIFICATION */}
        {/* ================================================================ */}
        {step === 'verify-totp' && (
          <div className="totp-verification-step">
            <div className="totp-info">
              <p className="totp-info-text">
                Two-factor authentication is enabled on your account.
              </p>
              <p className="totp-info-subtext">
                Open your authenticator app (Google Authenticator, Microsoft Authenticator, etc.) and enter the 6-digit code for MongoDB Microsite.
              </p>
            </div>

            <TOTPVerificationInput
              onCodeComplete={handleVerifyTotp}
              loading={loading}
              error={verificationError}
            />

            <button
              type="button"
              onClick={() => setStep('email-input')}
              className="back-button"
              disabled={loading}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 3: NEW PASSWORD FORM */}
        {/* ================================================================ */}
        {step === 'new-password' && (
          <form className="new-password-form" onSubmit={handlePasswordSubmit}>
            <div className="success-badge">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Authentication Successful</span>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                  minLength={8}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
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
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
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
              {newPassword && (
                <div className="password-requirements" style={{ marginTop: '8px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px', fontWeight: '600', color: '#333' }}>
                    Password must contain:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ color: newPassword.length >= 8 ? '#00684A' : '#d32f2f' }}>
                      {newPassword.length >= 8 ? '✓' : '✗'} At least 8 characters
                    </div>
                    <div style={{ color: /[A-Z]/.test(newPassword) ? '#00684A' : '#d32f2f' }}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '✗'} One uppercase letter
                    </div>
                    <div style={{ color: /[a-z]/.test(newPassword) ? '#00684A' : '#d32f2f' }}>
                      {/[a-z]/.test(newPassword) ? '✓' : '✗'} One lowercase letter
                    </div>
                    <div style={{ color: /\d/.test(newPassword) ? '#00684A' : '#d32f2f' }}>
                      {/\d/.test(newPassword) ? '✓' : '✗'} One number
                    </div>
                    <div style={{ color: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(newPassword) ? '#00684A' : '#d32f2f' }}>
                      {/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(newPassword) ? '✓' : '✗'} One special character (!@#$%^&* etc.)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
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

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* ================================================================ */}
        {/* STEP 4: EMAIL SENT (For non-TOTP users) */}
        {/* ================================================================ */}
        {step === 'email-sent' && (
          <div className="email-sent-content">
            <div className="success-icon">📧</div>
            <p className="success-message">
              If an account exists with <strong>{email}</strong>, you will receive password reset instructions shortly.
            </p>
            
            <div className="info-box">
              <p className="info-icon">💡</p>
              <div className="info-content">
                <p className="info-title">Next Steps:</p>
                <ul className="info-list">
                  <li>Check your email inbox</li>
                  <li>Look for an email from MongoDB Microsite</li>
                  <li>Follow the reset link (expires in 1 hour)</li>
                  <li>Create a new password</li>
                </ul>
              </div>
            </div>

            <div className="help-text">
              <p>Didn't receive the email?</p>
              <ul>
                <li>Check your spam/junk folder</li>
                <li>Verify the email address is correct</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>

            <button 
              onClick={handleBackToLogin}
              className="back-button"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 5: SUCCESS */}
        {/* ================================================================ */}
        {step === 'success' && (
          <div className="success-content">
            <div className="success-icon-large">✓</div>
            <h3 className="success-title">Password Reset Successfully!</h3>
            <p className="success-message">
              Your password has been updated. You can now log in with your new credentials.
            </p>
            <p className="success-submessage">
              For security, all sessions have been logged out. Please log in from all devices.
            </p>
            <p className="redirect-text">
              Redirecting to login...
            </p>
            <div className="success-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
