import EventGrid from './EventGrid';
import { EventCardData } from './EventCard';
import { useEvents } from '@/hooks/useEvents';
import '@/styles/features/events/EventSection.css';

interface EventSectionProps {
  /** Static event data - if not provided, will fetch from API */
  events?: EventCardData[];
  /** Maximum number of events to display */
  maxItems?: number;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** HTML id for scroll navigation */
  id?: string;
}

/**
 * EventSection - Complete event section with header and grid
 * 
 * Fetches event data from API or displays provided static data.
 * 
 * Use the `id` prop to enable scroll-to functionality from navigation.
 * 
 * @example
 * // With static data
 * <EventSection events={myEventData} />
 * 
 * @example
 * // Fetch from API
 * <EventSection />
 */
const EventSection = ({ 
  events: staticEvents,
  maxItems = 6, 
  title = 'Upcoming Events',
  subtitle = 'Join us for webinars, workshops, and community events',
  id = 'events',
}: EventSectionProps) => {
  // Use the hook to fetch events if no static data provided
  const { 
    events: fetchedEvents, 
    isLoading,
    error
  } = useEvents({
    limit: maxItems,
    featured: true,
    autoFetch: !staticEvents, // Only fetch if no static events provided
  });

  // Use static events if provided, otherwise use fetched events
  const displayEvents = staticEvents || fetchedEvents;

  return (
    <section className="event-section" id={id}>
      {/* Background decorations */}
      <div className="event-section__bg-glow event-section__bg-glow--left" />
      <div className="event-section__bg-glow event-section__bg-glow--right" />
      
      <div className="event-section__container">
        {/* Section header */}
        <div className="event-section__header">
          <h2 className="event-section__title">{title}</h2>
          {subtitle && (
            <p className="event-section__subtitle">{subtitle}</p>
          )}
        </div>

        {/* Loading state */}
        {isLoading && !staticEvents ? (
          <div className="event-section__loading">
            <div className="event-section__loading-spinner" />
            <p>Loading events...</p>
          </div>
        ) : error && !staticEvents ? (
          <div className="event-section__error">
            <p>{error}</p>
          </div>
        ) : (
          /* Event grid */
          <EventGrid events={displayEvents} maxItems={maxItems} />
        )}
      </div>
    </section>
  );
};

export default EventSection;
