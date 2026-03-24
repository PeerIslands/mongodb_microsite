import apiClient from '../client';

export interface EventResourceRequestCreate {
  event_id: string;
  user_email: string;
  user_name?: string;
}

export interface EventResourceRequest {
  _id: string;
  event_id: string;
  event_title?: string;
  requester_type?: 'authenticated' | 'guest';
  user_email: string;
  user_name?: string;
  user_id?: string;
  guest_registration_id?: string;
  company?: string;
  designation?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  resolved_at?: string;
  resolved_by?: string;
  admin_note?: string;
}

export const eventResourceRequestService = {
  request: async (data: EventResourceRequestCreate): Promise<EventResourceRequest> => {
    const response = await apiClient.post<EventResourceRequest>(
      '/api/v1/event-resource-requests/request',
      data
    );
    return response.data;
  },

  getPendingRequests: async (skip = 0, limit = 100): Promise<EventResourceRequest[]> => {
    const response = await apiClient.get<EventResourceRequest[]>(
      '/api/v1/event-resource-requests/admin/pending',
      { params: { skip, limit } }
    );
    return response.data;
  },

  getPendingCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(
      '/api/v1/event-resource-requests/admin/pending/count'
    );
    return response.data.count;
  },

  getAllRequests: async (status?: string, skip = 0, limit = 100): Promise<EventResourceRequest[]> => {
    const response = await apiClient.get<EventResourceRequest[]>(
      '/api/v1/event-resource-requests/admin/requests',
      { params: { status_filter: status, skip, limit } }
    );
    return response.data;
  },

  updateStatus: async (
    requestId: string,
    action: 'approve' | 'deny',
    adminNote?: string
  ): Promise<EventResourceRequest> => {
    const response = await apiClient.patch<EventResourceRequest>(
      `/api/v1/event-resource-requests/admin/${requestId}`,
      null,
      { params: { action, admin_note: adminNote } }
    );
    return response.data;
  },

  delete: async (requestId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/event-resource-requests/admin/${requestId}`);
  },
};
