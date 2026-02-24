import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '@/api/services/events.service';
import type { Event } from '@/types/models/event';
import type { EventCardData } from '@/features/events/EventCard';
import { withCache } from '@/utils/requestCache';
import { isAuthenticated } from '@/utils/sessionStorage';

interface UseEventsOptions {
  /** Filter by category */
  category?: string;
  /** Only fetch featured events */
  featured?: boolean;
  /** Maximum number of events to fetch */
  limit?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseEventsReturn {
  events: EventCardData[];
  registeredEventIds: Set<string>;
  registrationIdByEventId: Map<string, string>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Transform API response to EventCardData format
 */
const transformToEventCardData = (event: Event): EventCardData => ({
  id: event.id,
  title: event.title,
  description: event.description,
  category: event.category,
  subtitle: event.subtitle,
  date: event.date,
  time: event.time,
  timezone: event.timezone,
  duration_minutes: event.duration_minutes,
  attendee_value: event.attendee_value,
  status: event.status,
  thumbnail_url: event.thumbnail_url,
  video_url: event.video_url,
  is_past: event.is_past,
  created_at: event.created_at,
  updated_at: event.updated_at,
});

/**
 * useEvents - Custom hook for fetching event data from API
 * 
 * Fetches event data from the backend API with optional filters.
 * 
 * @example
 * // Fetch all events
 * const { events, isLoading, error } = useEvents();
 * 
 * @example
 * // Fetch with filters
 * const { events } = useEvents({ category: 'Webinar', featured: true });
 */
export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const {
    category,
    featured,
    limit,
    autoFetch = true,
  } = options;

  const [events, setEvents] = useState<EventCardData[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [registrationIdByEventId, setRegistrationIdByEventId] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is logged in
      const isLoggedIn = isAuthenticated();

      // Create cache key based on filter params
      const eventsCacheKey = `events-${category || 'all'}-${featured ? 'published-true' : 'all'}-${limit || 'all'}`;
      const registrationsCacheKey = 'user-registrations';

      // Fetch events and optionally user registrations in parallel with caching
      const [apiData, registrations] = await Promise.all([
        withCache(eventsCacheKey, () =>
          eventsService.getAll({ 
            category, 
            status: featured ? 'published' : undefined,
            featured 
          })
        ),
        // Only fetch registrations if logged in
        isLoggedIn 
          ? withCache(registrationsCacheKey, () =>
              eventsService.getUserRegistrations()
            ).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Extract registered event IDs and registration ID map
      const activeRegistrations = registrations.filter(reg => reg.status === 'REGISTERED');
      const registeredIds = new Set(activeRegistrations.map(reg => reg.event_id));
      const regIdMap = new Map(activeRegistrations.map(reg => [reg.event_id, reg.id]));
      setRegisteredEventIds(registeredIds);
      setRegistrationIdByEventId(regIdMap);

      // Transform to card data format
      const transformedData = apiData.map(transformToEventCardData);

      // Apply limit if specified
      const limitedData = limit && limit > 0 ? transformedData.slice(0, limit) : transformedData;
      
      setEvents(limitedData);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again later.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, featured, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [autoFetch, fetchEvents]);

  return {
    events,
    registeredEventIds,
    registrationIdByEventId,
    isLoading,
    error,
    refetch: fetchEvents,
  };
};

export default useEvents;
