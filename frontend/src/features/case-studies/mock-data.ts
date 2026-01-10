import type { CaseStudyDetail } from '@/types/models/case-study';

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

