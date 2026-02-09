import { useRef, useEffect } from 'react';
import type { CombinedTestimonial } from '@/types/models/testimonial';
import '@/styles/features/case-studies/TestimonialDetailSection.css';

interface TestimonialDetailSectionProps {
  testimonial: CombinedTestimonial | null;
  isVisible: boolean;
  isLoading?: boolean;
}

// Generate initials-based placeholder avatars
const getAvatarUrl = (name: string, bg: string = '5B6CFF') => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=120&font-size=0.35&rounded=true`;

/**
 * TestimonialDetailSection - Displays detailed testimonial information
 * This section is revealed when a user clicks on a testimonial card in the carousel
 */
const TestimonialDetailSection = ({ testimonial, isVisible, isLoading = false }: TestimonialDetailSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section when it becomes visible or when the testimonial changes
  useEffect(() => {
    if (isVisible && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isVisible, testimonial?.id]);

  // Loading state
  if (isLoading) {
    return (
      <section 
        ref={sectionRef}
        className="testimonial-detail testimonial-detail--visible"
      >
        <div className="testimonial-detail__container">
          <div className="testimonial-detail__loading">Loading testimonial details...</div>
        </div>
      </section>
    );
  }

  if (!testimonial) {
    return null;
  }

  const avatarUrl = getAvatarUrl(testimonial.testimonial_author);

  return (
    <section
      ref={sectionRef}
      className={`testimonial-detail ${isVisible ? 'testimonial-detail--visible' : ''}`}
    >
      <div className="testimonial-detail__container">
        {/* Header Section */}
        <header className="testimonial-detail__header">
          <div className="testimonial-detail__header-content">
            {/* Author Name */}
            <h2 className="testimonial-detail__author">{testimonial.testimonial_author}</h2>

            {/* Position */}
            <p className="testimonial-detail__position">{testimonial.testimonial_position} at {testimonial.company_name}</p>
          </div>
        </header>

        {/* Testimonial Quote */}
        <div className="testimonial-detail__content">
          <div className="testimonial-detail__quote-wrapper">
            <svg 
              className="testimonial-detail__quote-icon" 
              width="40" 
              height="32" 
              viewBox="0 0 40 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M0 32V16C0 7.168 7.168 0 16 0V8C11.584 8 8 11.584 8 16V32H0ZM24 32V16C24 7.168 31.168 0 40 0V8C35.584 8 32 11.584 32 16V32H24Z" 
                fill="currentColor"
                opacity="0.15"
              />
            </svg>
            <blockquote className="testimonial-detail__quote">
              {testimonial.testimonial_quote}
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialDetailSection;
