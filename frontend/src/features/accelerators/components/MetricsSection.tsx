import '@/styles/features/accelerators/MetricsSection.css';
import type { MetricItem } from '@/types/models/accelerator';

interface MetricsSectionProps {
  metrics: MetricItem[];
}

const MetricsSection = ({ metrics }: MetricsSectionProps) => {
  return (
    <section className="metrics-section">
      <div className="metrics-container">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <h3 className="metric-value">{metric.value}</h3>
            <p className="metric-description">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MetricsSection;
