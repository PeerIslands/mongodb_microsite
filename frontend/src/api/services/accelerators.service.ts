import apiClient from '../client';
import type { Accelerator, AcceleratorDetail, CreateAcceleratorDto, UpdateAcceleratorDto } from '@/types/models/accelerator';

export const acceleratorsService = {
  // Get all accelerators
  getAll: async (params?: { category?: string; status?: string }) => {
    const response = await apiClient.get<Accelerator[]>('/api/v1/accelerators', { params });
    return response.data;
  },

  // Get single accelerator by slug
  getBySlug: async (slug: string) => {
    const response = await apiClient.get<AcceleratorDetail>(`/api/v1/accelerators/${slug}`);
    return response.data;
  },

  // Create accelerator (admin)
  create: async (data: CreateAcceleratorDto) => {
    const response = await apiClient.post<Accelerator>('/api/v1/admin/accelerators', data);
    return response.data;
  },

  // Update accelerator (admin)
  update: async (id: string, data: UpdateAcceleratorDto) => {
    const response = await apiClient.put<Accelerator>(`/api/v1/admin/accelerators/${id}`, data);
    return response.data;
  },

  // Delete accelerator (admin)
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/v1/admin/accelerators/${id}`);
    return response.data;
  },

  // Track view
  trackView: async (slug: string) => {
    const response = await apiClient.post(`/api/v1/accelerators/${slug}/view`);
    return response.data;
  },

  // Track download
  trackDownload: async (slug: string) => {
    const response = await apiClient.post(`/api/v1/accelerators/${slug}/download`);
    return response.data;
  },
};

