import { useState, useEffect } from 'react';
import '@/styles/features/about/AboutResults.css';

interface ResultStat {
  value: string;
  label: string;
}

const resultStats: ResultStat[] = [
  {
    value: '100+',
    label: 'Modernization projects delivered',
  },
  {
    value: '75%',
    label: 'Average accelerations achieved on projects',
  },
  {
    value: '10+',
    label: 'Prebuilt Accelerators & newer ones in works',
  },
];

/**
 * About Results Section - Proven results statistics with circular carousel on mobile
 */
const AboutResults = () => {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

  // Auto-rotate stats in circular display (mobile only)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % resultStats.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="about-results">
      <div className="about-results__container">
        <h2 className="about-results__title">
          Significant Experience Executing Complex Engagements in Mission Critical Situations
        </h2>
        
        {/* Desktop Grid */}
        <div className="about-results__grid about-results__grid-desktop">
          {resultStats.map((stat, index) => (
            <div key={index} className="about-results__stat">
              <span className="about-results__stat-value">{stat.value}</span>
              <span className="about-results__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Mobile Circular Display */}
        <div className="about-results__circle-container about-results__circle-mobile">
          <div className="about-results__circle">
            <div className="about-results__circle-content">
              {resultStats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`about-results__circle-item ${index === currentStatIndex ? 'active' : ''}`}
                >
                  <div className="about-results__circle-value">{stat.value}</div>
                  <div className="about-results__circle-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dots indicator */}
          <div className="about-results__circle-dots">
            {resultStats.map((_, index) => (
              <button
                key={index}
                className={`about-results__circle-dot ${index === currentStatIndex ? 'active' : ''}`}
                onClick={() => setCurrentStatIndex(index)}
                aria-label={`Go to stat ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutResults;
