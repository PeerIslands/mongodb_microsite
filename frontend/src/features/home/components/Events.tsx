import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import '@/styles/features/home/Events.css';
import { EventCard } from '@/features/events';
import { useEvents } from '@/hooks/useEvents';

const Events = () => {
  const navigate = useNavigate();
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // Use the shared hook to fetch featured events
  const { events: featuredEvents, isLoading } = useEvents({
    featured: true,
  });

  // Handle event card click - navigate to events page with ID
  const handleEventClick = (eventId: string) => {
    navigate(`/events?id=${eventId}`);
  };

  const showCarouselControls = featuredEvents.length > 3;

  // Render loading state
  const renderLoading = () => (
    <div className="events-loading">
      <div className="events-loading__spinner" />
      <p>Loading events...</p>
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="events-empty">
      <p>No featured events available.</p>
    </div>
  );

  // Render event cards with Swiper
  const renderEventCards = () => (
    <div className="events-carousel-wrapper">
      {showCarouselControls && (
        <button 
          className="events-carousel-arrow events-carousel-arrow-left"
          onClick={() => swiperInstance?.slidePrev()}
          aria-label="Previous events"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <Swiper
        modules={[Navigation]}
        spaceBetween={24}
        slidesPerView={1}
        loop={featuredEvents.length > 3}
        speed={600}
        breakpoints={{
          640: {
            slidesPerView: 1.5,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 3,
            spaceBetween: 32,
          },
        }}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        className="events-swiper"
      >
        {featuredEvents.map((event) => (
          <SwiperSlide key={event.id} className="event-slide">
            <button 
              type="button"
              className="event-card-button"
              onClick={() => handleEventClick(event.id)}
              aria-label={`View details for ${event.title}`}
            >
              <EventCard data={event} />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {showCarouselControls && (
        <button 
          className="events-carousel-arrow events-carousel-arrow-right"
          onClick={() => swiperInstance?.slideNext()}
          aria-label="Next events"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <section id="events" className="events">
      {/* Title */}
      <h2 className="events-title">
        <span>Upcoming</span>
        <span>Events</span>
      </h2>
      
      {/* Cards - show loading, empty, or cards */}
      {isLoading 
        ? renderLoading()
        : featuredEvents.length === 0
          ? renderEmpty()
          : renderEventCards()
      }
    </section>
  );
};

export default Events;
