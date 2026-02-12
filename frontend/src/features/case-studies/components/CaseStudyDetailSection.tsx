import { useRef, useEffect } from 'react';
import type { CaseStudyDetail } from '@/types/models/case-study';
import { markdownToHtml } from '@/utils/markdown';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { analytics } from '@/utils/analytics';
import { getCaseStudyFileUrl } from '@/api/services/case-studies.service';
import { isAuthenticated } from '@/utils/sessionStorage';
import LeafLoader from '@/components/LeafLoader';
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
  const { openPDFDownloadModal } = useAuthModal();

  // Scroll to this section when it becomes visible or when the case study changes
  useEffect(() => {
    if (isVisible && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isVisible, caseStudy?.id]);

  const isLoggedIn = () => {
    return isAuthenticated();
  };

  const openPdf = () => {
    if (caseStudy?.id && caseStudy?.pdf_url) {
      // Use secure proxy endpoint to keep Azure SAS token hidden (no download flag)
      const secureUrl = getCaseStudyFileUrl(caseStudy.id, 'pdf');
      // Track the view
      analytics.trackDownload(caseStudy.title || 'Case Study', 'pdf', secureUrl);
      globalThis.open(secureUrl, '_blank');
    }
  };

  // Handle PDF open - requires login or lead capture
  const handleOpenPdf = () => {
    if (isLoggedIn()) {
      openPdf();
      
    } else if (caseStudy?.id) {
      // Open PDF lead capture modal
      openPDFDownloadModal({
        resourceType: 'case_study',
        resourceId: caseStudy.id,
        resourceTitle: caseStudy.title || 'Case Study',
        onSuccess: openPdf,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return <LeafLoader message="Loading case study details..." />;
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

          {/* View PDF Button */}
          {caseStudy.pdf_url && (
            <button
              type="button"
              className="case-study-detail__download-btn"
              onClick={handleOpenPdf}
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
                  d="M11 3H17V9M17 3L9 11M8 3H4C3.44772 3 3 3.44772 3 4V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View PDF
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

