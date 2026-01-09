import '@/styles/features/case-studies/CaseStudyCard.css';

// Metrics structure matching backend
export interface CaseStudyMetrics {
  time_reduction?: string | null;
  ingestion_speed?: string | null;
  data_accuracy?: string | null;
}

export interface CaseStudyCardData {
  id: string;
  slug: string;
  industry: string; // Maps to category display
  title: string;
  description: string;
  metrics: CaseStudyMetrics;
}

interface CaseStudyCardProps {
  data: CaseStudyCardData;
}

/**
 * CaseStudyCard - Individual case study card for the grid
 * Displays industry, title, metrics, description, and read more link
 */
const CaseStudyCard = ({ data }: CaseStudyCardProps) => {
  // Get metrics that have values
  const metricsEntries = [
    { label: 'Time Reduction', value: data.metrics?.time_reduction },
    { label: 'Ingestion Speed', value: data.metrics?.ingestion_speed },
    { label: 'Data Accuracy', value: data.metrics?.data_accuracy },
  ].filter(m => m.value);

  return (
    <article className="case-study-card">
      {/* Decorative glow */}
      <div className="case-study-card__glow" />
      
      {/* Industry badge */}
      <span className="case-study-card__category">
        {data.industry}
      </span>

      {/* Title */}
      <h3 className="case-study-card__title">
        {data.title}
      </h3>

      {/* Metrics display - all three metrics */}
      <div className="case-study-card__metrics">
        {metricsEntries.map((metric, index) => (
          <div key={index} className="case-study-card__metric">
            <span className="case-study-card__metric-value">{metric.value}</span>
            <span className="case-study-card__metric-label">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="case-study-card__description">
        {data.description}
      </p>

      {/* Read more - clicks bubble up to parent button */}
      <span className="case-study-card__link">
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
      </span>
    </article>
  );
};

export default CaseStudyCard;

