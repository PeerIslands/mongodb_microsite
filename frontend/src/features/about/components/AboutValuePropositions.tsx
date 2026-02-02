import { useState, useEffect } from 'react';
import '@/styles/features/about/AboutValuePropositions.css';

interface ValueProposition {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const valuePropositions: ValueProposition[] = [
  {
    title: 'AI Native by Design',
    description: 'AI is not an add-on. We embed it into the core of every workflow—from day one.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Peer AI',
    description: 'A first-of-its-kind suite of AI agents purpose-built for accelerating modernization and transforming business workflows.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Certified Experts',
    description: 'Ready for Autonomous Partner Lead Delivery through Consulting Engineer and Project Manager Tradecrafts certified Engineers.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 15l-2 5l2-2l2 2l-2-5z"/>
        <circle cx="12" cy="9" r="6"/>
        <path d="M9 9l1.5 1.5L15 6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Top 1% Developers',
    description: 'Polyglot developers who own projects end-to-end.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Proven at Scale',
    description: '12x faster development—proven results at enterprise scale.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Recognition',
    description: 'Earned MongoDB Migration Factor Preferred Partner (MFPP) status.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/**
 * About Value Propositions Section - Glass morphism cards with mobile carousel
 */
const AboutValuePropositions = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % valuePropositions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="about-values">
      <div className="about-values__container">
        <div className="about-values__grid">
          {valuePropositions.map((prop, index) => (
            <div 
              key={index} 
              className={`about-values__card ${index === currentSlide ? 'active' : ''}`}
              data-index={index}
            >
              <div className="about-values__card-icon">
                {prop.icon}
              </div>
              <h3 className="about-values__card-title">{prop.title}</h3>
              <p className="about-values__card-description">{prop.description}</p>
            </div>
          ))}
        </div>
        
        {/* Carousel dots - only visible on mobile */}
        <div className="about-values__carousel-dots">
          {valuePropositions.map((_, index) => (
            <button
              key={index}
              className={`about-values__dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutValuePropositions;
