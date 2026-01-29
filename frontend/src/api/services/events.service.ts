import apiClient from '../client';
import type {
  Event,
  EventDetail,
  CreateEventDto,
  UpdateEventDto,
  EventMutationResponse,
} from '@/types/models/event';

// Event Registration Types
export interface CreateEventRegistrationDto {
  event_id: string;
}

export interface CreateEventRegistrationResponse {
  id: string;
  message: string;
}

export interface EventRegistrationResponse {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  registered_at: string;
}

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

  // Register for an event (authenticated user)
  registerForEvent: async (eventId: string) => {
    const response = await apiClient.post<CreateEventRegistrationResponse>(
      '/api/v1/event-registrations',
      { event_id: eventId }
    );
    return response.data;
  },

  // Get registrations for a specific user
  getUserRegistrations: async (status?: string) => {
    const response = await apiClient.get<EventRegistrationResponse[]>(
      `/api/v1/event-registrations/user`,
      { params: status ? { status } : undefined }
    );
    return response.data;
  },

  // Get registration count for a specific event
  getRegistrationCount: async (eventId: string) => {
    const response = await apiClient.get<{ event_id: string; count: number }>(
      `/api/v1/event-registrations/event/${eventId}/count`
    );
    return response.data;
  },

  // Download registrations as Excel file
  downloadRegistrationsExcel: async (eventId: string, eventTitle: string) => {
    const response = await apiClient.get(
      `/api/v1/event-registrations/event/${eventId}/export`,
      {
        responseType: 'blob',
      }
    );
    
    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename from event title
    const safeTitle = eventTitle.replaceAll(/[^a-zA-Z0-9 \-_]/g, '_').substring(0, 50);
    const date = new Date().toISOString().split('T')[0].replaceAll('-', '');
    link.download = `${safeTitle}_registrations_${date}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
  },

  // Download calendar ICS file for an event
  downloadCalendar: async (eventId: string) => {
    console.log('[eventsService] Starting calendar download for event:', eventId);
    
    const response = await apiClient.get(
      `/api/v1/events/${eventId}/calendar`,
      {
        responseType: 'blob',
      }
    );
    
    console.log('[eventsService] Calendar file received, size:', response.data.size);
    
    // Create download link
    const blob = new Blob([response.data], {
      type: 'text/calendar',
    });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-${eventId}.ics`;
    
    // Add a unique ID to help track if this link is clicked multiple times
    link.id = `calendar-download-${eventId}-${Date.now()}`;
    
    console.log('[eventsService] Triggering download with link:', link.id);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      console.log('[eventsService] Download cleanup completed');
    }, 100);
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
