import { useEffect, useCallback } from 'react';
import '@/styles/features/events/RegistrationConfirmModal.css';

interface RegistrationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventTimezone?: string;
}

/**
 * RegistrationConfirmModal - Centered modal for registration confirmation
 * Displays event metadata and asks for confirmation
 */
const RegistrationConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  eventDate,
  eventTime,
  eventTimezone,
}: RegistrationConfirmModalProps) => {
  // Handle escape key press
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle click outside modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div 
      className="registration-modal__overlay"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div className="registration-modal">
        {/* Close Button */}
        <button 
          className="registration-modal__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path 
              d="M15 5L5 15M5 5L15 15" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="registration-modal__content">
          {/* Icon */}
          <div className="registration-modal__icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path 
                d="M26 5H24V3C24 2.448 23.552 2 23 2C22.448 2 22 2.448 22 3V5H10V3C10 2.448 9.552 2 9 2C8.448 2 8 2.448 8 3V5H6C3.794 5 2 6.794 2 9V26C2 28.206 3.794 30 6 30H26C28.206 30 30 28.206 30 26V9C30 6.794 28.206 5 26 5ZM28 26C28 27.103 27.103 28 26 28H6C4.897 28 4 27.103 4 26V13H28V26Z" 
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 id="registration-modal-title" className="registration-modal__title">
            Confirm Registration
          </h3>

          {/* Event Details */}
          <div className="registration-modal__details">
            <div className="registration-modal__detail-row">
              <span className="registration-modal__detail-label">Event</span>
              <span className="registration-modal__detail-value">{eventTitle}</span>
            </div>

            {eventDate && (
              <div className="registration-modal__detail-row">
                <span className="registration-modal__detail-label">Date</span>
                <span className="registration-modal__detail-value">{eventDate}</span>
              </div>
            )}

            {eventTime && (
              <div className="registration-modal__detail-row">
                <span className="registration-modal__detail-label">Time</span>
                <span className="registration-modal__detail-value">
                  {eventTime} {eventTimezone && `(${eventTimezone})`}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation Message */}
          <p className="registration-modal__message">
            Would you like to register for this event?
          </p>

          {/* Action Buttons */}
          <div className="registration-modal__actions">
            <button 
              className="registration-modal__btn registration-modal__btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="registration-modal__btn registration-modal__btn--confirm"
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmModal;
