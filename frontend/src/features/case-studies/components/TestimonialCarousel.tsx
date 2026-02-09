import { useState, useEffect, useRef } from 'react';
import '@/styles/features/case-studies/TestimonialCarousel.css';
import { testimonialsService } from '@/api/services/testimonials.service';
import type { CombinedTestimonial } from '@/types/models/testimonial';
import { withCache } from '@/utils/requestCache';

// Generate initials-based placeholder avatars using UI Avatars service
const getAvatarUrl = (name: string, bg: string = '5B6CFF') => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=80&font-size=0.35&rounded=true`;

// Color palette for avatars
const avatarColors = ['6366F1', '8B5CF6', '06B6D4', '10B981', 'F59E0B', 'EC4899', 'EF4444', '3B82F6'];

interface TestimonialCarouselProps {
  onTestimonialClick: (testimonialId: string) => void;
}

const TestimonialCarousel = ({ onTestimonialClick }: TestimonialCarouselProps) => {
  const [testimonials, setTestimonials] = useState<CombinedTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        // Use cache to prevent duplicate requests
        const data = await withCache('testimonials-carousel', () =>
          testimonialsService.getCombined()
        );
        setTestimonials(data);
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
        setError('Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (testimonials.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length, isPaused]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (loading) {
    return (
      <section className="testimonial-carousel">
        <div className="testimonial-carousel__header">
          <h2 className="testimonial-carousel__title">Client Testimonials</h2>
          <p className="testimonial-carousel__subtitle">Hear from our satisfied clients</p>
        </div>
        <div className="testimonial-carousel__loading">Loading testimonials...</div>
      </section>
    );
  }

  if (error || testimonials.length === 0) {
    return (
      <section className="testimonial-carousel">
        <div className="testimonial-carousel__header">
          <h2 className="testimonial-carousel__title">Client Testimonials</h2>
          <p className="testimonial-carousel__subtitle">Hear from our satisfied clients</p>
        </div>
        <div className="testimonial-carousel__empty">No testimonials available at the moment.</div>
      </section>
    );
  }

  return (
    <section 
      className="testimonial-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <div className="testimonial-carousel__header">
        <h2 className="testimonial-carousel__title">Client Testimonials</h2>
        <p className="testimonial-carousel__subtitle">Hear from our satisfied clients</p>
      </div>

      <div className="testimonial-carousel__container" ref={carouselRef}>
        <div 
          className="testimonial-carousel__track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {testimonials.map((testimonial, index) => {
            const avatarColor = avatarColors[index % avatarColors.length];
            const avatarUrl = getAvatarUrl(testimonial.testimonial_author, avatarColor);

            return (
              <button
                key={testimonial.id} 
                className="testimonial-carousel__slide"
                onClick={() => onTestimonialClick(testimonial.id)}
                type="button"
              >
                <div className="testimonial-card">
                  <div className="testimonial-card-top">
                    <div className="testimonial-avatar">
                      <img src={avatarUrl} alt={testimonial.testimonial_author} />
                    </div>
                    <div className="testimonial-card-text">
                      <div className="testimonial-name">{testimonial.testimonial_author}</div>
                      <div className="testimonial-handle">
                        {testimonial.testimonial_position}
                        {testimonial.company_name && ` at ${testimonial.company_name}`}
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-card-content">
                    <div className="testimonial-text">{testimonial.testimonial_quote}</div>
                  </div>
                  <div className="testimonial-mask"></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="testimonial-carousel__dots">
        {testimonials.map((testimonial, index) => (
          <button
            key={`dot-${testimonial.id}`}
            className={`testimonial-carousel__dot ${index === currentIndex ? 'testimonial-carousel__dot--active' : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default TestimonialCarousel;
