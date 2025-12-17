import '@/styles/features/home/Testimonials.css';

// Profile images - update these paths when actual images are available
// Using placeholder paths based on Figma asset names
const profileImage1 = 'http://localhost:3845/assets/0db95bf9da5e84bb8cf62017e2c3f54ac6dd4d6e.png'; // Sean Rose
const profileImage2 = 'http://localhost:3845/assets/680c4189088474f8639b156bd5335a90bceb57be.png'; // Ryan Delk
const profileImage3 = 'http://localhost:3845/assets/3f17e5dde76ab2d164b8d4ee298281cd7ac3d49e.png'; // Demetria Giles
const profileImage4 = 'http://localhost:3845/assets/491c12ba89816bae5fc9c0c993f82d01bdc5ac29.png'; // Jeremy McPeak
const profileImage5 = 'http://localhost:3845/assets/4322e178a0dae3534aa4b448e3d9ae29618eef2b.png'; // Fabrizio Rinaldi
const profileImage6 = 'http://localhost:3845/assets/42bb87a5c756c47d62500e9a7c93078fc3d748f4.png'; // Jonathan Simcoe

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
