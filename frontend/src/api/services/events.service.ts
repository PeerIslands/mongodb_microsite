import apiClient from '../client';
import type {
  Event,
  EventDetail,
  CreateEventDto,
  UpdateEventDto,
  EventMutationResponse,
} from '@/types/models/event';

export const eventsService = {
  // Get all events with optional filters
  getAll: async (params?: { category?: string; status?: string; featured?: boolean }) => {
    const response = await apiClient.get<Event[]>('/api/v1/events', { params });
    return response.data;
  },

  // Get single event by ID
  getById: async (id: string) => {
    const response = await apiClient.get<EventDetail>(`/api/v1/events/${id}`);
    return response.data;
  },

  // Get all unique categories
  getCategories: async () => {
    const response = await apiClient.get<string[]>('/api/v1/events/categories');
    return response.data;
  },

  // Create new event
  create: async (data: CreateEventDto) => {
    const response = await apiClient.post<EventMutationResponse>('/api/v1/events', data);
    return response.data;
  },

  // Update event by ID
  update: async (id: string, data: UpdateEventDto) => {
    const response = await apiClient.put<EventMutationResponse>(`/api/v1/events/${id}`, data);
    return response.data;
  },

  // Delete event by ID
  delete: async (id: string) => {
    const response = await apiClient.delete<EventMutationResponse>(`/api/v1/events/${id}`);
    return response.data;
  },
};

// Re-export types for convenience
export type {
  Event,
  EventDetail,
  CreateEventDto,
  UpdateEventDto,
  EventMutationResponse,
} from '@/types/models/event';
