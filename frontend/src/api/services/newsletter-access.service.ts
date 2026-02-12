/**
 * Newsletter Access Service
 * API calls for newsletter access control
 */

import apiClient from '../client';
import {
  NewsletterAccessRequest,
  NewsletterAccessRequestCreate,
  NewsletterAccessAction,
  NewsletterAccessCheckResponse,
  PendingRequestsCountResponse,
  NewsletterAccessActionResponse,
} from '@/types/newsletter-access';

export const newsletterAccessService = {
  /**
   * Request access to newsletters (Public endpoint)
   */
  requestAccess: async (data: NewsletterAccessRequestCreate): Promise<NewsletterAccessRequest> => {
    try {
      const response = await apiClient.post<NewsletterAccessRequest>(
        '/api/v1/newsletter-access/request',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to request newsletter access:', error);
      throw error;
    }
  },

  /**
   * Check if user has access to newsletters (Public endpoint)
   */
  checkAccess: async (userEmail: string, newsletterId?: string): Promise<NewsletterAccessCheckResponse> => {
    try {
      const params = new URLSearchParams({ user_email: userEmail });
      if (newsletterId) {
        params.append('newsletter_id', newsletterId);
      }
      
      const response = await apiClient.get<NewsletterAccessCheckResponse>(
        `/api/v1/newsletter-access/check?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to check newsletter access:', error);
      throw error;
    }
  },

  /**
   * Get pending access requests (Admin only)
   */
  getPendingRequests: async (skip: number = 0, limit: number = 100): Promise<NewsletterAccessRequest[]> => {
    try {
      const response = await apiClient.get<NewsletterAccessRequest[]>(
        `/api/v1/newsletter-access/admin/pending?skip=${skip}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      throw error;
    }
  },

  /**
   * Get count of pending requests (Admin only)
   */
  getPendingCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<PendingRequestsCountResponse>(
        '/api/v1/newsletter-access/admin/pending/count'
      );
      return response.data.count;
    } catch (error) {
      console.error('Failed to get pending count:', error);
      throw error;
    }
  },

  /**
   * Get all access requests (Admin only)
   */
  getAllRequests: async (
    statusFilter?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<NewsletterAccessRequest[]> => {
    try {
      const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
      if (statusFilter) {
        params.append('status_filter', statusFilter);
      }
      
      const response = await apiClient.get<NewsletterAccessRequest[]>(
        `/api/v1/newsletter-access/admin/all?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get all requests:', error);
      throw error;
    }
  },

  /**
   * Approve or deny an access request (Admin only)
   */
  handleAction: async (data: NewsletterAccessAction): Promise<NewsletterAccessActionResponse> => {
    try {
      const response = await apiClient.post<NewsletterAccessActionResponse>(
        '/api/v1/newsletter-access/admin/action',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to handle access action:', error);
      throw error;
    }
  },

  /**
   * Delete an access request (Admin only)
   */
  deleteRequest: async (requestId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/newsletter-access/admin/${requestId}`);
    } catch (error) {
      console.error('Failed to delete access request:', error);
      throw error;
    }
  },
};

export default newsletterAccessService;
