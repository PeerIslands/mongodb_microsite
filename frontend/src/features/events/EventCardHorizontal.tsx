import type { EventCardData } from './EventCard';
import '@/styles/features/events/EventCardHorizontal.css';

interface EventCardHorizontalProps {
  data: EventCardData;
  onClick?: () => void;
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
 * Truncate text to a specific character limit
 */
const truncateText = (text: string, charLimit: number): string => {
  if (text.length <= charLimit) return text;
  return text.slice(0, charLimit).trim() + '...';
};

/**
 * EventCardHorizontal - Horizontal layout event card
 * Layout: Left side - Title, Date/Time | Right side - Category, Description, CTA
 * Used primarily on the home page carousel
 */
const EventCardHorizontal = ({ data, onClick }: EventCardHorizontalProps) => {
  const formattedDate = formatDate(data.date);
  const displayDescription = data.subtitle || truncateText(data.description, 120);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      type="button"
      className="event-card-horizontal"
      onClick={handleClick}
      aria-label={`View details for ${data.title}`}
    >
      {/* Decorative glow */}
      <div className="event-card-horizontal__glow" />
      
      {/* Left Section - Title and Date/Time */}
      <div className="event-card-horizontal__left">
        <h3 className="event-card-horizontal__title">
          {data.title}
        </h3>
        
        <div className="event-card-horizontal__meta">
          {formattedDate && (
            <span className="event-card-horizontal__date">
              <svg 
                className="event-card-horizontal__icon"
                width="16" 
                height="16" 
                viewBox="0 0 14 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M11.6667 1.75H11.0833V0.583333C11.0833 0.261167 10.8221 0 10.5 0C10.1779 0 9.91667 0.261167 9.91667 0.583333V1.75H4.08333V0.583333C4.08333 0.261167 3.82217 0 3.5 0C3.17783 0 2.91667 0.261167 2.91667 0.583333V1.75H2.33333C1.04467 1.75 0 2.79467 0 4.08333V11.6667C0 12.9553 1.04467 14 2.33333 14H11.6667C12.9553 14 14 12.9553 14 11.6667V4.08333C14 2.79467 12.9553 1.75 11.6667 1.75ZM12.8333 11.6667C12.8333 12.3113 12.3113 12.8333 11.6667 12.8333H2.33333C1.68867 12.8333 1.16667 12.3113 1.16667 11.6667V5.83333H12.8333V11.6667Z" 
                  fill="currentColor"
                />
              </svg>
              {formattedDate}
            </span>
          )}
          {data.time && (
            <span className="event-card-horizontal__time">
              <svg 
                className="event-card-horizontal__icon"
                width="16" 
                height="16" 
                viewBox="0 0 14 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0ZM7 12.6C3.9072 12.6 1.4 10.0928 1.4 7C1.4 3.9072 3.9072 1.4 7 1.4C10.0928 1.4 12.6 3.9072 12.6 7C12.6 10.0928 10.0928 12.6 7 12.6ZM7.35 3.5H6.3V7.7L9.94 9.87L10.5 8.96L7.35 7.105V3.5Z" 
                  fill="currentColor"
                />
              </svg>
              {data.time} {data.timezone && `${data.timezone}`}
            </span>
          )}
        </div>
      </div>
      
      {/* Right Section - Category, Description, CTA */}
      <div className="event-card-horizontal__right">
        <div className="event-card-horizontal__content">
          <span className="event-card-horizontal__category">
            {data.category}
          </span>
          
          <p className="event-card-horizontal__description">
            {displayDescription}
          </p>
        </div>
        
        <span className="event-card-horizontal__cta">
          <span className="event-card-horizontal__cta-text">View Details</span>
          <span className="event-card-horizontal__cta-icon">
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
    </button>
  );
};

export default EventCardHorizontal;
