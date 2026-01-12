import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import '@/styles/components/SignupModal.css';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signup, loading, clearError } = useAuth();
  const { showToast } = useToast();

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      const errorMsg = 'Passwords do not match!';
      showToast(errorMsg, 'error');
      return;
    }

    // Validate password strength (backend requires min 6, we enforce 8 on frontend)
    if (password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters long.';
      showToast(errorMsg, 'error');
      return;
    }
    
    // Call signup API
    const result = await signup(firstName, lastName, email, password);

    if (result.success) {
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Show success toast
      showToast('Account created successfully! You can now log in.', 'success');
      
      // Close modal
      onClose();
    } else {
      // Show error toast with message from API
      const errorMsg = result.error || 'Signup failed. Please try again.';
      showToast(errorMsg, 'error');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
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

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="signup-modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <h2 className="modal-title">Create Account</h2>
          <p className="modal-subtitle">Join us today</p>
        </div>

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
      </div>
    </div>
  );
};

export default SignupModal;



