import { useState, useEffect } from 'react';
import '@/styles/features/home/Statistics.css';

const Statistics = () => {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  
  const stats = [
    { value: '100+', label: 'Enterprise Migrations Delivered', size: 'large' },
    { value: '30%', label: 'Average TCO Reduction', size: 'large' },
    { value: '100TB+', label: 'Data Migrated to Atlas', size: 'large' },
    { value: 'Global', label: 'Delivery & Support Teams', size: 'large' },
    { value: '10+', label: 'Proprietary Accelerators', size: 'medium' },
    { value: 'Near Zero', label: 'Downtime during Cutover', size: 'medium' },
    { value: '2 Weeks', label: 'Typical Discovery Phase', size: 'medium' },
    { value: 'Certified', label: 'MongoDB Premier Partner', size: 'medium' },
  ];

  // Auto-rotate stats in circular display (mobile/tablet only)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % stats.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <section className="statistics">
      <div className="statistics-content">
        <div className="statistics-header">
          <h2 className="section-title">Modernization at Speed and Scale</h2>
          <p className="section-description">
            We don't just move data; we transform business capabilities. Peerislands leverages automated discovery and schema conversion tools to deliver MongoDB migrations 30% faster than traditional methods, ensuring zero data loss and immediate performance gains from Day 1.
          </p>
        </div>
        
        {/* Desktop Grid - shown only on desktop */}
        <div className="stats-grid stats-grid-desktop">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className={`stat-value stat-value-${stat.size}`}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
          <div className="stat-divider stat-divider-vertical stat-divider-1"></div>
          <div className="stat-divider stat-divider-vertical stat-divider-2"></div>
          <div className="stat-divider stat-divider-vertical stat-divider-3"></div>
          <div className="stat-divider stat-divider-horizontal"></div>
        </div>

        {/* Mobile/Tablet Circular Display */}
        <div className="stats-circle-container stats-circle-mobile">
          <div className="stats-circle">
            <div className="stats-circle-content">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`stat-circle-item ${index === currentStatIndex ? 'active' : ''}`}
                >
                  <div className="stat-circle-value">{stat.value}</div>
                  <div className="stat-circle-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dots indicator */}
          <div className="stats-circle-dots">
            {stats.map((_, index) => (
              <button
                key={index}
                className={`stats-circle-dot ${index === currentStatIndex ? 'active' : ''}`}
                onClick={() => setCurrentStatIndex(index)}
                aria-label={`Go to stat ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;


