import { useMemo } from 'react';
import EventCard, { EventCardData } from './EventCard';
import '@/styles/features/events/EventGrid.css';

interface EventGridProps {
  events: EventCardData[];
  maxItems?: number;
  onEventClick?: (event: EventCardData) => void;
  registeredEventIds?: Set<string>;
}

/**
 * EventGrid - Grid container for event cards
 * Displays events in a responsive grid layout
 */
const EventGrid = ({ events, maxItems, onEventClick, registeredEventIds = new Set() }: EventGridProps) => {
  // Optionally limit the number of displayed events
  const displayedEvents = useMemo(() => {
    if (maxItems && maxItems > 0) {
      return events.slice(0, maxItems);
    }
    return events;
  }, [events, maxItems]);

  if (displayedEvents.length === 0) {
    return (
      <div className="event-grid__empty">
        <p>No events available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {displayedEvents.map((event) => (
        <EventCard 
          key={event.id} 
          data={event} 
          onCardClick={onEventClick}
          isRegistered={registeredEventIds.has(event.id)}
        />
      ))}
    </div>
  );
};

export default EventGrid;
