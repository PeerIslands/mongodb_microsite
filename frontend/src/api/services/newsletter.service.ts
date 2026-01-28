/**
 * Public Newsletter Service
 * Fetches active newsletters for display on the Insights page
 * NO AUTHENTICATION REQUIRED
 */

import apiClient from '../client';
import { Newsletter } from '@/types/newsletter';

export const newsletterService = {
  /**
   * Get all active newsletters for public display
   * Public endpoint - no auth required
   */
  getAllNewsletters: async (): Promise<Newsletter[]> => {
    try {
      const response = await apiClient.get<Newsletter[]>('/api/v1/email-templates/newsletters');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
      throw error;
    }
  },
};

export default newsletterService;

