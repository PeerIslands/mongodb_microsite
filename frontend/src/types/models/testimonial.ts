/**
 * Testimonial Types - TypeScript types matching backend models.
 *
 * Models:
 * - Testimonial: Basic testimonial response
 * - TestimonialDetail: Full testimonial details
 * - CreateTestimonialDto: Data for creating testimonials
 * - UpdateTestimonialDto: Data for updating testimonials
 * - CreateTestimonialResponse: Response after creating
 * - UpdateTestimonialResponse: Response after updating
 * - DeleteTestimonialResponse: Response after deleting
 */

/** Testimonial status */
export type TestimonialStatus = 'draft' | 'published';

/** Basic testimonial response */
export interface Testimonial {
  id: string;
  company_name: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_position: string;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
}

/** Full testimonial details (same as Testimonial for now) */
export interface TestimonialDetail extends Testimonial {}

/** Data for creating a new testimonial */
export interface CreateTestimonialDto {
  company_name: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_position: string;
  status?: TestimonialStatus;
}

/** Data for updating a testimonial (all fields optional) */
export interface UpdateTestimonialDto {
  company_name?: string;
  testimonial_quote?: string;
  testimonial_author?: string;
  testimonial_position?: string;
  status?: TestimonialStatus;
}

/** Response after creating a testimonial */
export interface CreateTestimonialResponse {
  id: string;
  message: string;
}

/** Response after updating a testimonial */
export interface UpdateTestimonialResponse {
  id: string;
  message: string;
}

/** Response after deleting a testimonial */
export interface DeleteTestimonialResponse {
  id: string;
  message: string;
}

/** Query parameters for fetching testimonials */
export interface TestimonialQueryParams {
  status?: TestimonialStatus;
}

/** Combined testimonial (from testimonials or case studies) */
export interface CombinedTestimonial {
  id: string;
  company_name: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_position: string;
  source: 'testimonials' | 'case_studies';
}
