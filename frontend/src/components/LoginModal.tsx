import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import '@/styles/components/LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
}

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loading, clearError } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call login API
    const result = await login(email, password);

    if (result.success) {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Reset form
      setEmail('');
      setPassword('');
      
      // Show success toast
      showToast('Login successful! Welcome back.', 'success');
      
      // Close modal
      onClose();

      // Reload page to update UI state and show logged-in header
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      // Show error toast with message from API
      const errorMsg = result.error || 'Login failed. Please try again.';
      showToast(errorMsg, 'error');
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

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <h2 className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Login to your account</p>
        </div>

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
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
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
            <a href="#forgot" className="forgot-password">Forgot password?</a>
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
      </div>
    </div>
  );
};

export default LoginModal;



