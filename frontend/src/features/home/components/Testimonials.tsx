import { useState, useEffect } from 'react';
import '@/styles/features/home/Testimonials.css';
import { caseStudiesService, TestimonialData } from '@/api/services/case-studies.service';
import { withCache } from '@/utils/requestCache';

// Generate initials-based placeholder avatars using UI Avatars service
const getAvatarUrl = (name: string, bg: string = '5B6CFF') => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=80&font-size=0.35&rounded=true`;

// Color palette for avatars
const avatarColors = ['6366F1', '8B5CF6', '06B6D4', '10B981', 'F59E0B', 'EC4899', 'EF4444', '3B82F6'];

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        // Use cache to prevent duplicate requests in StrictMode
        const data = await withCache('testimonials', () =>
          caseStudiesService.getTestimonials()
        );
        console.log('📊 Testimonials fetched:', data);
        console.log('📊 Number of testimonials:', data.length);
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

  if (loading) {
    return (
      <section className="testimonials">
        <div className="testimonials-header">
          <h2 className="testimonials-title">Testimonials</h2>
          <p className="testimonials-subtitle">Here's what people are saying about us</p>
        </div>
        <div className="testimonials-loading">Loading testimonials...</div>
      </section>
    );
  }

  if (error || testimonials.length === 0) {
    return (
      <section className="testimonials">
        <div className="testimonials-header">
          <h2 className="testimonials-title">Testimonials</h2>
          <p className="testimonials-subtitle">Here's what people are saying about us</p>
        </div>
        <div className="testimonials-empty">No testimonials available at the moment.</div>
      </section>
    );
  }

  // Distribute testimonials into two rows (max 3 per row for optimal display)
  const row1Testimonials = testimonials.slice(0, 3);
  const row2Testimonials = testimonials.slice(3, 6);

  return (
    <section className="testimonials">
      <div className="testimonials-header">
        <h2 className="testimonials-title">Testimonials</h2>
        <p className="testimonials-subtitle">Here's what people are saying about us</p>
      </div>
      <div className="testimonials-items">
        {/* First row */}
        <div className="testimonials-row testimonials-row-1">
          {row1Testimonials.map((testimonial, index) => {
            const avatarColor = avatarColors[index % avatarColors.length];
            const avatarUrl = getAvatarUrl(testimonial.testimonial_author, avatarColor);
            
            return (
              <div key={testimonial.id} className="testimonial-card-margin">
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
              </div>
            );
          })}
        </div>
        
        {/* Second row */}
        {row2Testimonials.length > 0 && (
          <div className="testimonials-row testimonials-row-2">
            {row2Testimonials.map((testimonial, index) => {
              const avatarColor = avatarColors[(index + 3) % avatarColors.length];
              const avatarUrl = getAvatarUrl(testimonial.testimonial_author, avatarColor);
              
              return (
                <div key={testimonial.id} className="testimonial-card-margin">
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
                </div>
              );
            })}
          </div>
        )}
        
        {/* Fade gradients */}
        <div className="testimonials-fade"></div>
      </div>
    </section>
  );
};

export default Testimonials;
