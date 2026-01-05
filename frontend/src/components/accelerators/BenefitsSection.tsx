import '@/styles/components/accelerators/BenefitsSection.css';

interface Benefit {
  title: string;
  metric: string;
  description: string;
  category: string;
}

interface BenefitsSectionProps {
  benefits: Benefit[];
}

const BenefitsSection = ({ benefits }: BenefitsSectionProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Time': return '#5b6cff';
      case 'Cost': return '#00ff88';
      case 'Performance': return '#ffa500';
      case 'Risk': return '#ff5252';
      default: return '#5b6cff';
    }
  };

  return (
    <section className="benefits-section">
      <div className="benefits-container">
        <h2 className="section-heading">Key Benefits</h2>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="benefit-card"
              style={{ '--category-color': getCategoryColor(benefit.category) } as React.CSSProperties}
            >
              <div className="benefit-category">{benefit.category}</div>
              <div className="benefit-metric">{benefit.metric}</div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;







