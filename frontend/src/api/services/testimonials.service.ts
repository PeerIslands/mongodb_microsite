/**
 * Testimonials Service - API service for testimonial operations.
 *
 * Operations:
 * - getAll: Get all testimonials with optional filters
 * - getById: Get a single testimonial by ID
 * - getCombined: Get combined testimonials from both testimonials and case studies
 * - create: Create a new testimonial
 * - update: Update a testimonial
 * - delete: Delete a testimonial by ID
 */

import apiClient from '../client';
import type {
  TestimonialDetail,
  CreateTestimonialDto,
  UpdateTestimonialDto,
  CreateTestimonialResponse,
  UpdateTestimonialResponse,
  DeleteTestimonialResponse,
  TestimonialQueryParams,
  CombinedTestimonial,
} from '@/types/models/testimonial';

/**
 * Build FormData for create/update operations.
 * Handles text fields for testimonials.
 */
const buildFormData = (
  data: CreateTestimonialDto | UpdateTestimonialDto,
  isCreate: boolean = false
): FormData => {
  const formData = new FormData();

  // Text fields
  if (data.company_name !== undefined) {
    formData.append('company_name', data.company_name);
  }
  if (data.testimonial_quote !== undefined) {
    formData.append('testimonial_quote', data.testimonial_quote);
  }
  if (data.testimonial_author !== undefined) {
    formData.append('testimonial_author', data.testimonial_author);
  }
  if (data.testimonial_position !== undefined) {
    formData.append('testimonial_position', data.testimonial_position);
  }
  if (data.status !== undefined) {
    formData.append('status', data.status);
  } else if (isCreate) {
    // Default status for create
    formData.append('status', 'draft');
  }

  return formData;
};

export const testimonialsService = {
  /**
   * Get all testimonials with optional filters.
   *
   * @param params - Optional query parameters (status)
   * @returns List of testimonial details
   */
  getAll: async (params?: TestimonialQueryParams): Promise<TestimonialDetail[]> => {
    const response = await apiClient.get<TestimonialDetail[]>('/api/v1/testimonials', {
      params,
    });
    return response.data;
  },

  /**
   * Get combined testimonials from both testimonials and case studies.
   *
   * @returns List of combined testimonials with source field
   */
  getCombined: async (): Promise<CombinedTestimonial[]> => {
    const response = await apiClient.get<CombinedTestimonial[]>(
      '/api/v1/testimonials/combined'
    );
    return response.data;
  },

  /**
   * Get a single testimonial by ID.
   *
   * @param id - Testimonial ID
   * @returns Testimonial details
   */
  getById: async (id: string): Promise<TestimonialDetail> => {
    const response = await apiClient.get<TestimonialDetail>(`/api/v1/testimonials/${id}`);
    return response.data;
  },

  /**
   * Create a new testimonial.
   *
   * @param data - Testimonial data
   * @returns Created testimonial response with ID
   */
  create: async (data: CreateTestimonialDto): Promise<CreateTestimonialResponse> => {
    const formData = buildFormData(data, true);

    const response = await apiClient.post<CreateTestimonialResponse>(
      '/api/v1/testimonials',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Update an existing testimonial.
   *
   * @param id - Testimonial ID
   * @param data - Fields to update (only provided fields will be updated)
   * @returns Updated testimonial response
   */
  update: async (id: string, data: UpdateTestimonialDto): Promise<UpdateTestimonialResponse> => {
    const formData = buildFormData(data, false);

    const response = await apiClient.put<UpdateTestimonialResponse>(
      `/api/v1/testimonials/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Delete a testimonial by ID.
   *
   * @param id - Testimonial ID
   * @returns Delete response with confirmation
   */
  delete: async (id: string): Promise<DeleteTestimonialResponse> => {
    const response = await apiClient.delete<DeleteTestimonialResponse>(
      `/api/v1/testimonials/${id}`
    );
    return response.data;
  },
};
