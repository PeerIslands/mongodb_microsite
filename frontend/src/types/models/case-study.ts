// Metrics structure with fixed fields (snake_case to match API)
export interface CaseStudyMetrics {
  time_reduction?: string | null;
  ingestion_speed?: string | null;
  data_accuracy?: string | null;
}

// Base Case Study (for list view) - snake_case to match API response
// Note: API returns CaseStudyDetailResponse which includes metrics
export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  industry: string;
  migration_type?: string;
  tech_stack: string[];
  status: 'published' | 'draft';
  featured: boolean;
  created_at: string;
  updated_at: string;
  company_name: string;
  company_logo: string;
  hero_image: string;
  description: string;
  // Metrics included since API returns CaseStudyDetailResponse
  metrics?: CaseStudyMetrics;
}

// Full Case Study Detail (for single view) - snake_case to match API response
export interface CaseStudyDetail extends CaseStudy {
  // Client Background
  industry_details?: string;

  // Problem Statement
  challenges: string;
  technical_constraints?: string;

  // Solution & Architecture
  approach: string;
  architecture_diagram?: string;
  implementation_details: string;

  // Value Delivered
  metrics: CaseStudyMetrics;
  business_outcomes: string;
  testimonial_quote?: string;
  testimonial_author?: string;
  testimonial_position?: string;

  // Media & Files
  pdf_url: string;
}

// DTO for creating a case study - snake_case to match API
export interface CreateCaseStudyDto {
  // Basic Info
  title: string;
  slug: string;
  industry: string;
  migration_type?: string;
  tech_stack: string[];
  status?: 'published' | 'draft';
  featured?: boolean;

  // Client Background
  company_name: string;
  company_logo: string;
  description: string;
  industry_details?: string;

  // Problem Statement
  challenges: string;
  technical_constraints?: string;

  // Solution & Architecture
  approach: string;
  architecture_diagram?: string;
  implementation_details: string;

  // Value Delivered
  metrics: CaseStudyMetrics;
  business_outcomes: string;
  testimonial_quote?: string;
  testimonial_author?: string;
  testimonial_position?: string;

  // Media & Files
  hero_image: string;
  pdf_url: string;
}

// DTO for updating a case study
export interface UpdateCaseStudyDto extends Partial<CreateCaseStudyDto> {}

