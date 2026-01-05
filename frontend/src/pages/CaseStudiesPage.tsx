import {
  CaseStudyHero,
  CaseStudyArchitecture,
  CaseStudyTestimonial,
  CaseStudyGrid,
  CaseStudyHeroData,
  CaseStudyArchitectureData,
  CaseStudyTestimonialData,
  CaseStudyCardData,
} from '@/components/case-studies';
import '@/styles/pages/CaseStudiesPage.css';

// ============================================
// MOCK DATA - Replace with API integration
// ============================================

const featuredCaseStudyData: CaseStudyHeroData = {
  category: 'Healthcare & Life Sciences',
  companyName: 'Major Healthcare Conglomerate',
  title: 'Real-Time Prescription Eligibility at Scale',
  description:
    'How a Fortune 500 Conglomerate cut data processing from 4 hours to 4 minutes by migrating from legacy DB2 to MongoDB Atlas.',
  heroImage: '/assets/case-studies/case-study-hero-image.png',
  metrics: [
    { value: '98%', label: 'Time Reduction' },
    { value: '4 Min', label: 'Ingestion Speed' },
    { value: '100%', label: 'Data Accuracy' },
  ],
};

const architectureData: CaseStudyArchitectureData = {
  sectionTitle: 'From Batch Bottlenecks to Real-Time Streams',
  subtitle:
    'Visualizing the shift from a rigid DB2 legacy environment to an event-driven MongoDB Atlas architecture.',
  legacyColumn: {
    title: 'LEGACY CONSTRAINT: DB2 BATCH',
    description:
      'Relying on legacy DB2 batch jobs created a critical data lag. Files took 4 hours to process, forcing retail pharmacies to dispense prescriptions based on outdated patient coverage.',
  },
  targetColumn: {
    title: 'TARGET ARCHITECTURE: ATLAS + KAFKA',
    description:
      'A complete re-architecture to MongoDB Atlas on GCP. By decoupling the monolith and utilizing Kafka event streaming, we enabled instant data availability for millions of patients.',
  },
};

const testimonialData: CaseStudyTestimonialData = {
  quote:
    'By modernizing a mission‑critical eligibility system, pharmacies and business units receive timely, accurate data. Customer experience improves with correct Rx pricing and coverage.',
  authorName: 'Healthcare IT Director',
  authorPosition: 'Healthcare IT Director',
  pdfUrl: '#', // Placeholder - replace with actual PDF URL
};

const caseStudiesGridData: CaseStudyCardData[] = [
  {
    id: '1',
    slug: 'revolutionizing-payments',
    category: 'Fintech',
    title: 'Revolutionizing Payments',
    highlightMetric: '12x Faster\nDevelopment',
    description:
      'Migrated complex payment workflows to an AI-native architecture, reducing release cycles from months to weeks.',
    subMetrics: ['80% Less Testing Effort', '5x Documentation Boost'],
  },
  {
    id: '2',
    slug: 'unprecedented-velocity',
    category: 'CPG / Retail',
    title: 'Unprecedented Velocity',
    highlightMetric: '94%\nPerformance Gain',
    description:
      'Modernized the creative asset platform, enabling real-time search and retrieval for global design teams.',
    subMetrics: ['6 Apps Delivered in 3 Months', '3x Faster Asset Search'],
  },
  {
    id: '3',
    slug: 'ai-native-transformation',
    category: 'Healthcare Startup',
    title: 'AI-Native Transformation',
    highlightMetric: '60% Faster\nGo-to-Market',
    description:
      'Compressed the product roadmap for a Revenue Cycle Management startup using agentic AI workflows.',
    subMetrics: ['10x Code Gen Speed', '85% Manual Work Removed'],
  },
];

/**
 * Case Studies Page - Showcases featured case study and grid of other case studies
 */
const CaseStudiesPage = () => {
  return (
    <div className="case-studies-page">
      {/* Featured Case Study Hero */}
      <CaseStudyHero data={featuredCaseStudyData} />

      {/* Architecture Comparison Section */}
      <CaseStudyArchitecture data={architectureData} />

      {/* Testimonial Section */}
      <CaseStudyTestimonial data={testimonialData} />

      {/* Case Studies Grid */}
      <CaseStudyGrid caseStudies={caseStudiesGridData} showViewAllButton={false} />
    </div>
  );
};

export default CaseStudiesPage;
