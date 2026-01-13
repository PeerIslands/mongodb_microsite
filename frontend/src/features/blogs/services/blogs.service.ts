import apiClient from '@/api/client';
import type { BlogCardData } from '../components/BlogCard';

/**
 * Blog API response type (matches backend BlogResponse model)
 */
export interface BlogApiResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  author?: string;
  url: string;
  published_date?: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create/Update blog request type
 */
export interface BlogRequest {
  title: string;
  description: string;
  category: string;
  url: string;
  author?: string;
  published_date?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

/**
 * Transform API response to BlogCardData format
 */
export const transformToBlogCardData = (blog: BlogApiResponse): BlogCardData => ({
  id: blog.id,
  title: blog.title,
  description: blog.description,
  category: blog.category,
  author: blog.author,
  date: blog.published_date || formatDate(blog.created_at),
  published_date: blog.published_date,
  url: blog.url,
  tags: blog.tags || [],
  status: blog.status as 'draft' | 'published',
  created_at: blog.created_at,
  updated_at: blog.updated_at,
});

/**
 * Format date string to readable format
 */
const formatDate = (dateString?: string): string | undefined => {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return undefined;
  }
};

/**
 * Blogs Service - API methods for blog data
 */
export const blogsService = {
  /**
   * Get all blogs with optional filters
   */
  getAll: async (params?: { 
    category?: string; 
    status?: string;
  }): Promise<BlogCardData[]> => {
    const response = await apiClient.get<BlogApiResponse[]>('/api/v1/blogs', { params });
    return response.data.map(transformToBlogCardData);
  },

  /**
   * Get single blog by ID
   */
  getById: async (id: string): Promise<BlogCardData> => {
    const response = await apiClient.get<BlogApiResponse>(`/api/v1/blogs/${id}`);
    return transformToBlogCardData(response.data);
  },

  /**
   * Get all unique categories
   */
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/v1/blogs/categories');
    return response.data;
  },

  /**
   * Create a new blog
   */
  create: async (data: BlogRequest): Promise<{ id: string; message: string }> => {
    const response = await apiClient.post('/api/v1/blogs', data);
    return response.data;
  },

  /**
   * Update an existing blog
   */
  update: async (id: string, data: Partial<BlogRequest>): Promise<{ id: string; message: string }> => {
    const response = await apiClient.put(`/api/v1/blogs/${id}`, data);
    return response.data;
  },

  /**
   * Delete a blog
   */
  delete: async (id: string): Promise<{ id: string; message: string }> => {
    const response = await apiClient.delete(`/api/v1/blogs/${id}`);
    return response.data;
  },
};

export default blogsService;

