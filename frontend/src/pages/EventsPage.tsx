import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { EventGrid, EventDetailPanel, type EventCardData } from '@/features/events';
import LeafLoader from '@/components/LeafLoader';
import '@/styles/pages/EventsPage.css';

/**
 * Events Page - Dedicated page for all event content
 * Displays events in a grid layout with header
 */
const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { events: allEvents, registeredEventIds, registrationIdByEventId, isLoading, error, refetch } = useEvents({
    autoFetch: true,
  });

  // Filter to show only published events
  const events = allEvents.filter(event => event.status === 'published');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventCardData | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Handle URL query parameter for opening specific event
  useEffect(() => {
    const eventId = searchParams.get('id');
    if (eventId && events.length > 0 && !isLoading) {
      const eventToOpen = events.find(event => event.id === eventId);
      if (eventToOpen) {
        // Small delay to allow page to render smoothly before opening panel
        const timer = setTimeout(() => {
          setSelectedEvent(eventToOpen);
          setIsDetailPanelOpen(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, events, isLoading]);

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(event => event.category)));

  // Filter events based on search and category
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Limit to 6 events initially
  const INITIAL_DISPLAY_COUNT = 6;
  const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreEvents = filteredEvents.length > INITIAL_DISPLAY_COUNT;

  // Scroll to top on mount with smooth behavior
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Reset showAll when filters change
  useEffect(() => {
    setShowAll(false);
  }, [searchTerm, selectedCategory]);

  // Handle event card click - open detail panel
  const handleEventClick = (eventData: EventCardData) => {
    setSelectedEvent(eventData);
    setIsDetailPanelOpen(true);
  };

  // Handle detail panel close
  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    // Clear the URL parameter when closing
    if (searchParams.has('id')) {
      searchParams.delete('id');
      setSearchParams(searchParams, { replace: true });
    }
    // Delay clearing the selected event to allow close animation
    setTimeout(() => {
      setSelectedEvent(null);
    }, 300);
  };

  return (
    <div className="events-page">
      {/* Hero Section */}
      <section className="events-hero">
        <div className="events-hero__container">
          <h1 className="events-hero__title">
            Events and<span className="events-hero__title-gradient"> Webinars</span>
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="events-content">
        <div className="events-content__container">
          {/* Inline Search Bar */}
          <div className={`events-search-bar ${isSearchExpanded ? 'expanded' : ''}`}>
            {/* Search Input */}
            <div className={`events-search ${isSearchExpanded ? 'visible' : ''}`}>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="events-search__input"
              />
              <svg 
                className="events-search__icon" 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none"
              >
                <path 
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Category Dropdown */}
            <div className={`events-category-dropdown ${isSearchExpanded ? 'visible' : ''}`}>
              <select
                id="category-select"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="category-dropdown-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Button */}
            <button
              className={`events-search-toggle ${isSearchExpanded ? 'expanded' : ''} ${(searchTerm || selectedCategory) ? 'active' : ''}`}
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              aria-label="Toggle search filters"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none"
              >
                <path 
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {/* Loading State */}
          {isLoading && <LeafLoader message="Loading events..." />}

          {/* Error State */}
          {error && (
            <div className="events-error">
              <p>{error}</p>
            </div>
          )}

          {/* Event Grid */}
          {!isLoading && !error && (
            <>
              <div className="events-results-info">
                <p className="events-results-count">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                  {selectedCategory && ` in ${selectedCategory}`}
                </p>
              </div>

              {filteredEvents.length > 0 ? (
                <>
                  <EventGrid 
                    events={displayedEvents} 
                    onEventClick={handleEventClick}
                    registeredEventIds={registeredEventIds}
                  />
                  
                  {/* View More/Less Button */}
                  {hasMoreEvents && (
                    <div className="events-view-more">
                      <button 
                        className="events-view-more__button"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : `View More (${filteredEvents.length - INITIAL_DISPLAY_COUNT} more)`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="events-empty">
                  <p>No events found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Event Detail Panel */}
      <EventDetailPanel
        event={selectedEvent}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        isRegistered={selectedEvent ? registeredEventIds.has(selectedEvent.id) : false}
        registrationId={selectedEvent ? registrationIdByEventId.get(selectedEvent.id) : undefined}
        onRegistrationSuccess={refetch}
        onCancelSuccess={refetch}
      />
    </div>
  );
};

export default EventsPage;
