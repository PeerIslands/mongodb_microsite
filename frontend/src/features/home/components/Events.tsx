import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import '@/styles/features/home/Events.css';
import { EventCardHorizontal } from '@/features/events';
import { useEvents } from '@/hooks/useEvents';

const Events = () => {
  const navigate = useNavigate();

  // Use the shared hook to fetch featured events
  const { events: featuredEvents, isLoading } = useEvents({
    featured: true,
  });

  // Handle event card click - navigate to events page with ID
  const handleEventClick = (eventId: string) => {
    navigate(`/events?id=${eventId}`);
  };

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

  // Render horizontal event cards with Swiper (1 at a time with pagination dots)
  const renderEventCards = () => (
    <div className="events-carousel-wrapper">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={32}
        slidesPerView={1}
        loop={featuredEvents.length > 1}
        speed={600}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: false,
        }}
        className="events-swiper"
      >
        {featuredEvents.map((event) => (
          <SwiperSlide key={event.id} className="event-slide">
            <EventCardHorizontal 
              data={event} 
              onClick={() => handleEventClick(event.id)} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
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
