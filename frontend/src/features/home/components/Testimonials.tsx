import '@/styles/features/home/Testimonials.css';

// Generate initials-based placeholder avatars using UI Avatars service
// These are stable placeholder images until actual profile images are available
const getAvatarUrl = (name: string, bg: string = '5B6CFF') => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=80&font-size=0.35&rounded=true`;

const profileImage1 = getAvatarUrl('Sean Rose', '6366F1'); // Sean Rose
const profileImage2 = getAvatarUrl('Ryan Delk', '8B5CF6'); // Ryan Delk
const profileImage3 = getAvatarUrl('Demetria Giles', '06B6D4'); // Demetria Giles
const profileImage4 = getAvatarUrl('Jeremy McPeak', '10B981'); // Jeremy McPeak
const profileImage5 = getAvatarUrl('Fabrizio Rinaldi', 'F59E0B'); // Fabrizio Rinaldi
const profileImage6 = getAvatarUrl('Jonathan Simcoe', 'EC4899'); // Jonathan Simcoe

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sean Rose',
      handle: '@seanrose',
      image: profileImage1,
      text: (
        <>
          Really, really liking <span className="highlight">@reflectnotes</span> so far. It's just the right amount of simple/fast for a personal note taking app and does most of the hard work of organizing in the background.
        </>
      ),
      paddingBottom: 0,
    },
    {
      name: 'Ryan Delk',
      handle: '@delk',
      image: profileImage2,
      text: (
        <>
          Don't take it from me: <span className="highlight">@reflectnotes</span> is magic.
        </>
      ),
      paddingBottom: 96,
    },
    {
      name: 'Demetria Giles',
      handle: '@drosewritings',
      image: profileImage3,
      text: (
        <>
          Playing around with <span className="highlight">@reflectnotes</span>. I'm back logging key thoughts, details and soundbites from episodes, books, meetings, articles, etc from the past week. So far, it's a knowledge worker's dream come true.
        </>
      ),
      paddingBottom: 0,
    },
    {
      name: 'Jeremy McPeak',
      handle: '@jwmcpeak',
      image: profileImage4,
      text: (
        <>
          I just received an invite to <span className="highlight">@reflectnotes</span>, and holy crap! It is well thought out, and I can see this being my note-taking platform going forward. Well done! I'm looking forward to seeing how the app progresses.
        </>
      ),
      paddingBottom: 48,
    },
    {
      name: 'Fabrizio Rinaldi',
      handle: '@linuz90',
      image: profileImage5,
      text: (
        <>
          I'm keeping <span className="highlight">@reflectnotes</span> open *all* the time, and I'm using both for simple journaling, and long form writing. It's rare to see a single app work so well for both.
        </>
      ),
      paddingBottom: 72,
    },
    {
      name: 'Jonathan Simcoe',
      handle: '@jdsimcoe',
      image: profileImage6,
      text: (
        <>
          All righty. I have to give a massive shout-out to <span className="highlight">@maccaw</span> for pioneering <span className="highlight">@reflectnotes</span>. It has already matured to a point where it is a daily driver for me. The speed, focus, and attention to detail (especially perfect bits of structured data) is superb.
        </>
      ),
      paddingBottom: 0,
    },
  ];

  return (
    <section className="testimonials">
      <div className="testimonials-header">
        <h2 className="testimonials-title">Testimonials</h2>
        <p className="testimonials-subtitle">Here's what people are saying about us</p>
      </div>
      <div className="testimonials-items">
        {/* First row */}
        <div className="testimonials-row testimonials-row-1">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div key={index} className="testimonial-card-margin">
              <div 
                className="testimonial-card"
                style={{ paddingBottom: testimonial.paddingBottom ? `${testimonial.paddingBottom}px` : undefined }}
              >
                <div className="testimonial-card-top">
                  <div className="testimonial-avatar">
                    <img src={testimonial.image} alt={testimonial.name} />
                  </div>
                  <div className="testimonial-card-text">
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-handle">{testimonial.handle}</div>
                  </div>
                </div>
                <div className="testimonial-card-content">
                  <div className="testimonial-text">{testimonial.text}</div>
                </div>
                <div className="testimonial-mask"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Second row */}
        <div className="testimonials-row testimonials-row-2">
          {testimonials.slice(3, 6).map((testimonial, index) => (
            <div key={index} className="testimonial-card-margin">
              <div 
                className="testimonial-card"
                style={{ paddingBottom: testimonial.paddingBottom ? `${testimonial.paddingBottom}px` : undefined }}
              >
                <div className="testimonial-card-top">
                  <div className="testimonial-avatar">
                    <img src={testimonial.image} alt={testimonial.name} />
                  </div>
                  <div className="testimonial-card-text">
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-handle">{testimonial.handle}</div>
                  </div>
                </div>
                <div className="testimonial-card-content">
                  <div className="testimonial-text">{testimonial.text}</div>
                </div>
                <div className="testimonial-mask"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Fade gradients */}
        <div className="testimonials-fade"></div>
      </div>
    </section>
  );
};

export default Testimonials;
