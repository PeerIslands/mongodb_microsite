import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import axios from 'axios';
import { markdownToHtml } from '@/utils/markdown';
import { getAbsoluteEventMediaUrl } from '@/utils/eventMediaUrl';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { eventsService } from '@/api/services/events.service';
import { eventResourceRequestService } from '@/api/services/eventResourceRequest.service';
import { isAuthenticated, getUserEmail } from '@/utils/sessionStorage';
import type { EventCardData } from './EventCard';
import RegistrationConfirmModal from '@/features/events/RegistrationConfirmModal';
import PdfPreviewModal from '@/features/events/PdfPreviewModal';
import '@/styles/features/events/EventDetailPanel.css';

interface EventDetailPanelProps {
  event: EventCardData | null;
  isOpen: boolean;
  onClose: () => void;
  isRegistered?: boolean;
  registrationId?: string;
  onRegistrationSuccess?: () => void;
  onCancelSuccess?: () => void;
}

/** Build an embeddable iframe src from a video URL (YouTube, Vimeo, Dailymotion, or raw embed URL). */
function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/v\/)([\w-]+)/,
  ];
  for (const p of ytPatterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Dailymotion
  const dmMatch = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([\w-]+)/);
  if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;

  // Already an embed/iframe-friendly URL
  if (/^https?:\/\/.+/.test(url)) return url;

  return null;
}

/** Embeddable external video player — supports YouTube, Vimeo, Dailymotion, and generic iframe URLs. */
function ExternalVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const embedSrc = getEmbedUrl(videoUrl);
  if (!embedSrc) return null;
  return (
    <div className="event-detail-panel__external-video-container">
      <iframe
        src={embedSrc}
        title="Event video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="event-detail-panel__external-video-iframe"
      />
    </div>
  );
}

/** Append cache-busting param so updated thumbnail/video are not served from cache */
const withCacheBust = (url: string, updatedAt?: string): string => {
  if (!url) return url;
  const param = updatedAt ? `t=${encodeURIComponent(updatedAt)}` : `t=${Date.now()}`;
  return url.includes('?') ? `${url}&${param}` : `${url}?${param}`;
};

/** HLS when playlist URL present, else fallback to single-file video (proxy URL) */
function EventVideoPlayer({
  hlsPlaylistUrl,
  fallbackVideoUrl,
  posterUrl,
}: {
  hlsPlaylistUrl: string;
  fallbackVideoUrl: string;
  posterUrl: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsPlaylistUrl) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(hlsPlaylistUrl);
        hls.attachMedia(video);
        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsPlaylistUrl;
        return () => {
          video.removeAttribute('src');
        };
      }
      // HLS not supported: fall back to single-file URL if available
      if (fallbackVideoUrl) {
        video.src = fallbackVideoUrl;
        return () => video.removeAttribute('src');
      }
      return;
    }

    if (fallbackVideoUrl) {
      video.src = fallbackVideoUrl;
      return () => video.removeAttribute('src');
    }
  }, [hlsPlaylistUrl, fallbackVideoUrl]);

  const src = hlsPlaylistUrl ? undefined : fallbackVideoUrl || undefined;

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      className="event-detail-panel__video"
      poster={posterUrl || undefined}
    >
      Your browser does not support the video tag.
    </video>
  );
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
const EventDetailPanel = ({ event, isOpen, onClose, isRegistered = false, registrationId, onRegistrationSuccess, onCancelSuccess }: EventDetailPanelProps) => {
  const navigate = useNavigate();
  const { openLoginModal } = useAuthModal();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Fetched event by ID so we always show latest thumbnail/video (list may be cached/stale)
  const [detailEvent, setDetailEvent] = useState<EventCardData | null>(null);
  // Media tabs (video / PDF) and PDF preview / request resource
  const [mediaTab, setMediaTab] = useState<'video' | 'pdf'>('video');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [resourceRequestSubmitted, setResourceRequestSubmitted] = useState(false);
  const [isRequestingResource, setIsRequestingResource] = useState(false);

  // Check if user is logged in
  const isLoggedIn = () => {
    return isAuthenticated();
  };

  // Handle escape key press
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showConfirmModal) {
        setShowConfirmModal(false);
      } else if (showCancelModal) {
        setShowCancelModal(false);
      } else {
        onClose();
      }
    }
  }, [onClose, showConfirmModal, showCancelModal]);

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

  // Refetch event by ID when panel opens so we show latest thumbnail/video (list can be stale after admin update)
  useEffect(() => {
    if (!isOpen || !event?.id) {
      setDetailEvent(null);
      return;
    }
    let cancelled = false;
    eventsService.getById(event.id).then((data) => {
      if (cancelled) return;
      const merged: EventCardData = {
        ...event,
        ...data,
        thumbnail_url: data.thumbnail_url,
        video_url: data.video_url,
        external_video_url: (data as { external_video_url?: string }).external_video_url,
        hls_playlist_url: (data as { hls_playlist_url?: string }).hls_playlist_url,
        is_past: data.is_past,
      };
      setDetailEvent(merged);
      if (import.meta.env.DEV) {
        console.log('[EventDetailPanel] Fetched event for detail', {
          eventId: event.id,
          thumbnail_url: data.thumbnail_url,
          video_url: data.video_url,
          hls_playlist_url: (data as { hls_playlist_url?: string }).hls_playlist_url,
          hasThumbnail: !!data.thumbnail_url,
          hasVideo: !!data.video_url,
        });
      }
    }).catch((err) => {
      if (!cancelled && import.meta.env.DEV) {
        console.warn('[EventDetailPanel] Failed to fetch event by ID', event.id, err);
      }
      if (!cancelled) setDetailEvent(null);
    });
    return () => { cancelled = true; };
  }, [isOpen, event?.id]);

  // Debug: log what the panel received from the list (when opening)
  useEffect(() => {
    if (isOpen && event && import.meta.env.DEV) {
      console.log('[EventDetailPanel] Event from list (may be stale)', {
        eventId: event.id,
        thumbnail_url: event.thumbnail_url,
        video_url: event.video_url,
      });
    }
  }, [isOpen, event?.id, event?.thumbnail_url, event?.video_url]);

  // Show registration confirmation modal (used when already logged in)
  const showRegistrationModal = () => {
    setShowConfirmModal(true);
  };

  // Auto-register for the event after user completes login (no confirm modal)
  const handleAutoRegisterAfterLogin = useCallback(async () => {
    if (!event?.id) return;

    setShowConfirmModal(false);
    setErrorMessage(null);
    setIsRegistering(true);

    try {
      await eventsService.registerForEvent(event.id);
      setSuccessMessageText('You have been registered for this event.');
      setShowSuccessMessage(true);
      onRegistrationSuccess?.();
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setErrorMessage('You are already registered for this event.');
      } else {
        setErrorMessage('Failed to register. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  }, [event?.id, onRegistrationSuccess, onClose]);

  // Handle register button click - requires login
  const handleRegisterClick = () => {
    if (isLoggedIn()) {
      showRegistrationModal();
    } else {
      // Open login modal; after successful login, auto-register for this event
      openLoginModal(handleAutoRegisterAfterLogin);
    }
  };

  // Handle registration confirmation
  const handleConfirmRegistration = async () => {
    if (!event?.id) return;

    setIsRegistering(true);
    setErrorMessage(null);

    try {
      await eventsService.registerForEvent(event.id);
      setShowConfirmModal(false);
      setSuccessMessageText('You have been registered for this event.');
      setShowSuccessMessage(true);

      // Refetch events to update registration status
      onRegistrationSuccess?.();

      // Hide success message and close panel after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 3000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        
        if (status === 401 || status === 403) {
          // Close modal and prompt login
          setShowConfirmModal(false);
          openLoginModal(showRegistrationModal);
        } else if (status === 409) {
          // Already registered
          setErrorMessage('You are already registered for this event.');
        } else {
          setErrorMessage('Failed to register. Please try again.');
        }
      } else {
        setErrorMessage('Failed to register. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle cancel registration button click
  const handleCancelRegistrationClick = () => {
    setShowCancelModal(true);
  };

  // Handle cancel registration confirmation
  const handleConfirmCancellation = async () => {
    if (!registrationId) return;

    setIsCancelling(true);
    setErrorMessage(null);

    try {
      await eventsService.cancelRegistration(registrationId);
      setShowCancelModal(false);
      setSuccessMessageText('Your registration has been cancelled.');
      setShowSuccessMessage(true);

      // Refetch events to update registration status
      onCancelSuccess?.();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 3000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        
        if (status === 401 || status === 403) {
          setShowCancelModal(false);
          setErrorMessage('Please log in to cancel your registration.');
        } else if (status === 404) {
          setErrorMessage('Registration not found.');
        } else {
          setErrorMessage('Failed to cancel registration. Please try again.');
        }
      } else {
        setErrorMessage('Failed to cancel registration. Please try again.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle cancel modal close
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setErrorMessage(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setErrorMessage(null);
  };

  // Request event PDF resource (name + email to admin, same as newsletter access)
  const handleRequestResource = () => {
    if (!isLoggedIn()) {
      openLoginModal(() => {
        // After login, user can click again
      });
      return;
    }
    const email = getUserEmail();
    if (!email || !event?.id) return;
    setIsRequestingResource(true);
    setErrorMessage(null);
    eventResourceRequestService
      .request({ event_id: event.id, user_email: email })
      .then(() => {
        setResourceRequestSubmitted(true);
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => {
        const msg = err?.response?.data?.detail || 'Failed to submit request. Please try again.';
        setErrorMessage(msg);
      })
      .finally(() => {
        setIsRequestingResource(false);
      });
  };

  if (!event) return null;

  // Use refetched detail when available so thumbnail/video are up to date after admin changes
  const displayEvent = detailEvent ?? event;

  const formattedDate = formatDate(displayEvent.date);
  const descriptionHtml = markdownToHtml(displayEvent.description || '');
  const attendeeValueHtml = markdownToHtml(displayEvent.attendee_value || '');

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
              <h3 className="event-detail-panel__success-title">
                {successMessageText.includes('cancelled') ? 'Cancelled Successfully!' : 'Registered Successfully!'}
              </h3>
              <p className="event-detail-panel__success-text">
                {successMessageText}
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
              {displayEvent.category}
            </span>

            {/* Title */}
            <h2 id="event-detail-title" className="event-detail-panel__title">
              {displayEvent.title}
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

              {displayEvent.time && (
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
                  <span>{displayEvent.time} {displayEvent.timezone && `${displayEvent.timezone}`}</span>
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

          {/* Media Section: Video/External embed + PDF tabs (past events with media; only for logged-in registered users) */}
          {displayEvent.is_past && (displayEvent.video_url || displayEvent.external_video_url || displayEvent.pdf_url) && isLoggedIn() && isRegistered && (() => {
            const hasVideo = !!(displayEvent.video_url || displayEvent.external_video_url);
            const hasPdf = !!displayEvent.pdf_url;

            const renderVideoPlayer = () => {
              if (displayEvent.external_video_url) {
                return <ExternalVideoPlayer videoUrl={displayEvent.external_video_url} />;
              }
              if (displayEvent.video_url) {
                return (
                  <EventVideoPlayer
                    hlsPlaylistUrl={displayEvent.hls_playlist_url ? withCacheBust(displayEvent.hls_playlist_url, displayEvent.updated_at) : ''}
                    fallbackVideoUrl={withCacheBust(getAbsoluteEventMediaUrl(displayEvent.video_url), displayEvent.updated_at)}
                    posterUrl={displayEvent.thumbnail_url ? withCacheBust(getAbsoluteEventMediaUrl(displayEvent.thumbnail_url), displayEvent.updated_at) : ''}
                  />
                );
              }
              return null;
            };

            const renderPdfSection = () => (
              <div className="event-detail-panel__pdf-tab">
                <div
                  className="event-detail-panel__pdf-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPdfPreview(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPdfPreview(true); }}
                >
                  <div className="event-detail-panel__pdf-card-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="event-detail-panel__pdf-card-title">Event Resource (PDF)</h4>
                  <p className="event-detail-panel__pdf-card-hint">Click to view</p>
                </div>
                {resourceRequestSubmitted ? (
                  <p className="event-detail-panel__resource-message">Email request submitted</p>
                ) : (
                  <button
                    type="button"
                    className="event-detail-panel__request-resource-btn"
                    onClick={handleRequestResource}
                    disabled={isRequestingResource}
                  >
                    {isRequestingResource ? 'Submitting...' : 'Request resource'}
                  </button>
                )}
              </div>
            );

            return (
              <section className="event-detail-panel__section event-detail-panel__media-section">
                <h3 className="event-detail-panel__section-title">Event Resources</h3>
                {hasVideo && hasPdf ? (
                  <>
                    <div className="event-detail-panel__tabs">
                      <button
                        type="button"
                        className={`event-detail-panel__tab ${mediaTab === 'video' ? 'active' : ''}`}
                        onClick={() => setMediaTab('video')}
                      >
                        Video
                      </button>
                      <button
                        type="button"
                        className={`event-detail-panel__tab ${mediaTab === 'pdf' ? 'active' : ''}`}
                        onClick={() => setMediaTab('pdf')}
                      >
                        PDF
                      </button>
                    </div>
                    {mediaTab === 'video' && (
                      <div className="event-detail-panel__video-container">
                        {renderVideoPlayer()}
                      </div>
                    )}
                    {mediaTab === 'pdf' && renderPdfSection()}
                  </>
                ) : hasVideo ? (
                  <div className="event-detail-panel__video-container">
                    {renderVideoPlayer()}
                  </div>
                ) : hasPdf ? (
                  renderPdfSection()
                ) : null}
              </section>
            );
          })()}
        </div>

        {/* Footer with Register Button or Cancel Registration (upcoming only) or Submit enquiry (past only) */}
        <footer className="event-detail-panel__footer">
          {isRegistered ? (
            displayEvent.is_past ? (
              <button
                type="button"
                className="event-detail-panel__enquiry-btn"
                onClick={() => { onClose(); navigate('/contact'); }}
              >
                Submit enquiry
              </button>
            ) : (
              <button 
                className="event-detail-panel__cancel-btn"
                onClick={handleCancelRegistrationClick}
              >
                Cancel Registration
              </button>
            )
          ) : (
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
          )}
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
        isLoading={isRegistering}
      />

      {/* Cancel Registration Confirmation Modal */}
      <RegistrationConfirmModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancellation}
        eventTitle={event.title}
        eventDate={formattedDate}
        eventTime={event.time}
        eventTimezone={event.timezone}
        isLoading={isCancelling}
        variant="cancel"
      />

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="event-detail-panel__error-toast">
          <span>{errorMessage}</span>
          <button 
            className="event-detail-panel__error-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Close error message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path 
                d="M12 4L4 12M4 4L12 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* PDF Preview Modal (view only) */}
      {displayEvent?.pdf_url && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          title="Event Resource"
          pdfUrl={withCacheBust(getAbsoluteEventMediaUrl(displayEvent.pdf_url), displayEvent.updated_at)}
        />
      )}
    </>
  );
};

export default EventDetailPanel;
