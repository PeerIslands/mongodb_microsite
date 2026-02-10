/**
 * Accelerators Service - API service for accelerator operations.
 *
 * Operations:
 * - getAll: Get all accelerators with optional filters
 * - getById: Get a single accelerator by ID
 * - create: Create a new accelerator with file uploads
 * - update: Update an accelerator with optional file uploads
 * - delete: Delete an accelerator by ID
 * - getFileUrl: Build full URL for secure file proxy endpoints
 */

import apiClient from '../client';

// Get the API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Build full URL for secure file proxy endpoints.
 *
 * The backend returns relative proxy paths like /api/v1/accelerators/{id}/files/pdf
 * This function prepends the API base URL to create a full accessible URL.
 *
 * @param proxyPath - Relative proxy path from the API
 * @param forDownload - If true, adds ?download=true query parameter
 * @returns Full URL for accessing the file
 */
export const getFileUrl = (proxyPath: string, forDownload: boolean = false): string => {
  if (!proxyPath) return '';

  // If it's already a full URL (starts with http), return as-is
  if (proxyPath.startsWith('http://') || proxyPath.startsWith('https://')) {
    return forDownload ? `${proxyPath}${proxyPath.includes('?') ? '&' : '?'}download=true` : proxyPath;
  }

  // Build full URL from API base and proxy path
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = proxyPath.startsWith('/') ? proxyPath : `/${proxyPath}`;
  const fullUrl = `${baseUrl}${path}`;

  return forDownload ? `${fullUrl}?download=true` : fullUrl;
};
import type {
  AcceleratorDetail,
  CreateAcceleratorDto,
  UpdateAcceleratorDto,
  CreateAcceleratorResponse,
  UpdateAcceleratorResponse,
  DeleteAcceleratorResponse,
  AcceleratorQueryParams,
} from '@/types/models/accelerator';

/**
 * Build FormData for create/update operations.
 * Handles text fields, JSON metrics array, and file uploads.
 */
const buildFormData = (
  data: CreateAcceleratorDto | UpdateAcceleratorDto,
  isCreate: boolean = false
): FormData => {
  const formData = new FormData();

  // Text fields
  if (data.title !== undefined) {
    formData.append('title', data.title);
  }
  if (data.subtitle !== undefined) {
    formData.append('subtitle', data.subtitle);
  }
  if (data.description !== undefined) {
    formData.append('description', data.description);
  }
  if (data.status !== undefined) {
    formData.append('status', data.status);
  }
  if (data.feature_on_homepage !== undefined) {
    formData.append('feature_on_homepage', String(data.feature_on_homepage));
  }

  // Metrics as JSON string
  if (data.metrics !== undefined) {
    formData.append('metrics', JSON.stringify(data.metrics));
  } else if (isCreate) {
    // For create, metrics is required - provide empty array if not set
    formData.append('metrics', '[]');
  }

  // File uploads
  if (data.thumbnail_file) {
    formData.append('thumbnail_file', data.thumbnail_file);
  }
  if (data.video_file) {
    formData.append('video_file', data.video_file);
  }
  if (data.pdf_file) {
    formData.append('pdf_file', data.pdf_file);
  }

  // File deletion flags (only for updates)
  if (!isCreate) {
    if ((data as UpdateAcceleratorDto).delete_thumbnail) {
      formData.append('delete_thumbnail', 'true');
    }
    if ((data as UpdateAcceleratorDto).delete_video) {
      formData.append('delete_video', 'true');
    }
    if ((data as UpdateAcceleratorDto).delete_pdf) {
      formData.append('delete_pdf', 'true');
    }
  }

  return formData;
};

export const acceleratorsService = {
  /**
   * Get all accelerators with optional filters.
   *
   * @param params - Optional query parameters (status, feature_on_homepage)
   * @returns List of accelerator details
   */
  getAll: async (params?: AcceleratorQueryParams): Promise<AcceleratorDetail[]> => {
    const response = await apiClient.get<AcceleratorDetail[]>('/api/v1/accelerators', {
      params,
    });
    return response.data;
  },

  /**
   * Get a single accelerator by ID.
   *
   * @param id - Accelerator ID
   * @returns Accelerator details
   */
  getById: async (id: string): Promise<AcceleratorDetail> => {
    const response = await apiClient.get<AcceleratorDetail>(`/api/v1/accelerators/${id}`);
    return response.data;
  },

  /**
   * Create a new accelerator with file uploads.
   *
   * @param data - Accelerator data including optional files
   * @returns Created accelerator response with ID
   */
  create: async (data: CreateAcceleratorDto): Promise<CreateAcceleratorResponse> => {
    const formData = buildFormData(data, true);

    const response = await apiClient.post<CreateAcceleratorResponse>(
      '/api/v1/accelerators',
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
   * Update an existing accelerator with optional file uploads.
   *
   * @param id - Accelerator ID
   * @param data - Fields to update (only provided fields will be updated)
   * @returns Updated accelerator response
   */
  update: async (id: string, data: UpdateAcceleratorDto): Promise<UpdateAcceleratorResponse> => {
    const formData = buildFormData(data, false);

    const response = await apiClient.put<UpdateAcceleratorResponse>(
      `/api/v1/accelerators/${id}`,
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
   * Delete an accelerator by ID.
   *
   * @param id - Accelerator ID
   * @returns Delete response with confirmation
   */
  delete: async (id: string): Promise<DeleteAcceleratorResponse> => {
    const response = await apiClient.delete<DeleteAcceleratorResponse>(
      `/api/v1/accelerators/${id}`
    );
    return response.data;
  },
};
