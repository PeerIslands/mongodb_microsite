import { useRef, useEffect } from 'react';
import type { CaseStudyDetail } from '@/types/models/case-study';
import '@/styles/features/case-studies/CaseStudyDetailSection.css';

interface CaseStudyDetailSectionProps {
  caseStudy: CaseStudyDetail | null;
  isVisible: boolean;
}

// Mock data for development - will be replaced by API response
export const mockCaseStudyDetail: CaseStudyDetail = {
  id: '1',
  slug: 'healthcare-eligibility-platform',
  title: "Modernizing a Healthcare Conglomerate's Insurance & Prescription Eligibility Platform",
  industry: 'Healthcare',
  tech_stack: ['MongoDB Atlas', 'Google Cloud Platform', 'Kafka', 'Node.js'],
  status: 'published',
  featured: true,
  created_at: '2024-07-15',
  updated_at: '2024-07-15',
  company_name: 'Major Healthcare Conglomerate',
  company_logo: '',
  hero_image: '',
  description: 'A major healthcare conglomerate relied on a legacy DB2-powered system for insurance eligibility and prescription claims.',
  
  // Client Background
  industry_details: 'Fortune 500 Healthcare Company',
  
  // Problem Statement
  challenges: 'A major healthcare conglomerate relied on a legacy DB2-powered system for insurance eligibility and prescription claims. This process involved loading files into DB2 for cleansing and enrichment — taking ~4 hours per batch. Sharing data across businesses (like retail pharmacies) with significant delays. Resulting in outdated eligibility data, inaccurate Rx pricing, and manual overrides. Ultimately discouraging adoption by pharmacies and patients.',
  technical_constraints: 'Legacy DB2 system with batch processing limitations',
  
  // Solution & Architecture
  approach: 'PeerIslands engaged in a 12-month modernization program, partnering with MongoDB Professional Services to: Re-architect the data backend: migrate from DB2 to MongoDB as the new source-of-truth. Build real-time APIs to handle transactional updates directly to the eligibility store. Deploy on Google Cloud Platform, with file validation, threshold/override handling. Stream operational events (e.g., errors, statuses) into Kafka for observability. Streamline onboarding and platform modernization across pharmacy channels.',
  architecture_diagram: '',
  implementation_details: 'Migrated from DB2 to MongoDB Atlas with real-time API integration',
  
  // Value Delivered
  metrics: {
    time_reduction: '98%',
    ingestion_speed: '< 4 minutes for 1M records',
    data_accuracy: '100%',
  },
  business_outcomes: 'Eliminated data duplication and dependence on legacy DB2 systems|Real-time access: now processes 1 million records in under 4 minutes|Modern tech stack: MongoDB and GCP underpin a scalable, future-ready platform',
  testimonial_quote: 'By modernizing a mission-critical eligibility system, pharmacies and business units receive timely, accurate data. Customer experience improves with correct Rx pricing and coverage. IT operations benefit from reduced manual work and higher system reliability.',
  testimonial_author: 'Healthcare IT Director',
  testimonial_position: 'Healthcare IT Director',
  
  // Media & Files
  pdf_url: '#',
};

// Key metrics data for the comparison table
interface KeyMetric {
  label: string;
  before: string;
  after: string;
}

const keyMetrics: KeyMetric[] = [
  {
    label: 'Data Loading Time',
    before: '~4 hours',
    after: '< 4 minutes for 1M records',
  },
  {
    label: 'Rx Pricing Accuracy',
    before: 'Inconsistent',
    after: 'Accurate & real-time coverage',
  },
  {
    label: 'Data Fixes',
    before: 'Manual',
    after: 'Automated, error-resilient pipelines',
  },
  {
    label: 'Pharmacy Adoption',
    before: 'Low adoption',
    after: 'Increased usage and trust',
  },
];

/**
 * CaseStudyDetailSection - Displays detailed case study information
 * This section is revealed when a user clicks on a case study card in the carousel
 */
const CaseStudyDetailSection = ({ caseStudy, isVisible }: CaseStudyDetailSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section when it becomes visible
  useEffect(() => {
    if (isVisible && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isVisible]);

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

          {/* Top Metrics */}
          <div className="case-study-detail__header-metrics">
            <div className="case-study-detail__metric-item">
              <span className="case-study-detail__metric-value case-study-detail__metric-value--primary">
                {caseStudy.metrics.time_reduction}
              </span>
              <span className="case-study-detail__metric-label">Time Reduction</span>
            </div>
            <div className="case-study-detail__metric-item">
              <span className="case-study-detail__metric-value case-study-detail__metric-value--secondary">
                Significant
              </span>
              <span className="case-study-detail__metric-label">Cost Savings</span>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="case-study-detail__content">
          {/* Left Column - Challenge, Solution, Business Impact */}
          <div className="case-study-detail__left-column">
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
                {businessOutcomes.map((outcome: string, index: number) => (
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

          {/* Right Column - Key Metrics */}
          <div className="case-study-detail__right-column">
            <h3 className="case-study-detail__section-title">Key Metrics</h3>

            {/* Metrics Table */}
            <div className="case-study-detail__metrics-table">
              {keyMetrics.map((metric, index) => (
                <div key={index} className="case-study-detail__metrics-row">
                  <span className="case-study-detail__metrics-label">{metric.label}</span>
                  <div className="case-study-detail__metrics-values">
                    <span className="case-study-detail__metrics-before">{metric.before}</span>
                    <span className="case-study-detail__metrics-after">{metric.after}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Performance Metrics */}
            <div className="case-study-detail__performance-metrics">
              <div className="case-study-detail__performance-card">
                <span className="case-study-detail__performance-value">Real-time</span>
                <span className="case-study-detail__performance-label">Performance Gain</span>
              </div>
              <div className="case-study-detail__performance-card">
                <span className="case-study-detail__performance-value">Automated</span>
                <span className="case-study-detail__performance-label">Team Productivity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseStudyDetailSection;

