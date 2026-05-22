import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/api/client';
import PhoneInput, { isValidPhoneNumber, Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import QRCodeDisplay from './QRCodeDisplay';
import TOTPVerificationInput from './TOTPVerificationInput';
import BackupCodesDisplay from './BackupCodesDisplay';
import { isAzureSsoConfigured } from '@/config/azureMsal';
import { isInternalEmail } from '@/config/internalUser';
import '@/styles/components/SignupModal.css';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  /** When provided (e.g. from Register Now flow), runs after user logs in post-signup; callback is preserved when switching login → signup. */
  onAuthSuccess?: () => void | Promise<void>;
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
const getCountryCode = (countryName: string): Country => {
  const countryMap: { [key: string]: Country } = {
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

const SignupModal = ({ isOpen, onClose, onSwitchToLogin, onAuthSuccess: _onAuthSuccess }: SignupModalProps) => {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    const newPassword = e.target.value;
    setPassword(newPassword);
  };

  // ==========================================================================
  // STEP 1: Registration Form Submission
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      showToast('Password does not meet requirements. Please check below.', 'error');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    // Validate required fields
    if (!company.trim() || !jobFunction.trim() || !businessPhone || !country.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Validate phone number format
    if (!isValidPhoneNumber(businessPhone)) {
      showToast('Please enter a valid phone number.', 'error');
      return;
    }

    if (isInternalEmail(email) && isAzureSsoConfigured()) {
      showToast(
        'Peer Islands employees should use Login → Sign in with Microsoft to create an account, not this form.',
        'warning'
      );
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
    } catch (error: unknown) {
      const errorMsg = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Verification failed. Please try again.';
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
    } catch (error: unknown) {
      const errorMsg = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Failed to complete registration. Please try again.';
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
            {isAzureSsoConfigured() && (
              <div className="signup-internal-sso-callout" role="note">
                <strong>Peer Islands employees:</strong> use{' '}
                <strong>Login → Sign in with Microsoft</strong> to create your account (no separate signup here).
                This form is for <strong>external</strong> users and includes MFA setup with TOTP.
              </div>
            )}
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                    minLength={8}
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
                {password && (
                  <div className="password-requirements" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <div style={{ marginBottom: '4px', fontWeight: '600', color: '#333' }}>
                      Password must contain:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ color: password.length >= 8 ? '#00684A' : '#d32f2f' }}>
                        {password.length >= 8 ? '✓' : '✗'} At least 8 characters
                      </div>
                      <div style={{ color: /[A-Z]/.test(password) ? '#00684A' : '#d32f2f' }}>
                        {/[A-Z]/.test(password) ? '✓' : '✗'} One uppercase letter
                      </div>
                      <div style={{ color: /[a-z]/.test(password) ? '#00684A' : '#d32f2f' }}>
                        {/[a-z]/.test(password) ? '✓' : '✗'} One lowercase letter
                      </div>
                      <div style={{ color: /\d/.test(password) ? '#00684A' : '#d32f2f' }}>
                        {/\d/.test(password) ? '✓' : '✗'} One number
                      </div>
                      <div style={{ color: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password) ? '#00684A' : '#d32f2f' }}>
                        {/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password) ? '✓' : '✗'} One special character (!@#$%^&* etc.)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password <span className="required-asterisk">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Confirm your password"
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
