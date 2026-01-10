// Case Studies Components - Barrel Export
export { default as CaseStudyHero } from './CaseStudyHero';
export { default as CaseStudyArchitecture } from './CaseStudyArchitecture';
export { default as CaseStudyTestimonial } from './CaseStudyTestimonial';
export { default as CaseStudyCard } from './CaseStudyCard';
export { default as CaseStudyGrid } from './CaseStudyGrid';
export { default as CaseStudyDetailSection } from './CaseStudyDetailSection';

// Mock data (re-exported from separate file to maintain backward compatibility)
export { mockCaseStudyDetail } from '../mock-data';

// Types
export type { CaseStudyHeroData } from './CaseStudyHero';
export type { 
  CaseStudyArchitectureData, 
  ArchitectureColumn,
  SuccessStoriesHeroData,
  FeaturedStoriesData 
} from './CaseStudyArchitecture';
export type { CaseStudyTestimonialData } from './CaseStudyTestimonial';
export type { CaseStudyCardData, CaseStudyMetrics } from './CaseStudyCard';


