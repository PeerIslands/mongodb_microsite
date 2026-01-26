import '../../../styles/features/newsletter/FeaturedContent.css';
import { ContentSection } from './ContentSection';

export const FeaturedContent = () => {
  const featured = [
    {
      type: 'Case Study',
      title: 'Financial Services Leader Modernizes with MongoDB',
      description: 'Learn how a Fortune 500 financial institution migrated from legacy systems to MongoDB Atlas, achieving 3x performance improvement and 50% cost reduction.',
      cta: 'Read Case Study',
    },
    {
      type: 'Webinar',
      title: 'Migrating from HBase to MongoDB: Best Practices',
      description: 'Join our experts for an in-depth discussion on migration strategies, common pitfalls, and success patterns.',
      cta: 'Register Now',
    },
    {
      type: 'White Paper',
      title: 'The ROI of Modern Data Architecture',
      description: 'Discover the financial impact of migrating to MongoDB. Includes real-world case studies and TCO analysis.',
      cta: 'Download PDF',
    },
  ];

  return (
    <ContentSection 
      title="Featured Resources" 
      subtitle="Explore our latest content"
    >
      <div className="featured-grid">
        {featured.map((item, index) => (
          <div key={index} className="featured-card">
            <div className="featured-type">{item.type}</div>
            <h3 className="featured-title">{item.title}</h3>
            <p className="featured-description">{item.description}</p>
            <button className="featured-cta">{item.cta}</button>
          </div>
        ))}
      </div>
    </ContentSection>
  );
};

export default FeaturedContent;
