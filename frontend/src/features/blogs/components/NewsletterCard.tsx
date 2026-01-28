/**
 * Newsletter Card Component
 * Matches BlogCard dark glassmorphism design
 */

import { Newsletter } from '@/types/newsletter';
import '@/styles/features/blogs/NewsletterCard.css';

interface NewsletterCardProps {
  newsletter: Newsletter;
  onClick: () => void;
}

const NewsletterCard = ({ newsletter, onClick }: NewsletterCardProps) => {
  return (
    <article 
      className="newsletter-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Decorative glow */}
      <div className="newsletter-card__glow" />
      
      {/* Category badge */}
      <span className="newsletter-card__category">
        Newsletter
      </span>

      {/* Title */}
      <h3 className="newsletter-card__title">
        {newsletter.subject}
      </h3>

      {/* Description */}
      {newsletter.description && (
        <p className="newsletter-card__description">
          {newsletter.description}
        </p>
      )}

      {/* Footer - Read Newsletter link */}
      <div className="newsletter-card__footer">
        <span className="newsletter-card__link">
          <span className="newsletter-card__link-text">Read Newsletter</span>
          <span className="newsletter-card__link-icon">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                d="M2.75 8H13.25M13.25 8L8.75 3.5M13.25 8L8.75 12.5" 
                stroke="#00ED64" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </div>
    </article>
  );
};

export default NewsletterCard;
