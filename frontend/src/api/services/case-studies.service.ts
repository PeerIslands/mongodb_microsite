import apiClient from '../client';
import type { CaseStudyDetail } from '@/types/models/case-study';

// Get the API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Build the secure file proxy URL for case study files.
 * 
 * This routes file requests through the backend proxy endpoint,
 * keeping Azure SAS tokens hidden from the client.
 * 
 * @param caseId - The case study ID
 * @param fileType - The type of file ('pdf', 'video', 'thumbnail')
 * @param forDownload - If true, adds ?download=true query parameter
 * @returns Full URL for accessing the file through the secure proxy
 */
export const getCaseStudyFileUrl = (
  caseId: string,
  fileType: 'pdf' | 'video' | 'thumbnail',
  forDownload: boolean = false
): string => {
  if (!caseId) return '';

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const proxyPath = `/api/v1/case-studies/${caseId}/files/${fileType}`;
  const fullUrl = `${baseUrl}${proxyPath}`;

  return forDownload ? `${fullUrl}?download=true` : fullUrl;
};

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

  // Generate AI-powered PDF for case study (Gamma AI)
  generatePDF: async (caseStudyData: any) => {
    const response = await apiClient.post('/api/v1/case-studies/generate-pdf', caseStudyData, {
      timeout: 120000, // 2 minutes for Gamma generation and polling
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data; // Returns JSON with presentation_url and pdf_url
  },
};

