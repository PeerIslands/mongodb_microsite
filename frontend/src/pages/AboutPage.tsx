import { useEffect } from 'react';
import {
  AboutHero,
  AboutValuePropositions,
  AboutCertifications,
  AboutResults,
  AboutPartnership,
  AboutPartnerships,
} from '@/features/about';
import '@/styles/pages/AboutPage.css';

/**
 * About Page - Company information, values, certifications, and partnerships
 */
const AboutPage = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <AboutHero />
      <AboutValuePropositions />
      <AboutResults />
      <AboutCertifications />
      <AboutPartnership />
      <AboutPartnerships />
    </div>
  );
};

export default AboutPage;
