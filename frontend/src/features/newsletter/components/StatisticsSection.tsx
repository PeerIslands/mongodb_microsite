import '../../../styles/features/newsletter/StatisticsSection.css';

export const StatisticsSection = () => {
  const stats = [
    { label: 'Active Projects', value: '50+', icon: '📊' },
    { label: 'Data Migrated', value: '10TB+', icon: '💾' },
    { label: 'Success Rate', value: '99%', icon: '✓' },
    { label: 'Client Satisfaction', value: '4.9/5', icon: '⭐' },
  ];

  return (
    <section className="statistics-section">
      <div className="section-header">
        <h2>Our Impact This Quarter</h2>
        <p>Real results driving business transformation</p>
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatisticsSection;
