import apiClient from '../client';
import type { SiteAnalytics, PageAnalytics, MonthlyReport } from '@/types/models/analytics';

export const analyticsService = {
  // Get site-wide analytics
  getSiteWide: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<SiteAnalytics>('/api/v1/admin/analytics/site-wide', { params });
    return response.data;
  },

  // Get page-level analytics
  getPageLevel: async (params?: { page?: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<PageAnalytics[]>('/api/v1/admin/analytics/page-level', { params });
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (year: number, month: number) => {
    const response = await apiClient.get<MonthlyReport>(`/api/v1/admin/analytics/monthly/${year}/${month}`);
    return response.data;
  },
};

