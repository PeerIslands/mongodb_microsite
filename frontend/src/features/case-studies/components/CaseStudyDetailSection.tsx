import { useRef, useEffect } from 'react';
import type { CaseStudyDetail } from '@/types/models/case-study';
import { markdownToHtml } from '@/utils/markdown';
import { useAuthModal } from '@/contexts/AuthModalContext';
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
  const { openLoginModal } = useAuthModal();

  // Scroll to this section when it becomes visible or when the case study changes
  useEffect(() => {
    if (isVisible && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isVisible, caseStudy?.id]);

  const isLoggedIn = () => {
    return !!localStorage.getItem('authToken');
  };

  const downloadPdf = () => {
    if (caseStudy?.pdf_url) {
      globalThis.open(caseStudy.pdf_url, '_blank');
    }
  };

  // Handle PDF download - requires login
  const handleDownloadPdf = () => {
    if (isLoggedIn()) {
      downloadPdf();
    } else {
      // Open login modal with callback to download after successful login
      openLoginModal(downloadPdf);
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

  // Convert markdown content to HTML
  const challengesHtml = markdownToHtml(caseStudy.challenges || '');
  const approachHtml = markdownToHtml(caseStudy.approach || '');
  const businessOutcomesHtml = markdownToHtml(caseStudy.business_outcomes || '');

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

        {/* Key Metrics - Horizontal Row at Top (shows all metrics) */}
        {caseStudy.metrics && caseStudy.metrics.length > 0 && (
          <div className="case-study-detail__metrics-row">
            <div className="case-study-detail__key-metrics">
              {caseStudy.metrics
                .filter(m => m.label && m.value)
                .map((metric, index) => (
                  <div key={index} className="case-study-detail__key-metric">
                    <span className="case-study-detail__key-metric-value">
                      {metric.value}
                    </span>
                    <span className="case-study-detail__key-metric-label">{metric.label}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Content Sections - Full Width */}
        <div className="case-study-detail__content">
          {/* Challenge Section */}
          {challengesHtml && (
            <div className="case-study-detail__section">
              <h3 className="case-study-detail__section-title">Challenge</h3>
              <div 
                className="case-study-detail__section-text case-study-detail__markdown-content"
                dangerouslySetInnerHTML={{ __html: challengesHtml }}
              />
            </div>
          )}

          {/* Solution Section */}
          {approachHtml && (
            <div className="case-study-detail__section">
              <h3 className="case-study-detail__section-title">Solution</h3>
              <div 
                className="case-study-detail__section-text case-study-detail__markdown-content"
                dangerouslySetInnerHTML={{ __html: approachHtml }}
              />
            </div>
          )}

          {/* Business Impact Section */}
          {businessOutcomesHtml && (
            <div className="case-study-detail__section">
              <h3 className="case-study-detail__section-title">Business Impact</h3>
              <div 
                className="case-study-detail__section-text case-study-detail__markdown-content"
                dangerouslySetInnerHTML={{ __html: businessOutcomesHtml }}
              />
            </div>
          )}

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
                <div className="case-study-detail__testimonial-attribution">
                  <cite className="case-study-detail__testimonial-author">
                    {caseStudy.testimonial_author}
                  </cite>
                  {caseStudy.testimonial_position && (
                    <span className="case-study-detail__testimonial-position">
                      {caseStudy.testimonial_position}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default CaseStudyDetailSection;

