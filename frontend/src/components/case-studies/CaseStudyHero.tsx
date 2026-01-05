import '@/styles/components/case-studies/CaseStudyHero.css';

export interface CaseStudyHeroData {
  category: string;
  companyName: string;
  title: string;
  description: string;
  heroImage: string;
  metrics: {
    value: string;
    label: string;
  }[];
}

interface CaseStudyHeroProps {
  data: CaseStudyHeroData;
}

/**
 * CaseStudyHero - Featured case study section at the top of the page
 * Displays category badge, title, company name, description, and key metrics
 */
const CaseStudyHero = ({ data }: CaseStudyHeroProps) => {
  return (
    <section className="case-study-hero">
      {/* Background layers */}
      <div className="case-study-hero__bg-layer case-study-hero__bg-layer--1" />
      <div className="case-study-hero__bg-layer case-study-hero__bg-layer--2" />
      
      {/* Hero image */}
      <div className="case-study-hero__image-container">
        <img 
          src={data.heroImage} 
          alt={data.title}
          className="case-study-hero__image"
        />
      </div>
      <div className="hero-gradient-fade"></div>
      
      {/* Content */}
      <div className="case-study-hero__content">
        {/* Category badge */}
        <span className="case-study-hero__category">
          {data.category}
        </span>
        
        {/* Title - comes before company name */}
        <h1 className="case-study-hero__title">
          {data.title}
        </h1>
        
        {/* Company name - comes after title */}
        <p className="case-study-hero__company">
          {data.companyName}
        </p>
        
        {/* Description */}
        <p className="case-study-hero__description">
          {data.description}
        </p>
      </div>

      {/* Metrics - positioned at bottom of viewport */}
      <div className="case-study-hero__metrics">
        {data.metrics.map((metric, index) => (
          <div key={index} className="case-study-hero__metric">
            <span className="case-study-hero__metric-value">
              {metric.value}
            </span>
            <span className="case-study-hero__metric-label">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CaseStudyHero;

