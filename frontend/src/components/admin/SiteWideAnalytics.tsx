import '@/styles/components/admin/SiteWideAnalytics.css';

// Mock data
const siteWideData = {
  traffic: {
    totalVisitors: 45678,
    uniqueVisitors: 32456,
    pageViews: 128934,
    avgSessionDuration: '4:23',
    bounceRate: '32.5%',
    trend: '+12.3%'
  },
  sources: [
    { name: 'Direct', visitors: 18234, percentage: 40 },
    { name: 'MongoDB.com', visitors: 11356, percentage: 25 },
    { name: 'Google Search', visitors: 9123, percentage: 20 },
    { name: 'Social Media', visitors: 4567, percentage: 10 },
    { name: 'Referral', visitors: 2398, percentage: 5 }
  ],
  geography: [
    { country: 'United States', visitors: 20345, flag: '🇺🇸' },
    { country: 'United Kingdom', visitors: 8923, flag: '🇬🇧' },
    { country: 'Germany', visitors: 5678, flag: '🇩🇪' },
    { country: 'India', visitors: 4567, flag: '🇮🇳' },
    { country: 'Canada', visitors: 3456, flag: '🇨🇦' },
    { country: 'Australia', visitors: 2709, flag: '🇦🇺' }
  ],
  mongodbDomains: [
    { domain: 'mongodb.com/products', visitors: 5678, conversions: 234 },
    { domain: 'mongodb.com/docs', visitors: 3456, conversions: 156 },
    { domain: 'mongodb.com/community', visitors: 2222, conversions: 89 }
  ]
};

const SiteWideAnalytics = () => {
  return (
    <div className="site-wide-analytics">
      {/* Traffic Overview */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">📊</span>
          Traffic Overview
        </h3>
        <div className="metrics-grid">
          <div className="metric-card large">
            <div className="metric-label">Total Visitors</div>
            <div className="metric-value">{siteWideData.traffic.totalVisitors.toLocaleString()}</div>
            <div className="metric-trend positive">{siteWideData.traffic.trend} vs last month</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Unique Visitors</div>
            <div className="metric-value">{siteWideData.traffic.uniqueVisitors.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Page Views</div>
            <div className="metric-value">{siteWideData.traffic.pageViews.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg. Session</div>
            <div className="metric-value">{siteWideData.traffic.avgSessionDuration}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Bounce Rate</div>
            <div className="metric-value">{siteWideData.traffic.bounceRate}</div>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🎯</span>
          Traffic Sources
        </h3>
        <div className="sources-container">
          {siteWideData.sources.map((source, index) => (
            <div key={index} className="source-item">
              <div className="source-info">
                <span className="source-name">{source.name}</span>
                <span className="source-visitors">{source.visitors.toLocaleString()} visitors</span>
              </div>
              <div className="source-bar-container">
                <div 
                  className="source-bar"
                  style={{ width: `${source.percentage}%` }}
                ></div>
              </div>
              <span className="source-percentage">{source.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* MongoDB Domains */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🔗</span>
          MongoDB Domain Sources
        </h3>
        <div className="domain-table">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Visitors</th>
                <th>Conversions</th>
                <th>Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {siteWideData.mongodbDomains.map((domain, index) => (
                <tr key={index}>
                  <td className="domain-name">{domain.domain}</td>
                  <td>{domain.visitors.toLocaleString()}</td>
                  <td>{domain.conversions}</td>
                  <td className="conversion-rate">
                    {((domain.conversions / domain.visitors) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geography */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🌍</span>
          Geographic Distribution
        </h3>
        <div className="geography-grid">
          {siteWideData.geography.map((location, index) => (
            <div key={index} className="geography-card">
              <div className="geo-flag">{location.flag}</div>
              <div className="geo-info">
                <div className="geo-country">{location.country}</div>
                <div className="geo-visitors">{location.visitors.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SiteWideAnalytics;







