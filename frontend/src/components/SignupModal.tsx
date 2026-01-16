import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/api/client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
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

// Helper to convert country name to ISO country code for PhoneInput
const getCountryCode = (countryName: string): any => {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'India': 'IN',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Singapore': 'SG',
    'Japan': 'JP',
    'China': 'CN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Netherlands': 'NL',
    'Spain': 'ES',
    'Italy': 'IT',
    'South Korea': 'KR',
    'United Arab Emirates': 'AE',
    'Switzerland': 'CH',
    'Sweden': 'SE',
  };
  return countryMap[countryName] || 'US';
};

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) => {
  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [country, setCountry] = useState('');

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
    setCompany('');
    setJobFunction('');
    setBusinessPhone('');
    setCountry('');
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

    // Validate required fields
    if (!company.trim() || !jobFunction.trim() || !businessPhone || !country.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Validate phone number format
    if (businessPhone && !isValidPhoneNumber(businessPhone)) {
      showToast('Please enter a valid phone number.', 'error');
      return;
    }
    
    // Call signup API
    const result = await signup(
      firstName, 
      lastName, 
      email, 
      password, 
      company, 
      jobFunction, 
      businessPhone, 
      country
    );

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
      const response = await apiClient.post('/api/v1/register/verify-mfa', {
        user_id: userId,
        totp_code: code,
      });

      if (response.data && response.data.success) {
        setBackupCodes(response.data.backup_codes);
        setStep('backup-codes');
        showToast('MFA verified successfully!', 'success');
        setVerificationError('');
      } else {
        const errorMsg = response.data?.detail || 'Invalid code. Please try again.';
        console.log('TOTP Error:', errorMsg);
        setVerificationError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Verification failed. Please try again.';
      console.error('TOTP Verification Error:', error);
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
      await apiClient.post('/api/v1/register/acknowledge-backup-codes', {
        user_id: userId,
        acknowledged: true,
      });

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
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to complete registration. Please try again.';
      showToast(errorMsg, 'error');
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
                  <label htmlFor="firstName" className="form-label">
                    First Name <span className="required-asterisk">*</span>
                  </label>
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
                  <label htmlFor="lastName" className="form-label">
                    Last Name <span className="required-asterisk">*</span>
                  </label>
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
                <label htmlFor="email" className="form-label">
                  Business Email <span className="required-asterisk">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="Enter your business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="company" className="form-label">
                  Company <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  className="form-input"
                  placeholder="Enter your company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobFunction" className="form-label">
                  Job Function <span className="required-asterisk">*</span>
                </label>
                <select
                  id="jobFunction"
                  className="form-input"
                  value={jobFunction}
                  onChange={(e) => setJobFunction(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select job function</option>
                  <option value="IT Executive (CIO, CTO, VP Engineering, etc.)">IT Executive (CIO, CTO, VP Engineering, etc.)</option>
                  <option value="Business Executive (CEO, COO, CMO, etc.)">Business Executive (CEO, COO, CMO, etc.)</option>
                  <option value="Architect">Architect</option>
                  <option value="Business Development / Alliance Manager">Business Development / Alliance Manager</option>
                  <option value="DBA">DBA</option>
                  <option value="Technical Operations">Technical Operations</option>
                  <option value="Director / Development Manager">Director / Development Manager</option>
                  <option value="Product / Project Manager">Product / Project Manager</option>
                  <option value="Software Developer / Engineer">Software Developer / Engineer</option>
                  <option value="Business Analyst">Business Analyst</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="country" className="form-label">
                  Country <span className="required-asterisk">*</span>
                </label>
                <select
                  id="country"
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select country</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="India">India</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Japan">Japan</option>
                  <option value="China">China</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Spain">Spain</option>
                  <option value="Italy">Italy</option>
                  <option value="South Korea">South Korea</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="businessPhone" className="form-label">
                  Business Phone <span className="required-asterisk">*</span>
                </label>
                <PhoneInput
                  international
                  defaultCountry={getCountryCode(country)}
                  value={businessPhone}
                  onChange={(value) => setBusinessPhone(value || '')}
                  placeholder="Enter phone number"
                  disabled={loading}
                  className="phone-input-wrapper"
                  numberInputProps={{
                    className: 'form-input phone-input-field',
                    required: true,
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="required-asterisk">*</span>
                </label>
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
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password <span className="required-asterisk">*</span>
                </label>
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
