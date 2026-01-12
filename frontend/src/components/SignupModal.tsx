import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import QRCodeDisplay from './QRCodeDisplay';
import TOTPVerificationInput from './TOTPVerificationInput';
import BackupCodesDisplay from './BackupCodesDisplay';
import '@/styles/components/SignupModal.css';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

interface TOTPSetupData {
  secret: string;
  qr_code: string;
  manual_entry_key: string;
  issuer: string;
  account_name: string;
  otpauth_url: string;
}

type RegistrationStep = 
  | 'registration' 
  | 'qr-scan' 
  | 'verify-totp' 
  | 'backup-codes' 
  | 'complete';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) => {
  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // MFA setup state
  const [step, setStep] = useState<RegistrationStep>('registration');
  const [userId, setUserId] = useState('');
  const [totpSetupData, setTotpSetupData] = useState<TOTPSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationError, setVerificationError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const { signup, loading, clearError } = useAuth();
  const { showToast } = useToast();

  // Reset form function - defined BEFORE useEffect
  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStep('registration');
    setUserId('');
    setTotpSetupData(null);
    setBackupCodes([]);
    setVerificationError('');
    setVerifying(false);
  };

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearError();
      setVerificationError('');
    }
  }, [isOpen, clearError]);

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ==========================================================================
  // STEP 1: Registration Form Submission
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    
    // Call signup API
    const result = await signup(firstName, lastName, email, password);

    if (result.success && result.data) {
      // NEW: Store TOTP setup data and move to MFA setup
      setUserId(result.data.user_id);
      setTotpSetupData(result.data.totp_setup);
      setStep('qr-scan');
      
      showToast('Account created! Complete MFA setup to continue.', 'success');
    } else {
      showToast(result.error || 'Signup failed. Please try again.', 'error');
    }
  };

  // ==========================================================================
  // STEP 2: TOTP Verification
  // ==========================================================================
  const handleVerifyTotp = async (code: string) => {
    setVerifying(true);
    setVerificationError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/register/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          totp_code: code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBackupCodes(data.backup_codes);
        setStep('backup-codes');
        showToast('MFA verified successfully!', 'success');
        setVerificationError('');
      } else {
        const errorMsg = data.detail || 'Invalid code. Please try again.';
        console.log('TOTP Error:', errorMsg); // Debug log
        setVerificationError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      const errorMsg = 'Verification failed. Please try again.';
      console.error('TOTP Verification Error:', error); // Debug log
      setVerificationError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setVerifying(false);
    }
  };

  // ==========================================================================
  // STEP 3: Backup Codes Acknowledgment
  // ==========================================================================
  const handleAcknowledgeBackupCodes = async () => {
    setVerifying(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/register/acknowledge-backup-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          acknowledged: true,
        }),
      });

      if (response.ok) {
        setStep('complete');
        showToast('Registration complete! You can now log in.', 'success');
        
        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          resetForm();
          onClose();
          if (onSwitchToLogin) {
            onSwitchToLogin();
          }
        }, 2000);
      } else {
        showToast('Failed to complete registration. Please try again.', 'error');
        setVerifying(false);
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
      setVerifying(false);
    }
  };

  // ==========================================================================
  // Modal Handlers
  // ==========================================================================
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Don't allow closing during MFA setup (after registration)
    if (step !== 'registration' && step !== 'complete') {
      return;
    }
    
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  // ==========================================================================
  // Step Progress Indicator
  // ==========================================================================
  const getStepInfo = () => {
    switch (step) {
      case 'registration':
        return { number: 1, total: 4, title: 'Create Account' };
      case 'qr-scan':
        return { number: 2, total: 4, title: 'Scan QR Code' };
      case 'verify-totp':
        return { number: 3, total: 4, title: 'Verify Code' };
      case 'backup-codes':
        return { number: 4, total: 4, title: 'Save Backup Codes' };
      case 'complete':
        return { number: 4, total: 4, title: 'Complete!' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="signup-modal-content">
        {/* Close button - only show on first and last step */}
        {(step === 'registration' || step === 'complete') && (
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        )}
        
        {/* Modal Header with Step Progress */}
        <div className="modal-header">
          <h2 className="modal-title">{stepInfo.title}</h2>
          <p className="modal-subtitle">Step {stepInfo.number} of {stepInfo.total}</p>
        </div>

        {/* Step Progress Bar */}
        {step !== 'complete' && (
          <div className="step-progress-bar">
            <div 
              className="step-progress-fill" 
              style={{ width: `${(stepInfo.number / stepInfo.total) * 100}%` }}
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 1: REGISTRATION FORM */}
        {/* =================================================================== */}
        {step === 'registration' && (
          <>
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    className="form-input"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    className="form-input"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

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
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="signup-submit-button"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="modal-footer">
              <p className="login-prompt">
                Already have an account? <a href="#login" onClick={handleLoginClick} className="login-link">Login</a>
              </p>
            </div>
          </>
        )}

        {/* =================================================================== */}
        {/* STEP 2: SCAN QR CODE */}
        {/* =================================================================== */}
        {step === 'qr-scan' && totpSetupData && (
          <div className="mfa-setup-step">
            <QRCodeDisplay
              qrCodeData={totpSetupData.otpauth_url}
              secret={totpSetupData.secret}
              issuer={totpSetupData.issuer}
              accountName={totpSetupData.account_name}
            />
            <button
              type="button"
              onClick={() => setStep('verify-totp')}
              className="next-step-button"
            >
              Continue to Verification
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: VERIFY TOTP CODE */}
        {/* =================================================================== */}
        {step === 'verify-totp' && (
          <div className="mfa-setup-step">
            <TOTPVerificationInput
              onCodeComplete={handleVerifyTotp}
              loading={verifying}
              error={verificationError}
            />
            <button
              type="button"
              onClick={() => setStep('qr-scan')}
              className="back-button"
              disabled={verifying}
            >
              ← Back to QR Code
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: BACKUP CODES */}
        {/* =================================================================== */}
        {step === 'backup-codes' && (
          <div className="mfa-setup-step">
            <BackupCodesDisplay
              backupCodes={backupCodes}
              onAcknowledge={handleAcknowledgeBackupCodes}
              loading={verifying}
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 5: COMPLETION */}
        {/* =================================================================== */}
        {step === 'complete' && (
          <div className="completion-screen">
            <div className="success-icon">✓</div>
            <h3 className="success-title">Registration Complete!</h3>
            <p className="success-message">
              Your account is now fully protected with two-factor authentication.
            </p>
            <p className="success-submessage">
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

export default SignupModal;
