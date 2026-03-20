import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '@/api/services/events.service';
import axios from 'axios';
import '@/styles/features/events/GuestRegistrationForm.css';

interface GuestRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the registered email once registration is confirmed */
  onSuccess: (email: string) => void;
  /** Optionally called when the user clicks "Log in instead" */
  onLoginInstead?: () => void;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventTimezone?: string;
  /** Controls success state copy and auto-close behaviour */
  isPastEvent?: boolean;
}

const GuestRegistrationForm = ({
  isOpen,
  onClose,
  onSuccess,
  onLoginInstead,
  eventId,
  eventTitle,
  eventDate,
  eventTime,
  eventTimezone,
  isPastEvent = false,
}: GuestRegistrationFormProps) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    designation: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainBlocked, setDomainBlocked] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Reset state whenever the modal reopens
  useEffect(() => {
    if (isOpen) {
      setForm({ first_name: '', last_name: '', email: '', company: '', designation: '', phone: '' });
      setError(null);
      setDomainBlocked(false);
      setRegistrationSuccess(false);
      setRegisteredEmail('');
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

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError('First name, last name and email are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await eventsService.guestRegisterForEvent({
        event_id: eventId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        designation: form.designation.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });

      const email = form.email.trim();
      setRegisteredEmail(email);

      if (isPastEvent) {
        // For past events: notify parent immediately so resources become visible
        onSuccess(email);
      } else {
        // For future events: show in-form success state, then notify parent after brief delay
        setRegistrationSuccess(true);
        setTimeout(() => {
          onSuccess(email);
        }, 3500);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403 && err.response?.data?.detail === 'domain_not_whitelisted') {
          setDomainBlocked(true);
        } else if (err.response?.status === 409) {
          setError('This email is already registered for this event.');
        } else {
          setError('Failed to register. Please try again.');
        }
      } else {
        setError('Failed to register. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="guest-reg-overlay" onClick={onClose} />
      <div className="guest-reg-modal" role="dialog" aria-modal="true" aria-labelledby="guest-reg-title">
        <button className="guest-reg-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <h2 id="guest-reg-title" className="guest-reg-title">Register for Event</h2>
        <p className="guest-reg-event-name">{eventTitle}</p>
        {(eventDate || eventTime) && (
          <p className="guest-reg-event-meta">
            {[eventDate, eventTime, eventTimezone].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* ── Domain not whitelisted ──────────────────── */}
        {domainBlocked ? (
          <div className="guest-reg-domain-blocked">
            <div className="guest-reg-domain-blocked__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="1.5"/>
                <path d="M12 7v5M12 16v1" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="guest-reg-domain-blocked__title">Access Request Submitted</h3>
            <p className="guest-reg-domain-blocked__msg">
              Your email domain hasn't been approved yet. Your request has been forwarded to the admin for review. You'll be able to register once your domain is approved.
            </p>
            <button type="button" className="guest-reg-btn guest-reg-btn--cancel" onClick={onClose}>
              Close
            </button>
          </div>

        /* ── Future-event registration success ──────── */
        ) : registrationSuccess ? (
          <div className="guest-reg-success">
            <div className="guest-reg-success__icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="#00ed64" strokeWidth="2"/>
                <path d="M15 24L21 30L33 18" stroke="#00ed64" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="guest-reg-success__title">You're registered!</h3>
            <p className="guest-reg-success__msg">
              A confirmation email has been sent to{' '}
              <strong>{registeredEmail}</strong>. See you at the event!
            </p>
          </div>

        /* ── Registration form ──────────────────────── */
        ) : (
          <form onSubmit={handleSubmit} className="guest-reg-form" noValidate>
            <div className="guest-reg-row">
              <div className="guest-reg-field">
                <label htmlFor="gr-first-name">First Name <span className="guest-reg-required">*</span></label>
                <input
                  id="gr-first-name"
                  type="text"
                  value={form.first_name}
                  onChange={handleChange('first_name')}
                  placeholder="Jane"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="guest-reg-field">
                <label htmlFor="gr-last-name">Last Name <span className="guest-reg-required">*</span></label>
                <input
                  id="gr-last-name"
                  type="text"
                  value={form.last_name}
                  onChange={handleChange('last_name')}
                  placeholder="Smith"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="guest-reg-field">
              <label htmlFor="gr-email">Email <span className="guest-reg-required">*</span></label>
              <input
                id="gr-email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="jane@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="guest-reg-field">
              <label htmlFor="gr-company">Company</label>
              <input
                id="gr-company"
                type="text"
                value={form.company}
                onChange={handleChange('company')}
                placeholder="Acme Corp"
                autoComplete="organization"
              />
            </div>

            <div className="guest-reg-row">
              <div className="guest-reg-field">
                <label htmlFor="gr-designation">Designation / Job Title</label>
                <input
                  id="gr-designation"
                  type="text"
                  value={form.designation}
                  onChange={handleChange('designation')}
                  placeholder="Senior Engineer"
                  autoComplete="organization-title"
                />
              </div>
              <div className="guest-reg-field">
                <label htmlFor="gr-phone">Phone Number</label>
                <input
                  id="gr-phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="+1 555 000 0000"
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && <p className="guest-reg-error" role="alert">{error}</p>}

            <div className="guest-reg-actions">
              <button type="button" className="guest-reg-btn guest-reg-btn--cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="guest-reg-btn guest-reg-btn--submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering…' : 'Register'}
              </button>
            </div>

            {onLoginInstead && (
              <p className="guest-reg-login-hint">
                Already have an account?{' '}
                <button type="button" className="guest-reg-login-link" onClick={onLoginInstead}>
                  Log in and register instead
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
};

export default GuestRegistrationForm;
