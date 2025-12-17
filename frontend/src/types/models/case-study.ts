export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  industry: string;
  migrationType: string;
  techStack: string[];
  status: 'published' | 'draft';
  featured: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  companyLogo: string;
  heroImage: string;
  summary: string;
}

export interface CaseStudyChallenge {
  text: string;
}

export interface CaseStudyMetric {
  label: string;
  value: string;
}

export interface CaseStudyOutcome {
  text: string;
}

export interface CaseStudyCodeSnippet {
  language: string;
  code: string;
  description?: string;
}

export interface CaseStudyDetail extends CaseStudy {
  // Client Background
  description: string;
  industryDetails?: string;

  // Problem Statement
  challenges: CaseStudyChallenge[];
  businessImpact: string;
  technicalConstraints?: string;

  // Solution & Architecture
  solutionApproach: string;
  architectureDiagram: string;
  implementationDetails: string;
  codeSnippets?: CaseStudyCodeSnippet[];

  // Value Delivered
  metrics: CaseStudyMetric[];
  businessOutcomes: CaseStudyOutcome[];
  testimonialQuote?: string;
  testimonialAuthor?: string;
  testimonialPosition?: string;

  // Media & Files
  galleryImages?: string[];
  pdfUrl?: string;
}

export interface CreateCaseStudyDto {
  title: string;
  slug: string;
  industry: string;
  migrationType: string;
  techStack: string[];
  companyName: string;
  companyLogo: string;
  description: string;
  challenges: CaseStudyChallenge[];
  businessImpact: string;
  solutionApproach: string;
  architectureDiagram: string;
  implementationDetails: string;
  metrics: CaseStudyMetric[];
  businessOutcomes: CaseStudyOutcome[];
  heroImage: string;
  pdfUrl: string;
  status?: 'published' | 'draft';
  featured?: boolean;
}

export interface UpdateCaseStudyDto extends Partial<CreateCaseStudyDto> {}

