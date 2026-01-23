import { useState } from 'react';
import { markdownToHtml } from '@/utils/markdown';
import '@/styles/features/events/EventCard.css';

export interface EventCardData {
  id: string;
  title: string;
  description: string;
  category: string; // Single category string (matches backend)
  subtitle?: string;
  date?: string;
  time?: string;
  timezone?: string;
  duration_minutes?: number;
  attendee_value?: string;
  tags?: string[];
  status?: 'published' | 'draft';
  created_at?: string;
  updated_at?: string;
}

interface EventCardProps {
  data: EventCardData;
  onCardClick?: (data: EventCardData) => void;
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
    return dateString; // Return original if parsing fails
  }
};

/**
 * Truncate text to a specific word limit
 */
const truncateToWords = (text: string, wordLimit: number): string => {
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

/**
 * EventCard - Individual event card for the grid
 * Displays category, title, description, date, and links to event URL
 * Styled similarly to CaseStudyCard with no image
 */
const EventCard = ({ data, onCardClick }: EventCardProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [areTagsExpanded, setAreTagsExpanded] = useState(false);

  const handleClick = () => {
    // If onCardClick is provided, call it to open the detail panel
    if (onCardClick) {
      onCardClick(data);
    } else {
      // Fallback: expand/collapse description
      setIsDescriptionExpanded(!isDescriptionExpanded);
    }
  };

  const handleDescriptionToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling expand
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleTagsToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling tags
    if (data.tags && data.tags.length > 1) {
      setAreTagsExpanded(!areTagsExpanded);
    }
  };

  const formattedDate = formatDate(data.date);
  const hasMultipleTags = data.tags && data.tags.length > 1;
  
  // Determine what to display: subtitle (plain text) or description (markdown)
  const hasSubtitle = !!data.subtitle;
  const contentText = hasSubtitle ? data.subtitle! : data.description;
  
  // Truncate content to 30 words
  const truncatedContent = truncateToWords(contentText, 30);
  const displayContent = isDescriptionExpanded ? contentText : truncatedContent;
  
  // Convert description markdown to HTML (only if showing description, not subtitle)
  const displayContentHtml = hasSubtitle ? null : markdownToHtml(displayContent);

  return (
    <article 
      className={`event-card ${isDescriptionExpanded ? 'expanded' : ''}`}
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
      <div className="event-card__glow" />
      
      {/* Category badge */}
      <span className="event-card__category">
        {data.category}
      </span>

      {/* Title */}
      <h3 className="event-card__title">
        {data.title}
      </h3>

      {/* Meta info - date and time (after title, before description) */}
      {(data.time || formattedDate) && (
        <div className="event-card__meta">
          {formattedDate && (
            <span className="event-card__date">
              <svg 
                className="event-card__date-icon"
                width="14" 
                height="14" 
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
            <span className="event-card__time">
              <svg 
                className="event-card__time-icon"
                width="14" 
                height="14" 
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
      )}

      {/* Content - Subtitle (plain text) or Description (markdown) */}
      <div 
        className="event-card__description-container"
        onClick={handleDescriptionToggle}
      >
        {hasSubtitle ? (
          <p className={`event-card__description ${isDescriptionExpanded ? 'expanded' : ''}`}>
            {displayContent}
          </p>
        ) : (
          <div 
            className={`event-card__description event-card__markdown-content ${isDescriptionExpanded ? 'expanded' : ''}`}
            dangerouslySetInnerHTML={{ __html: displayContentHtml || '' }}
          />
        )}
      </div>

      {/* Tags if available */}
      {data.tags && data.tags.length > 0 && (
        <div className="event-card__tags">
          <span 
            className={`event-card__tag ${hasMultipleTags ? 'clickable' : ''}`}
            onClick={handleTagsToggle}
            style={{ cursor: hasMultipleTags ? 'pointer' : 'default' }}
          >
            {data.tags[0]}
            {hasMultipleTags && (
              <span className="event-card__tag-count">
                {areTagsExpanded ? '−' : `+${data.tags.length - 1}`}
              </span>
            )}
          </span>
          {areTagsExpanded && data.tags.slice(1).map((tag, index) => (
            <span key={index + 1} className="event-card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer - View Event link */}
      <div className="event-card__footer">
        {/* Read more link */}
        <span className="event-card__link">
          <span className="event-card__link-text">Save your Seat</span>
          <span className="event-card__link-icon">
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

export default EventCard;
