import apiClient from '../client';

export const analyticsService = {
  // Get site-wide analytics
  getSiteWide: async (days: number = 30) => {
    const response = await apiClient.get<any>(`/api/v1/analytics/site-wide?days=${days}`);
    return response.data;
  },

  // Get page-level analytics
  getPageLevel: async (days: number = 30) => {
    const response = await apiClient.get<any>(`/api/v1/analytics/page-level?days=${days}`);
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (year: number, month: number) => {
    const response = await apiClient.get<any>(`/api/v1/analytics/monthly/${year}/${month}`);
    return response.data;
  },

  // Get user activity
  getUserActivity: async (days: number = 7, eventType: string = 'all') => {
    const response = await apiClient.get<any>(`/api/v1/analytics/user-activity?days=${days}&event_type=${eventType}`);
    return response.data;
  },
};

