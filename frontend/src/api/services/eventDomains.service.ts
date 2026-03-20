import apiClient from '../client';

const BASE = '/api/v1/event-domains';

export interface WhitelistedDomain {
  domain: string;
  added_at: string;
}

export interface DomainRequest {
  domain: string;
  first_requested_at: string;
  last_requested_at: string;
  request_count: number;
  status: 'pending' | 'approved' | 'rejected';
}

export const eventDomainsService = {
  // Whitelist
  listWhitelist: async (): Promise<WhitelistedDomain[]> => {
    const { data } = await apiClient.get<WhitelistedDomain[]>(`${BASE}/whitelist`);
    return data;
  },

  addDomain: async (domain: string): Promise<WhitelistedDomain> => {
    const { data } = await apiClient.post<WhitelistedDomain>(`${BASE}/whitelist`, { domain });
    return data;
  },

  removeDomain: async (domain: string): Promise<void> => {
    await apiClient.delete(`${BASE}/whitelist/${encodeURIComponent(domain)}`);
  },

  // Domain access requests
  getPendingCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ pending_count: number }>(`${BASE}/requests/count`);
    return data.pending_count;
  },

  listRequests: async (): Promise<DomainRequest[]> => {
    const { data } = await apiClient.get<DomainRequest[]>(`${BASE}/requests`);
    return data;
  },

  approveDomain: async (domain: string): Promise<void> => {
    await apiClient.post(`${BASE}/requests/${encodeURIComponent(domain)}/approve`);
  },

  rejectDomain: async (domain: string): Promise<void> => {
    await apiClient.post(`${BASE}/requests/${encodeURIComponent(domain)}/reject`);
  },
};
