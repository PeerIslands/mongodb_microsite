import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analytics } from '@/utils/analytics';
import '@/styles/features/home/OnDemandWebinarsPopup.css';

const VISIBLE_DURATION_MS = 5_000;

export interface HomePopupConfig {
  imageUrl: string;
  titleText: string;
  ctaText: string;
  ctaLink: string;
}

/**
 * Popup shown at bottom-left of the home page. Config (image, title, CTA) is admin-driven.
 * Appears when config is provided, stays 10 seconds, then auto-dismisses. User can dismiss early or click to go to CTA link.
 */
const OnDemandWebinarsPopup = ({ config }: { config: HomePopupConfig | null }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(!!config);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (config) setVisible(true);
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const startExitTimer = setTimeout(() => setExiting(true), VISIBLE_DURATION_MS);
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS + 300);
    return () => {
      clearTimeout(startExitTimer);
      clearTimeout(hideTimer);
    };
  }, [config]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  };

  const handleClick = () => {
    analytics.trackCTAClick('On-Demand Webinars Popup', 'Home Page');
    const link = config?.ctaLink || '/events/on-demand';
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  if (!config || !visible) return null;

  return (
    <div
      className={`on-demand-popup ${exiting ? 'on-demand-popup--exiting' : ''}`}
      role="dialog"
      aria-label={config.titleText}
    >
      <button
        type="button"
        className="on-demand-popup__close"
        onClick={handleDismiss}
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" className="on-demand-popup__content" onClick={handleClick}>
        <div className="on-demand-popup__image-wrap">
          <img
            src={config.imageUrl}
            alt={config.titleText}
            className="on-demand-popup__image"
          />
          <span className="on-demand-popup__overlay-title">{config.titleText}</span>
        </div>
        <span className="on-demand-popup__cta">{config.ctaText}</span>
      </button>
    </div>
  );
};

export default OnDemandWebinarsPopup;
