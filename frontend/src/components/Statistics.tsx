import '@/styles/components/Statistics.css';

const Statistics = () => {
  const stats = [
    { value: '50+', label: 'Enterprise Migrations Delivered', size: 'large', highlight: false },
    { value: '30%', label: 'Average TCO Reduction', size: 'large', highlight: true },
    { value: '100TB+', label: 'Data Migrated to Atlas', size: 'large', highlight: false },
    { value: 'Global', label: 'Delivery & Support Teams', size: 'large', highlight: false },
    { value: '10+', label: 'Proprietary Accelerators', size: 'medium', highlight: false },
    { value: 'Zero', label: 'Downtime during Cutover', size: 'medium', highlight: false },
    { value: '2 Weeks', label: 'Typical Discovery Phase', size: 'medium', highlight: false },
    { value: 'Certified', label: 'MongoDB Premier Partner', size: 'medium', highlight: false },
  ];

  return (
    <section className="statistics">
      <div className="statistics-content">
        <div className="statistics-header">
          <h2 className="section-title">Modernization at Speed and Scale</h2>
          <p className="section-description">
            We don't just move data; we transform business capabilities. Peerislands leverages automated discovery and schema conversion tools to deliver MongoDB migrations 30% faster than traditional methods, ensuring zero data loss and immediate performance gains from Day 1.
          </p>
        </div>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.highlight ? 'stat-card-highlight' : ''}`}>
              <div className={`stat-value stat-value-${stat.size}`}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
          <div className="stat-divider stat-divider-vertical stat-divider-1"></div>
          <div className="stat-divider stat-divider-vertical stat-divider-2"></div>
          <div className="stat-divider stat-divider-vertical stat-divider-3"></div>
          <div className="stat-divider stat-divider-horizontal"></div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;


