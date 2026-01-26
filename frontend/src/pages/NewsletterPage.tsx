import {
  NewsletterHeader,
  CompanyLogosSection,
  StatisticsSection,
  HighlightsSection,
  FeaturedContent,
  NewsletterFooter,
} from '@/features/newsletter/components';
import '@/styles/pages/NewsletterPage.css';

/**
 * Newsletter Page - Display newsletter content and updates
 */
const NewsletterPage = () => {
  return (
    <div className="newsletter-page">
      <NewsletterHeader />
      <div className="newsletter-content">
        <CompanyLogosSection />
        <StatisticsSection />
        <HighlightsSection />
        <FeaturedContent />
      </div>
      <NewsletterFooter />
    </div>
  );
};

export default NewsletterPage;
