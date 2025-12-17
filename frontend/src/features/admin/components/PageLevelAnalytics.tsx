import '@/styles/features/admin/PageLevelAnalytics.css';

// Mock data
const pageLevelData = {
  scrollDepth: [
    { page: '/case-studies/healthcare', avgDepth: 85, completions: 234 },
    { page: '/accelerators/migration-toolkit', avgDepth: 72, completions: 189 },
    { page: '/case-studies/fintech', avgDepth: 68, completions: 156 },
    { page: '/resources/webinars', avgDepth: 55, completions: 98 }
  ],
  ctaClicks: [
    { cta: 'Download Case Study', clicks: 1234, conversions: 456, page: 'Case Studies' },
    { cta: 'Request Demo', clicks: 892, conversions: 234, page: 'Homepage' },
    { cta: 'Try Accelerator', clicks: 567, conversions: 178, page: 'Accelerators' },
    { cta: 'Watch Webinar', clicks: 445, conversions: 389, page: 'Resources' },
    { cta: 'Contact Sales', clicks: 389, conversions: 89, page: 'All Pages' }
  ],
  engagementTime: [
    { page: '/case-studies/healthcare', avgTime: '5:23', sessions: 2345 },
    { page: '/case-studies/e-commerce', avgTime: '4:45', sessions: 1892 },
    { page: '/accelerators/data-migration', avgTime: '4:12', sessions: 1567 },
    { page: '/resources/guides', avgTime: '3:56', sessions: 1234 }
  ],
  dropOffs: [
    { page: '/case-studies', exitRate: 45.2, visitors: 3456 },
    { page: '/accelerators', exitRate: 38.7, visitors: 2891 },
    { page: '/contact', exitRate: 72.3, visitors: 1567 },
    { page: '/resources', exitRate: 34.5, visitors: 2234 }
  ],
  acceleratorEngagement: [
    { name: 'Migration Toolkit', downloads: 892, pageViews: 3456, avgTime: '6:23' },
    { name: 'Schema Designer', downloads: 678, pageViews: 2891, avgTime: '5:45' },
    { name: 'Performance Analyzer', downloads: 534, pageViews: 2234, avgTime: '4:56' },
    { name: 'Data Validator', downloads: 423, pageViews: 1789, avgTime: '4:12' }
  ]
};

const PageLevelAnalytics = () => {
  return (
    <div className="page-level-analytics">
      {/* Scroll Depth */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">📜</span>
          Scroll Depth Analysis
        </h3>
        <div className="scroll-depth-container">
          {pageLevelData.scrollDepth.map((item, index) => (
            <div key={index} className="scroll-item">
              <div className="scroll-page">{item.page}</div>
              <div className="scroll-metrics">
                <div className="scroll-bar-wrapper">
                  <div className="scroll-bar-bg">
                    <div 
                      className="scroll-bar-fill"
                      style={{ width: `${item.avgDepth}%` }}
                    >
                      <span className="scroll-percentage">{item.avgDepth}%</span>
                    </div>
                  </div>
                </div>
                <div className="scroll-completions">{item.completions} completions</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Clicks */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🎯</span>
          CTA Performance
        </h3>
        <div className="cta-table-container">
          <table className="cta-table">
            <thead>
              <tr>
                <th>CTA</th>
                <th>Location</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {pageLevelData.ctaClicks.map((cta, index) => (
                <tr key={index}>
                  <td className="cta-name">{cta.cta}</td>
                  <td>{cta.page}</td>
                  <td>{cta.clicks.toLocaleString()}</td>
                  <td>{cta.conversions.toLocaleString()}</td>
                  <td>
                    <span className="conversion-badge">
                      {((cta.conversions / cta.clicks) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engagement Time */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">⏱️</span>
          Engagement Time
        </h3>
        <div className="engagement-grid">
          {pageLevelData.engagementTime.map((item, index) => (
            <div key={index} className="engagement-card">
              <div className="engagement-page">{item.page}</div>
              <div className="engagement-time">{item.avgTime}</div>
              <div className="engagement-sessions">{item.sessions.toLocaleString()} sessions</div>
            </div>
          ))}
        </div>
      </div>

      {/* Drop-offs */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🚪</span>
          Drop-off Analysis
        </h3>
        <div className="dropoff-container">
          {pageLevelData.dropOffs.map((item, index) => (
            <div key={index} className="dropoff-item">
              <div className="dropoff-info">
                <span className="dropoff-page">{item.page}</span>
                <span className="dropoff-visitors">{item.visitors.toLocaleString()} visitors</span>
              </div>
              <div className="dropoff-rate-container">
                <div className="dropoff-rate-bar">
                  <div 
                    className={`dropoff-rate-fill ${item.exitRate > 60 ? 'high' : item.exitRate > 40 ? 'medium' : 'low'}`}
                    style={{ width: `${item.exitRate}%` }}
                  ></div>
                </div>
                <span className="dropoff-percentage">{item.exitRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accelerator Engagement */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🚀</span>
          Accelerator Engagement
        </h3>
        <div className="accelerator-grid">
          {pageLevelData.acceleratorEngagement.map((acc, index) => (
            <div key={index} className="accelerator-card">
              <div className="acc-header">
                <h4 className="acc-name">{acc.name}</h4>
              </div>
              <div className="acc-stats">
                <div className="acc-stat">
                  <span className="acc-stat-label">Downloads</span>
                  <span className="acc-stat-value">{acc.downloads}</span>
                </div>
                <div className="acc-stat">
                  <span className="acc-stat-label">Page Views</span>
                  <span className="acc-stat-value">{acc.pageViews.toLocaleString()}</span>
                </div>
                <div className="acc-stat">
                  <span className="acc-stat-label">Avg. Time</span>
                  <span className="acc-stat-value">{acc.avgTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageLevelAnalytics;

