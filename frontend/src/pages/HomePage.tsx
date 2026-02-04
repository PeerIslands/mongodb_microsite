import {
  Hero,
  Statistics,
  Capabilities,
  CaseStudies,
  Events,
  Testimonials,
} from '@/features/home/components';
import '@/styles/pages/HomePage.css';

/**
 * Homepage - Main landing page
 */
const HomePage = () => {
  return (
    <div className="home-page">
      <Hero />
      <Statistics />
      <Capabilities />
      <CaseStudies />
      <Testimonials />
      <Events />
    </div>
  );
};

export default HomePage;

