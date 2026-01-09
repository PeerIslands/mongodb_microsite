import { useRef, useEffect } from 'react';
import type { CaseStudyDetail } from '@/types/models/case-study';
import '@/styles/features/case-studies/CaseStudyDetailSection.css';

interface CaseStudyDetailSectionProps {
  caseStudy: CaseStudyDetail | null;
  isVisible: boolean;
  isLoading?: boolean;
}

/**
 * CaseStudyDetailSection - Displays detailed case study information
 * This section is revealed when a user clicks on a case study card in the carousel
 */
const CaseStudyDetailSection = ({ caseStudy, isVisible, isLoading = false }: CaseStudyDetailSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section when it becomes visible
  useEffect(() => {
    if (isVisible && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isVisible]);

  // Handle PDF download
  const handleDownloadPdf = () => {
    if (caseStudy?.pdf_url) {
      window.open(caseStudy.pdf_url, '_blank');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="case-study-detail case-study-detail--visible">
        <div className="case-study-detail__loading">
          <div className="case-study-detail__loading-spinner" />
          <p>Loading case study details...</p>
        </div>
      </section>
    );
  }

  if (!caseStudy) {
    return null;
  }

  // Parse business outcomes (stored as pipe-separated string)
  const businessOutcomes = caseStudy.business_outcomes
    ? caseStudy.business_outcomes.split('|').filter(Boolean)
    : [];

  return (
    <section
      ref={sectionRef}
      className={`case-study-detail ${isVisible ? 'case-study-detail--visible' : ''}`}
    >
      <div className="case-study-detail__container">
        {/* Header Section */}
        <header className="case-study-detail__header">
          <div className="case-study-detail__header-left">
            {/* Category Badge */}
            <span className="case-study-detail__category">{caseStudy.industry}</span>

            {/* Title */}
            <h2 className="case-study-detail__title">{caseStudy.title}</h2>

            {/* Company Name */}
            <p className="case-study-detail__company">{caseStudy.company_name}</p>
          </div>

          {/* Download PDF Button */}
          {caseStudy.pdf_url && (
            <button
              type="button"
              className="case-study-detail__download-btn"
              onClick={handleDownloadPdf}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M10 3V13M10 13L6 9M10 13L14 9M3 17H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download PDF
            </button>
          )}
        </header>

        {/* Key Metrics - Horizontal Row at Top */}
        <div className="case-study-detail__metrics-row">
          {/* <h3 className="case-study-detail__section-title">Key Metrics</h3> */}
          <div className="case-study-detail__key-metrics">
            {caseStudy.metrics?.time_reduction && (
              <div className="case-study-detail__key-metric">
                <span className="case-study-detail__key-metric-value">
                  {caseStudy.metrics.time_reduction}
                </span>
                <span className="case-study-detail__key-metric-label">Time Reduction</span>
              </div>
            )}

            {caseStudy.metrics?.ingestion_speed && (
              <div className="case-study-detail__key-metric">
                <span className="case-study-detail__key-metric-value">
                  {caseStudy.metrics.ingestion_speed}
                </span>
                <span className="case-study-detail__key-metric-label">Ingestion Speed</span>
              </div>
            )}

            {caseStudy.metrics?.data_accuracy && (
              <div className="case-study-detail__key-metric">
                <span className="case-study-detail__key-metric-value">
                  {caseStudy.metrics.data_accuracy}
                </span>
                <span className="case-study-detail__key-metric-label">Data Accuracy</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Sections - Full Width */}
        <div className="case-study-detail__content">
          {/* Challenge Section */}
          <div className="case-study-detail__section">
            <h3 className="case-study-detail__section-title">Challenge</h3>
            <p className="case-study-detail__section-text">{caseStudy.challenges}</p>
          </div>

          {/* Solution Section */}
          <div className="case-study-detail__section">
            <h3 className="case-study-detail__section-title">Solution</h3>
            <p className="case-study-detail__section-text">{caseStudy.approach}</p>
          </div>

          {/* Business Impact Section */}
          <div className="case-study-detail__section">
            <h3 className="case-study-detail__section-title">Business Impact</h3>
            <ul className="case-study-detail__impact-list">
              {businessOutcomes.map((outcome, index) => (
                <li key={index} className="case-study-detail__impact-item">
                  <span className="case-study-detail__impact-dot" />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial */}
          {caseStudy.testimonial_quote && (
            <div className="case-study-detail__testimonial">
              <div className="case-study-detail__testimonial-badge">
                {caseStudy.testimonial_author?.substring(0, 3).toUpperCase() || 'HID'}
              </div>
              <div className="case-study-detail__testimonial-content">
                <blockquote className="case-study-detail__testimonial-quote">
                  "{caseStudy.testimonial_quote}"
                </blockquote>
                <cite className="case-study-detail__testimonial-author">
                  {caseStudy.testimonial_author}
                </cite>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default CaseStudyDetailSection;

