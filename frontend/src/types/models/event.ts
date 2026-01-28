// Event status enum
export type EventStatus = 'draft' | 'published';

// Base Event interface - snake_case to match API response
export interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  timezone: string;
  duration_minutes: number;
  description: string;
  attendee_value: string;
  category: string;
  featured: boolean;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

// Event detail (same as base for now, can be extended later)
export interface EventDetail extends Event {}

// DTO for creating an event - snake_case to match API
export interface CreateEventDto {
  title: string;
  subtitle: string;
  date: string;
  time: string;
  timezone: string;
  duration_minutes: number;
  description: string;
  attendee_value: string;
  category: string;
  featured?: boolean;
  status?: EventStatus;
}

// DTO for updating an event (all fields optional)
export interface UpdateEventDto extends Partial<CreateEventDto> {}

// Response for create/update/delete operations
export interface EventMutationResponse {
  id: string;
  message: string;
}
