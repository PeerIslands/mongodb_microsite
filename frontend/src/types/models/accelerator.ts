export interface Accelerator {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  category: string;
  sourceTech: string;
  targetTech: string;
  cardImage: string;
  logo: string;
  heroImage?: string;
  videoThumbnail: string;
  videoUrl?: string;
  status: 'active' | 'coming_soon' | 'draft';
  featured: boolean;
  downloads: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcceleratorMetric {
  value: string;
  description: string;
}

export interface AcceleratorFeature {
  icon: string;
  title: string;
  description: string;
}

export interface AcceleratorDetail extends Accelerator {
  metrics: AcceleratorMetric[];
  features: AcceleratorFeature[];
  downloadTitle: string;
  downloadSubtitle: string;
  downloadFile: string;
  downloadUrl: string;
  benefits?: string[];
  technicalSpecs?: Record<string, unknown>;
}

export interface CreateAcceleratorDto {
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  category: string;
  sourceTech: string;
  targetTech: string;
  cardImage: string;
  logo: string;
  videoThumbnail: string;
  status?: 'active' | 'coming_soon' | 'draft';
  featured?: boolean;
  metrics?: AcceleratorMetric[];
  features?: AcceleratorFeature[];
}

export interface UpdateAcceleratorDto extends Partial<CreateAcceleratorDto> {}

