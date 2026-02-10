// Application constants

export const APP_NAME = 'MongoDB Microsite';
export const APP_DESCRIPTION = 'PeerAI & MongoDB Partnership Platform';

// Routes
export const ROUTES = {
  HOME: '/',
  ACCELERATORS: '/accelerators',
  CASE_STUDIES: '/case-studies',
  SUCCESS_STORIES: '/success-stories',
  INSIGHTS: '/insights',
  OFFERINGS: '/offerings',
  NEWSLETTER: '/newsletter',
  ADMIN: '/admin',
  EVENTS: '/events',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  ACCELERATORS: '/api/v1/accelerators',
  CASE_STUDIES: '/api/v1/case-studies',
  ANALYTICS: '/api/v1/admin/analytics',
  UPLOAD: '/api/v1/admin/upload',
} as const;

// Accelerator Categories
export const ACCELERATOR_CATEGORIES = [
  'Migration',
  'Modernization',
  'Integration',
  'Performance',
] as const;

// Accelerator Status
export const ACCELERATOR_STATUS = {
  ACTIVE: 'active',
  COMING_SOON: 'coming_soon',
  DRAFT: 'draft',
} as const;

// Case Study Industries
export const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Retail',
  'Technology',
  'Manufacturing',
  'Telecommunications',
  'Energy',
  'Government',
  'Education',
  'Other',
] as const;

// Migration Types
export const MIGRATION_TYPES = [
  'HBase to MongoDB',
  'Cassandra to MongoDB',
  'Cosmos DB to MongoDB',
  'Oracle to MongoDB',
  'SQL Server to MongoDB',
  'MySQL to MongoDB',
  'PostgreSQL to MongoDB',
  'Other',
] as const;

// Tech Stack Options
export const TECH_STACK = [
  'MongoDB',
  'MongoDB Atlas',
  'Node.js',
  'Python',
  'Java',
  'React',
  'Angular',
  'Vue.js',
  'Kubernetes',
  'Docker',
  'AWS',
  'Azure',
  'GCP',
  'HBase',
  'Cassandra',
  'Cosmos DB',
] as const;

// File Upload Constraints
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB (increased to support large email template images)
  MAX_PDF_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Animation Durations (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

