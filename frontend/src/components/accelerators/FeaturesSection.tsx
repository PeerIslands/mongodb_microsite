import '@/styles/components/accelerators/FeaturesSection.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

const FeaturesSection = ({ features }: FeaturesSectionProps) => {
  return (
    <section className="features-section">
      <div className="features-container">
        <h2 className="section-heading">Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;







