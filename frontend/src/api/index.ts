// Barrel export for all API services
export { default as apiClient } from './client';
export { acceleratorsService } from './services/accelerators.service';
export { caseStudiesService } from './services/case-studies.service';
export { analyticsService } from './services/analytics.service';
export { uploadService } from './services/upload.service';
export { userService } from './services/user.service';
export { testimonialsService } from './services/testimonials.service';
export type { UploadResponse } from './services/upload.service';
export type { SignupResponse, LoginResponse } from './services/user.service';

