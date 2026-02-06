import { useMemo, useState, useEffect } from 'react';
import EventCard, { EventCardData } from './EventCard';
import '@/styles/features/events/EventGrid.css';

interface EventGridProps {
  events: EventCardData[];
  maxItems?: number;
  onEventClick?: (event: EventCardData) => void;
  registeredEventIds?: Set<string>;
}

/**
 * EventGrid - Grid container for event cards with carousel on mobile
 * Displays events in a responsive grid layout (desktop) or carousel (mobile)
 */
const EventGrid = ({ events, maxItems, onEventClick, registeredEventIds = new Set() }: EventGridProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Optionally limit the number of displayed events
  const displayedEvents = useMemo(() => {
    if (maxItems && maxItems > 0) {
      return events.slice(0, maxItems);
    }
    return events;
  }, [events, maxItems]);

  // Auto-rotate carousel every 5 seconds (mobile only)
  useEffect(() => {
    if (displayedEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayedEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [displayedEvents.length]);

  if (displayedEvents.length === 0) {
    return (
      <div className="event-grid__empty">
        <p>No events available at the moment.</p>
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayedEvents.length) % displayedEvents.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayedEvents.length);
  };

  return (
    <>
      <div className="event-grid">
        {displayedEvents.map((event, index) => (
          <div 
            key={event.id}
            className={`event-grid__item ${index === currentSlide ? 'active' : ''}`}
          >
            <EventCard 
              data={event} 
              onCardClick={onEventClick}
              isRegistered={registeredEventIds.has(event.id)}
            />
          </div>
        ))}
      </div>

      {/* Carousel navigation - only visible on mobile */}
      <div className="event-grid__carousel-nav">
        {/* Previous button */}
        <button
          className="event-grid__carousel-arrow event-grid__carousel-arrow--prev"
          onClick={goToPrevSlide}
          aria-label="Previous event"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dots indicator */}
        <div className="event-grid__carousel-dots">
          {displayedEvents.map((_, index) => (
            <button
              key={index}
              className={`event-grid__carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to event ${index + 1}`}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          className="event-grid__carousel-arrow event-grid__carousel-arrow--next"
          onClick={goToNextSlide}
          aria-label="Next event"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default EventGrid;
