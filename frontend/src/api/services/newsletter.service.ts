/**
 * Public Newsletter Service
 * Fetches active newsletters for display on the Insights page
 * Supports access control via user email
 */

import apiClient from '../client';
import { Newsletter } from '@/types/newsletter';

export const newsletterService = {
  /**
   * Get all active newsletters for public display
   * Access control enabled - pass user email to get full content
   */
  getAllNewsletters: async (userEmail?: string | null): Promise<Newsletter[]> => {
    try {
      const params = new URLSearchParams();
      if (userEmail) {
        params.append('user_email', userEmail);
      }
      
      const url = params.toString() 
        ? `/api/v1/email-templates/newsletters?${params.toString()}`
        : '/api/v1/email-templates/newsletters';
      
      const response = await apiClient.get<Newsletter[]>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
      throw error;
    }
  },
};

export default newsletterService;

