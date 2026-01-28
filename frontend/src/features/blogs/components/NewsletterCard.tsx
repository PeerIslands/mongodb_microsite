/**
 * Newsletter Card Component - Compact with title only
 * Features newspaper page-turning animation on click
 */

import { Newsletter } from '@/types/newsletter';
import '@/styles/features/blogs/NewsletterCard.css';

interface NewsletterCardProps {
  newsletter: Newsletter;
  onClick: () => void;
}

const NewsletterCard = ({ newsletter, onClick }: NewsletterCardProps) => {
  const handleClick = () => {
    // Add animation class before triggering modal
    const card = document.querySelector(`[data-newsletter-id="${newsletter._id}"]`);
    if (card) {
      card.classList.add('newsletter-card--turning');
      setTimeout(() => {
        onClick();
        // Remove class after animation
        setTimeout(() => {
          card.classList.remove('newsletter-card--turning');
        }, 100);
      }, 400);
    } else {
      onClick();
    }
  };

  return (
    <article 
      className="newsletter-card"
      data-newsletter-id={newsletter._id}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Decorative glow */}
      <div className="newsletter-card__glow" />
      
      {/* Newspaper icon */}
      <div className="newsletter-card__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 7H17M7 11H17M7 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Title only */}
      <h3 className="newsletter-card__title">
        {newsletter.subject}
      </h3>

      {/* Click to read indicator */}
      <div className="newsletter-card__hint">
        Click to read
      </div>
    </article>
  );
};

export default NewsletterCard;
