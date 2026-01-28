import apiClient from '../client';
import type { CaseStudyDetail } from '@/types/models/case-study';

// Response type for create/update operations
export interface CaseStudyResponse {
  id: string;
  slug: string;
  message: string;
}

// Testimonial data from case studies
export interface TestimonialData {
  id: string;
  company_name: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_position: string;
}

export const caseStudiesService = {
  // Get all case studies (returns full detail including metrics)
  getAll: async (params?: { industry?: string; status?: string; featured?: boolean }) => {
    const response = await apiClient.get<CaseStudyDetail[]>('/api/v1/case-studies', { params });
    return response.data;
  },

  // Get single case study by ID
  getById: async (id: string) => {
    const response = await apiClient.get<CaseStudyDetail>(`/api/v1/case-studies/${id}`);
    return response.data;
  },

  // Create case study - accepts FormData directly
  create: async (formData: FormData) => {
    const response = await apiClient.post<CaseStudyResponse>('/api/v1/case-studies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update case study by ID - accepts FormData directly
  update: async (id: string, formData: FormData) => {
    const response = await apiClient.put<CaseStudyResponse>(`/api/v1/case-studies/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete case study by ID
  delete: async (id: string) => {
    const response = await apiClient.delete<{ id: string; message: string }>(`/api/v1/case-studies/${id}`);
    return response.data;
  },

  // Get all testimonials from published case studies
  getTestimonials: async () => {
    const response = await apiClient.get<TestimonialData[]>('/api/v1/case-studies/testimonials');
    return response.data;
  },
};

