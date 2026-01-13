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
 * BlogCard - Individual blog card for the grid
 * Displays category, title, description, date, and links to blog URL
 * Styled similarly to CaseStudyCard with no image
 */
const BlogCard = ({ data }: BlogCardProps) => {
  const handleClick = () => {
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = formatDate(data.published_date || data.date);

  return (
    <article 
      className="blog-card" 
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

      {/* Meta info - author and date */}
      {(data.author || formattedDate) && (
        <div className="blog-card__meta">
          {data.author && (
            <span className="blog-card__author">{data.author}</span>
          )}
          {data.author && formattedDate && (
            <span className="blog-card__meta-separator">•</span>
          )}
          {formattedDate && (
            <span className="blog-card__date">{formattedDate}</span>
          )}
        </div>
      )}

      {/* Tags if available */}
      {data.tags && data.tags.length > 0 && (
        <div className="blog-card__tags">
          {data.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="blog-card__tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="blog-card__description">
        {data.description}
      </p>

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
              stroke="#5B6CFF" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </article>
  );
};

export default BlogCard;

