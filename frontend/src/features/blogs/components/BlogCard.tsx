import { useState } from 'react';
import { analytics } from '@/utils/analytics';
import './BlogCard.css';

export interface BlogCardData {
  id: string;
  title: string;
  description: string;
  category: string; // Single category string (matches backend)
  author?: string;
  date?: string;
  published_date?: string; // Backend field name
  url: string;
  tags?: string[];
  status?: 'published' | 'draft';
  created_at?: string;
  updated_at?: string;
}

interface BlogCardProps {
  data: BlogCardData;
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
 * BlogCard - Individual blog card for the grid
 * Displays category, title, description, date, and links to blog URL
 * Styled similarly to CaseStudyCard with no image
 */
const BlogCard = ({ data }: BlogCardProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [areTagsExpanded, setAreTagsExpanded] = useState(false);

  const handleClick = () => {
    // Track CTA click
    analytics.trackCTAClick(`Read Article: ${data.title}`, 'Insights Page - Blog Card');
    window.open(data.url, '_blank', 'noopener,noreferrer');
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

  const formattedDate = formatDate(data.published_date || data.date);
  const hasMultipleTags = data.tags && data.tags.length > 1;
  
  // Truncate description to 30 words
  const truncatedDescription = truncateToWords(data.description, 30);
  const displayDescription = isDescriptionExpanded ? data.description : truncatedDescription;

  return (
    <article 
      className={`blog-card ${isDescriptionExpanded ? 'expanded' : ''}`}
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
      <div className="blog-card__glow" />
      
      {/* Category badge */}
      <span className="blog-card__category">
        {data.category}
      </span>

      {/* Title */}
      <h3 className="blog-card__title">
        {data.title}
      </h3>

      {/* Description */}
      <div 
        className="blog-card__description-container"
        onClick={handleDescriptionToggle}
      >
        <p className={`blog-card__description ${isDescriptionExpanded ? 'expanded' : ''}`}>
          {displayDescription}
        </p>
      </div>

      {/* Tags if available */}
      {data.tags && data.tags.length > 0 && (
        <div className="blog-card__tags">
          <span 
            className={`blog-card__tag ${hasMultipleTags ? 'clickable' : ''}`}
            onClick={handleTagsToggle}
            style={{ cursor: hasMultipleTags ? 'pointer' : 'default' }}
          >
            {data.tags[0]}
            {hasMultipleTags && (
              <span className="blog-card__tag-count">
                {areTagsExpanded ? '−' : `+${data.tags.length - 1}`}
              </span>
            )}
          </span>
          {areTagsExpanded && data.tags.slice(1).map((tag, index) => (
            <span key={index + 1} className="blog-card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta info - author and date */}
      {(data.author || formattedDate) && (
        <div className="blog-card__meta">
          {data.author && (
            <span className="blog-card__author">
              <svg 
                className="blog-card__author-icon"
                width="14" 
                height="14" 
                viewBox="0 0 14 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M7 7C8.933 7 10.5 5.433 10.5 3.5C10.5 1.567 8.933 0 7 0C5.067 0 3.5 1.567 3.5 3.5C3.5 5.433 5.067 7 7 7ZM7 8.75C4.663 8.75 0 9.921 0 12.25V14H14V12.25C14 9.921 9.337 8.75 7 8.75Z" 
                  fill="currentColor"
                />
              </svg>
              {data.author}
            </span>
          )}
          {formattedDate && (
            <span className="blog-card__date">
              <svg 
                className="blog-card__date-icon"
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
        </div>
      )}

      {/* Footer - Read Article link */}
      <div className="blog-card__footer">
        {/* Read more link */}
        <span className="blog-card__link">
          <span className="blog-card__link-text">Read Article</span>
          <span className="blog-card__link-icon">
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

export default BlogCard;