import { useState, useEffect, useCallback, useRef } from 'react';
import { eventsService } from '@/api/services/events.service';
import axios from 'axios';
import '@/styles/features/events/GuestAccessVerifyForm.css';

interface GuestAccessVerifyFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the verified email once access is confirmed */
  onVerified: (email: string) => void;
  eventId: string;
  eventTitle: string;
  initialEmail?: string;
  autoSendOtp?: boolean;
  lockEmail?: boolean;
}

const GuestAccessVerifyForm = ({
  isOpen,
  onClose,
  onVerified,
  eventId,
  eventTitle,
  initialEmail,
  autoSendOtp = false,
  lockEmail = false,
}: GuestAccessVerifyFormProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRequestedRef = useRef(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail ?? '');
      setOtpCode('');
      setOtpSent(false);
      setInfoMessage(null);
      setError(null);
      setIsSendingOtp(false);
      setIsVerifying(false);
      autoRequestedRef.current = false;
    }
  }, [isOpen, initialEmail]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const handleSendOtp = useCallback(async (emailOverride?: string) => {
    const trimmed = (emailOverride ?? email).trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }

    setIsSendingOtp(true);
    setError(null);
    setInfoMessage(null);
    try {
      await eventsService.sendGuestAccessOtp(eventId, trimmed);
      setEmail(trimmed);
      setOtpSent(true);
      setInfoMessage(`We sent a 6-digit access code to ${trimmed}.`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (err.response?.status === 404) {
          setError("We couldn't find a registration for this email address. Please check and try again, or register below.");
        } else if (typeof detail === 'string' && detail) {
          setError(detail);
        } else {
          setError('Failed to send access code. Please try again.');
        }
      } else {
        setError('Failed to send access code. Please try again.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  }, [email, eventId]);

  useEffect(() => {
    if (!isOpen || !autoSendOtp || !initialEmail || autoRequestedRef.current) return;
    autoRequestedRef.current = true;
    void handleSendOtp(initialEmail);
  }, [autoSendOtp, handleSendOtp, initialEmail, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp) {
      setError('Please enter the access code sent to your email.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const result = await eventsService.verifyGuestAccessOtp(eventId, trimmedEmail, trimmedOtp);
      onVerified(result.email);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string' && detail) {
          setError(detail);
        } else {
          setError('Verification failed. Please try again.');
        }
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="gav-overlay" onClick={onClose} />
      <div className="gav-modal" role="dialog" aria-modal="true" aria-labelledby="gav-title">
        <button className="gav-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="gav-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#00ed64" strokeWidth="1.5"/>
            <path d="M9 12l2 2 4-4" stroke="#00ed64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 id="gav-title" className="gav-title">Verify Your Access</h2>
        <p className="gav-event-name">{eventTitle}</p>
        {autoSendOtp && (
          <div className="gav-existing-registration" role="status">
            This email is already registered for this event. We sent a verification code to your email.
          </div>
        )}
        <p className="gav-desc">
          {autoSendOtp
            ? 'Enter the verification code to continue and unlock the recording and resources.'
            : 'Enter the email address you used when you registered for this event. We will email you a one-time code to unlock the recording and resources.'}
        </p>

        <form onSubmit={handleSubmit} className="gav-form" noValidate>
          <div className="gav-field">
            <label htmlFor="gav-email">Email Address</label>
            {lockEmail && otpSent ? (
              <div className="gav-locked-email" id="gav-email" aria-live="polite">
                {email}
              </div>
            ) : (
              <input
                id="gav-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="jane@company.com"
                autoComplete="email"
                autoFocus
                required
                readOnly={lockEmail && (autoSendOtp || otpSent)}
              />
            )}
          </div>

          {otpSent && (
            <div className="gav-field">
              <label htmlFor="gav-otp">Access Code</label>
              <input
                id="gav-otp"
                type="text"
                value={otpCode}
                onChange={e => { setOtpCode(e.target.value); setError(null); }}
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
                inputMode="numeric"
                required
              />
            </div>
          )}

          {infoMessage && <p className="gav-info" role="status">{infoMessage}</p>}
          {error && <p className="gav-error" role="alert">{error}</p>}

          <div className="gav-actions">
            <button type="button" className="gav-btn gav-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            {otpSent && (
              <button
                type="button"
                className="gav-btn gav-btn--secondary"
                onClick={() => { void handleSendOtp(); }}
                disabled={isSendingOtp || isVerifying}
              >
                {isSendingOtp ? 'Sending…' : 'Resend code'}
              </button>
            )}
            <button type="submit" className="gav-btn gav-btn--verify" disabled={isVerifying || isSendingOtp}>
              {!otpSent ? (isSendingOtp ? 'Sending…' : 'Send code') : (isVerifying ? 'Verifying…' : 'Verify access')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default GuestAccessVerifyForm;
