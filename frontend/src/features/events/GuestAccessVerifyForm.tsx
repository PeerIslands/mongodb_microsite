import { useState, useEffect, useCallback } from 'react';
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
}

const GuestAccessVerifyForm = ({
  isOpen,
  onClose,
  onVerified,
  eventId,
  eventTitle,
}: GuestAccessVerifyFormProps) => {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const result = await eventsService.verifyGuestAccess(eventId, trimmed);
      onVerified(result.email);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("We couldn't find a registration for this email address. Please check and try again, or register below.");
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
        <p className="gav-desc">
          Enter the email address you used when you registered for this event to access the recording and resources.
        </p>

        <form onSubmit={handleSubmit} className="gav-form" noValidate>
          <div className="gav-field">
            <label htmlFor="gav-email">Email Address</label>
            <input
              id="gav-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              placeholder="jane@company.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          {error && <p className="gav-error" role="alert">{error}</p>}

          <div className="gav-actions">
            <button type="button" className="gav-btn gav-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="gav-btn gav-btn--verify" disabled={isVerifying}>
              {isVerifying ? 'Verifying…' : 'Verify Access'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default GuestAccessVerifyForm;
