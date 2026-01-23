import { useEffect, useCallback, useState } from 'react';
import { markdownToHtml } from '@/utils/markdown';
import { useAuthModal } from '@/contexts/AuthModalContext';
import type { EventCardData } from './EventCard';
import RegistrationConfirmModal from '@/features/events/RegistrationConfirmModal';
import '@/styles/features/events/EventDetailPanel.css';

interface EventDetailPanelProps {
  event: EventCardData | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Format date to alphanumeric format (e.g., "January 15, 2026")
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};


/**
 * EventDetailPanel - Slide-in panel from right displaying event details
 * Shows all event information with markdown support
 */
const EventDetailPanel = ({ event, isOpen, onClose }: EventDetailPanelProps) => {
  const { openLoginModal } = useAuthModal();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if user is logged in
  const isLoggedIn = () => {
    return !!localStorage.getItem('authToken');
  };

  // Handle escape key press
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showConfirmModal) {
        setShowConfirmModal(false);
      } else {
        onClose();
      }
    }
  }, [onClose, showConfirmModal]);

  // Handle click outside panel
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscapeKey]);

  // Show registration confirmation modal
  const showRegistrationModal = () => {
    setShowConfirmModal(true);
  };

  // Handle register button click - requires login
  const handleRegisterClick = () => {
    if (isLoggedIn()) {
      showRegistrationModal();
    } else {
      // Open login modal with callback to show registration after successful login
      openLoginModal(showRegistrationModal);
    }
  };

  // Handle registration confirmation
  const handleConfirmRegistration = () => {
    setShowConfirmModal(false);
    setShowSuccessMessage(true);

    // Hide success message and close panel after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      onClose();
    }, 3000);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };

  if (!event) return null;

  const formattedDate = formatDate(event.date);
  const descriptionHtml = markdownToHtml(event.description || '');
  const attendeeValueHtml = markdownToHtml(event.attendee_value || '');

  return (
    <>
      {/* Overlay - clicking closes the panel */}
      <div 
        className={`event-detail-panel__overlay ${isOpen ? 'visible' : ''}`}
        onClick={handleOverlayClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
        role="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close panel"
        aria-hidden={!isOpen}
      />

      {/* Panel */}
      <aside 
        className={`event-detail-panel ${isOpen ? 'open' : ''}`}
        aria-modal="true"
        aria-labelledby="event-detail-title"
      >
        {/* Success Message Overlay */}
        {showSuccessMessage && (
          <div className="event-detail-panel__success-overlay">
            <div className="event-detail-panel__success-content">
              <svg 
                className="event-detail-panel__success-icon"
                width="64" 
                height="64" 
                viewBox="0 0 64 64" 
                fill="none"
              >
                <circle cx="32" cy="32" r="30" stroke="#00ED64" strokeWidth="4"/>
                <path 
                  d="M20 32L28 40L44 24" 
                  stroke="#00ED64" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="event-detail-panel__success-title">Registered Successfully!</h3>
              <p className="event-detail-panel__success-text">
                You have been registered for this event.
              </p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button 
          className="event-detail-panel__close"
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M18 6L6 18M6 6L18 18" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Panel Content */}
        <div className="event-detail-panel__content">
          {/* Header */}
          <header className="event-detail-panel__header">
            {/* Category Badge */}
            <span className="event-detail-panel__category">
              {event.category}
            </span>

            {/* Title */}
            <h2 id="event-detail-title" className="event-detail-panel__title">
              {event.title}
            </h2>

            {/* Meta Info */}
            <div className="event-detail-panel__meta">
              {formattedDate && (
                <div className="event-detail-panel__meta-item">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 18 18" 
                    fill="none"
                  >
                    <path 
                      d="M15 2.25H14.25V0.75C14.25 0.336 13.914 0 13.5 0C13.086 0 12.75 0.336 12.75 0.75V2.25H5.25V0.75C5.25 0.336 4.914 0 4.5 0C4.086 0 3.75 0.336 3.75 0.75V2.25H3C1.343 2.25 0 3.593 0 5.25V15C0 16.657 1.343 18 3 18H15C16.657 18 18 16.657 18 15V5.25C18 3.593 16.657 2.25 15 2.25ZM16.5 15C16.5 15.827 15.827 16.5 15 16.5H3C2.173 16.5 1.5 15.827 1.5 15V7.5H16.5V15Z" 
                      fill="currentColor"
                    />
                  </svg>
                  <span>{formattedDate}</span>
                </div>
              )}

              {event.time && (
                <div className="event-detail-panel__meta-item">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 18 18" 
                    fill="none"
                  >
                    <path 
                      d="M9 0C4.029 0 0 4.029 0 9C0 13.971 4.029 18 9 18C13.971 18 18 13.971 18 9C18 4.029 13.971 0 9 0ZM9 16.2C5.022 16.2 1.8 12.978 1.8 9C1.8 5.022 5.022 1.8 9 1.8C12.978 1.8 16.2 5.022 16.2 9C16.2 12.978 12.978 16.2 9 16.2ZM9.45 4.5H8.1V9.9L12.78 12.69L13.5 11.52L9.45 9.135V4.5Z" 
                      fill="currentColor"
                    />
                  </svg>
                  <span>{event.time} {event.timezone && `${event.timezone}`}</span>
                </div>
              )}

            </div>
          </header>

          {/* Description Section */}
          {descriptionHtml && (
            <section className="event-detail-panel__section">
              <h3 className="event-detail-panel__section-title">About This Event</h3>
              <div 
                className="event-detail-panel__section-content event-detail-panel__markdown-content"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </section>
          )}

          {/* Attendee Value Section */}
          {attendeeValueHtml && (
            <section className="event-detail-panel__section">
              <h3 className="event-detail-panel__section-title">What You'll Learn</h3>
              <div 
                className="event-detail-panel__section-content event-detail-panel__markdown-content"
                dangerouslySetInnerHTML={{ __html: attendeeValueHtml }}
              />
            </section>
          )}
        </div>

        {/* Footer with Register Button */}
        <footer className="event-detail-panel__footer">
          <button 
            className="event-detail-panel__register-btn"
            onClick={handleRegisterClick}
          >
            Register Now
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
            >
              <path 
                d="M2.75 8H13.25M13.25 8L8.75 3.5M13.25 8L8.75 12.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </footer>
      </aside>

      {/* Registration Confirmation Modal */}
      <RegistrationConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRegistration}
        eventTitle={event.title}
        eventDate={formattedDate}
        eventTime={event.time}
        eventTimezone={event.timezone}
      />
    </>
  );
};

export default EventDetailPanel;
