/**
 * TOTPVerificationInput Component
 * 
 * 6-digit TOTP code input with auto-focus and countdown timer
 */

import { useState, useRef, useEffect } from 'react';
import '@/styles/components/TOTPVerificationInput.css';

interface TOTPVerificationInputProps {
  onCodeComplete: (code: string) => void;
  onCodeChange?: (code: string) => void;
  loading?: boolean;
  error?: string;
}

const TOTPVerificationInput = ({ 
  onCodeComplete, 
  onCodeChange,
  loading = false,
  error 
}: TOTPVerificationInputProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate time remaining until next code (30-second window)
  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Clear code inputs when error occurs
  useEffect(() => {
    if (error) {
      setCode(['', '', '', '', '', '']);
      if (onCodeChange) {
        onCodeChange('');
      }
      // Focus first input after clearing
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [error, onCodeChange]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Call onChange callback
    const codeString = newCode.join('');
    if (onCodeChange) {
      onCodeChange(codeString);
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits entered, call onCodeComplete
    if (newCode.every(digit => digit !== '') && codeString.length === 6) {
      onCodeComplete(codeString);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle right arrow
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      
      // Call callbacks
      if (onCodeChange) {
        onCodeChange(pastedData);
      }
      onCodeComplete(pastedData);
      
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleClear = () => {
    setCode(['', '', '', '', '', '']);
    if (onCodeChange) {
      onCodeChange('');
    }
    inputRefs.current[0]?.focus();
  };

  // Calculate progress bar width
  const progressWidth = (timeRemaining / 30) * 100;

  return (
    <div className="totp-verification-input">
      <div className="totp-header">
        <h3>Enter Authentication Code</h3>
        <p className="totp-subtitle">
          Open your authenticator app and enter the 6-digit code
        </p>
      </div>

      <div className="code-input-container">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={loading}
            className={`code-digit ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
            autoComplete="off"
          />
        ))}
      </div>

      {error && (
        <div className="totp-error">
          <span className="error-message">{error}</span>
        </div>
      )}

      <div className="totp-timer">
        <div className="timer-info">
          <span className="timer-icon">⏱</span>
          <span className="timer-text">
            New code in <strong>{timeRemaining}</strong> seconds
          </span>
        </div>
        <div className="timer-progress-bar">
          <div 
            className="timer-progress-fill" 
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="clear-button"
        disabled={loading || code.every(d => !d)}
      >
        Clear
      </button>

      <div className="totp-help">
        <p className="help-icon">💡</p>
        <p className="help-text">
          The code refreshes every 30 seconds. Enter the current code from your app.
        </p>
      </div>
    </div>
  );
};

export default TOTPVerificationInput;

