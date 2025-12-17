import apiClient from '../client';
import type { CaseStudy, CaseStudyDetail, CreateCaseStudyDto, UpdateCaseStudyDto } from '@/types/models/case-study';

export const caseStudiesService = {
  // Get all case studies
  getAll: async (params?: { industry?: string; status?: string; featured?: boolean }) => {
    const response = await apiClient.get<CaseStudy[]>('/api/v1/case-studies', { params });
    return response.data;
  },

  // Get single case study by slug
  getBySlug: async (slug: string) => {
    const response = await apiClient.get<CaseStudyDetail>(`/api/v1/case-studies/${slug}`);
    return response.data;
  },

  // Create case study (admin)
  create: async (data: CreateCaseStudyDto) => {
    const response = await apiClient.post<CaseStudy>('/api/v1/admin/case-studies', data);
    return response.data;
  },

  // Update case study (admin)
  update: async (id: string, data: UpdateCaseStudyDto) => {
    const response = await apiClient.put<CaseStudy>(`/api/v1/admin/case-studies/${id}`, data);
    return response.data;
  },

  // Delete case study (admin)
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/v1/admin/case-studies/${id}`);
    return response.data;
  },

  // Track view
  trackView: async (slug: string) => {
    const response = await apiClient.post(`/api/v1/case-studies/${slug}/view`);
    return response.data;
  },
};

