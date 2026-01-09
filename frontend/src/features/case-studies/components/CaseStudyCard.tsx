import { Link } from 'react-router-dom';
import '@/styles/features/case-studies/CaseStudyCard.css';

export interface CaseStudyCardData {
  id: string;
  slug: string;
  category: string;
  title: string;
  highlightMetric: string;
  description: string;
  subMetrics: string[];
}

interface CaseStudyCardProps {
  data: CaseStudyCardData;
}

/**
 * CaseStudyCard - Individual case study card for the grid
 * Displays category, title, metrics, description, and read more link
 */
const CaseStudyCard = ({ data }: CaseStudyCardProps) => {
  return (
    <article className="case-study-card">
      {/* Decorative glow */}
      <div className="case-study-card__glow" />
      
      {/* Category badge */}
      <span className="case-study-card__category">
        {data.category}
      </span>

      {/* Title */}
      <h3 className="case-study-card__title">
        {data.title}
      </h3>

      {/* Highlight metric */}
      <div className="case-study-card__highlight-metric">
        {data.highlightMetric.split('\n').map((line, index) => (
          <span key={index}>
            {line}
            {index < data.highlightMetric.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>

      {/* Sub metrics */}
      <div className="case-study-card__sub-metrics">
        {data.subMetrics.map((metric, index) => (
          <span key={index} className="case-study-card__sub-metric">
            {metric}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="case-study-card__description">
        {data.description}
      </p>

      {/* Read more link - placeholder for now */}
      <Link 
        to={`/case-studies/${data.slug}`} 
        className="case-study-card__link"
        aria-label={`Read success story: ${data.title}`}
      >
        <span className="case-study-card__link-text">Read Success Story</span>
        <span className="case-study-card__link-icon">
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
      </Link>
    </article>
  );
};

export default CaseStudyCard;

