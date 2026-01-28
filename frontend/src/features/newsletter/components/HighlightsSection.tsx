import '../../../styles/features/newsletter/HighlightsSection.css';
import { ContentSection } from './ContentSection';

export const HighlightsSection = () => {
  const highlights = [
    {
      title: 'New Migration Accelerators',
      description: 'Launch of HBase to MongoDB migration accelerator with 60% faster migration times.',
      date: 'January 2026',
    },
    {
      title: 'Partnership Expansion',
      description: 'Extended partnership to include AI-powered data optimization tools.',
      date: 'January 2026',
    },
    {
      title: 'Customer Success Story',
      description: 'Major retail client achieved 40% cost reduction through MongoDB migration.',
      date: 'December 2025',
    },
  ];

  return (
    <ContentSection 
      title="Newsletter Highlights" 
      subtitle="Latest updates from MongoDB and PeerAI partnership"
    >
      <div className="highlights-list">
        {highlights.map((highlight, index) => (
          <div key={index} className="highlight-card">
            <div className="highlight-date">{highlight.date}</div>
            <h3 className="highlight-title">{highlight.title}</h3>
            <p className="highlight-description">{highlight.description}</p>
          </div>
        ))}
      </div>
    </ContentSection>
  );
};

export default HighlightsSection;
