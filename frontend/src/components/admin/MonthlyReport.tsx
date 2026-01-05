import '@/styles/components/admin/MonthlyReport.css';

// Mock data for monthly report
const monthlyData = {
  reportMonth: 'December 2024',
  topPages: [
    { rank: 1, page: '/case-studies/healthcare-migration', views: 12456, avgTime: '5:34', bounceRate: 28.5 },
    { rank: 2, page: '/accelerators/migration-toolkit', views: 10892, avgTime: '6:12', bounceRate: 31.2 },
    { rank: 3, page: '/case-studies/fintech-modernization', views: 9234, avgTime: '4:56', bounceRate: 34.1 },
    { rank: 4, page: '/resources/guides/schema-design', views: 8567, avgTime: '7:23', bounceRate: 25.8 },
    { rank: 5, page: '/case-studies/ecommerce-scale', views: 7891, avgTime: '4:45', bounceRate: 36.4 },
    { rank: 6, page: '/accelerators/performance-analyzer', views: 7234, avgTime: '5:18', bounceRate: 29.7 },
    { rank: 7, page: '/resources/webinars/mongodb-atlas', views: 6789, avgTime: '8:45', bounceRate: 22.3 },
    { rank: 8, page: '/case-studies/retail-transformation', views: 6234, avgTime: '4:32', bounceRate: 38.2 },
    { rank: 9, page: '/accelerators/data-validator', views: 5891, avgTime: '5:01', bounceRate: 32.6 },
    { rank: 10, page: '/resources/guides/migration-best-practices', views: 5456, avgTime: '6:34', bounceRate: 27.9 }
  ],
  topDownloads: [
    { rank: 1, item: 'Healthcare Migration Case Study', downloads: 1234, convRate: 45.2 },
    { rank: 2, item: 'Migration Toolkit v2.3', downloads: 1089, convRate: 52.3 },
    { rank: 3, item: 'Schema Design Guide PDF', downloads: 892, convRate: 38.7 },
    { rank: 4, item: 'Fintech Modernization Case Study', downloads: 767, convRate: 41.5 },
    { rank: 5, item: 'Performance Analyzer Tool', downloads: 678, convRate: 48.9 },
    { rank: 6, item: 'E-commerce Scaling Case Study', downloads: 589, convRate: 36.4 },
    { rank: 7, item: 'Data Validator Tool', downloads: 534, convRate: 44.2 },
    { rank: 8, item: 'MongoDB Atlas Migration Guide', downloads: 489, convRate: 39.8 },
    { rank: 9, item: 'Retail Transformation Case Study', downloads: 445, convRate: 42.1 },
    { rank: 10, item: 'Best Practices Checklist', downloads: 398, convRate: 35.6 }
  ],
  mostEngagingCaseStudy: {
    title: 'Healthcare Provider Data Migration',
    views: 12456,
    avgTime: '5:34',
    downloads: 1234,
    shareRate: 18.5,
    score: 9.2
  },
  mostWatchedWebinar: {
    title: 'MongoDB Atlas: Enterprise Migration Strategies',
    views: 6789,
    avgWatchTime: '32:45',
    completionRate: 67.8,
    downloads: 892,
    score: 8.9
  },
  acceleratorPerformance: [
    { name: 'Migration Toolkit', downloads: 1089, usage: 2345, satisfaction: 4.6 },
    { name: 'Performance Analyzer', downloads: 678, usage: 1892, satisfaction: 4.5 },
    { name: 'Schema Designer', downloads: 534, usage: 1567, satisfaction: 4.3 },
    { name: 'Data Validator', downloads: 534, usage: 1234, satisfaction: 4.4 }
  ],
  visitorSources: {
    mongodbDomains: 11356,
    direct: 18234,
    search: 9123,
    social: 4567,
    referral: 2398
  },
  topMongoDBSources: [
    { domain: 'mongodb.com/products', visitors: 5678, conversions: 234 },
    { domain: 'mongodb.com/docs', visitors: 3456, conversions: 156 },
    { domain: 'mongodb.com/community', visitors: 2222, conversions: 89 }
  ],
  mostEffectiveCTA: {
    name: 'Download Case Study',
    clicks: 1234,
    conversions: 456,
    conversionRate: 36.9,
    revenue: '$45,600'
  },
  conversionFunnel: [
    { stage: 'Landing', visitors: 45678, dropRate: 0 },
    { stage: 'Engaged (>30s)', visitors: 32456, dropRate: 29 },
    { stage: 'Content View', visitors: 18234, dropRate: 44 },
    { stage: 'CTA Click', visitors: 5678, dropRate: 69 },
    { stage: 'Conversion', visitors: 1234, dropRate: 78 }
  ],
  pageSpeed: {
    avgLoadTime: '1.2s',
    mobileScore: 92,
    desktopScore: 96,
    largestContentfulPaint: '1.8s',
    firstInputDelay: '12ms',
    cumulativeLayoutShift: '0.05'
  }
};

const MonthlyReport = () => {
  return (
    <div className="monthly-report">
      {/* Report Header */}
      <div className="report-header-card">
        <div className="report-title-section">
          <h3 className="report-month">{monthlyData.reportMonth}</h3>
          <p className="report-subtitle">Monthly Performance Snapshot</p>
        </div>
        <button className="export-button">
          <span>📊</span>
          Export Report
        </button>
      </div>

      {/* Top 10 Pages */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🏆</span>
          Top 10 Pages
        </h3>
        <div className="top-table-container">
          <table className="top-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Page</th>
                <th>Views</th>
                <th>Avg. Time</th>
                <th>Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.topPages.map((page) => (
                <tr key={page.rank}>
                  <td>
                    <span className={`rank-badge rank-${page.rank <= 3 ? 'top' : 'normal'}`}>
                      {page.rank}
                    </span>
                  </td>
                  <td className="page-name">{page.page}</td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>{page.avgTime}</td>
                  <td>
                    <span className={`bounce-rate ${page.bounceRate < 30 ? 'good' : page.bounceRate < 40 ? 'medium' : 'high'}`}>
                      {page.bounceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Downloads */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">📥</span>
          Top 10 Downloads
        </h3>
        <div className="downloads-grid">
          {monthlyData.topDownloads.map((item) => (
            <div key={item.rank} className="download-card">
              <div className="download-rank">#{item.rank}</div>
              <div className="download-info">
                <h4 className="download-name">{item.item}</h4>
                <div className="download-stats">
                  <span className="download-count">{item.downloads} downloads</span>
                  <span className="download-conversion">{item.convRate}% conv.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlighted Content */}
      <div className="highlights-row">
        {/* Most Engaging Case Study */}
        <div className="highlight-card">
          <div className="highlight-header">
            <span className="highlight-icon">⭐</span>
            <h4 className="highlight-title">Most Engaging Case Study</h4>
          </div>
          <h3 className="highlight-content-title">{monthlyData.mostEngagingCaseStudy.title}</h3>
          <div className="highlight-metrics">
            <div className="highlight-metric">
              <span className="metric-label">Views</span>
              <span className="metric-value">{monthlyData.mostEngagingCaseStudy.views.toLocaleString()}</span>
            </div>
            <div className="highlight-metric">
              <span className="metric-label">Avg. Time</span>
              <span className="metric-value">{monthlyData.mostEngagingCaseStudy.avgTime}</span>
            </div>
            <div className="highlight-metric">
              <span className="metric-label">Downloads</span>
              <span className="metric-value">{monthlyData.mostEngagingCaseStudy.downloads}</span>
            </div>
          </div>
          <div className="highlight-score">Score: {monthlyData.mostEngagingCaseStudy.score}/10</div>
        </div>

        {/* Most Watched Webinar */}
        <div className="highlight-card">
          <div className="highlight-header">
            <span className="highlight-icon">🎥</span>
            <h4 className="highlight-title">Most Watched Webinar</h4>
          </div>
          <h3 className="highlight-content-title">{monthlyData.mostWatchedWebinar.title}</h3>
          <div className="highlight-metrics">
            <div className="highlight-metric">
              <span className="metric-label">Views</span>
              <span className="metric-value">{monthlyData.mostWatchedWebinar.views.toLocaleString()}</span>
            </div>
            <div className="highlight-metric">
              <span className="metric-label">Avg. Watch</span>
              <span className="metric-value">{monthlyData.mostWatchedWebinar.avgWatchTime}</span>
            </div>
            <div className="highlight-metric">
              <span className="metric-label">Completion</span>
              <span className="metric-value">{monthlyData.mostWatchedWebinar.completionRate}%</span>
            </div>
          </div>
          <div className="highlight-score">Score: {monthlyData.mostWatchedWebinar.score}/10</div>
        </div>
      </div>

      {/* Accelerator Performance */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🚀</span>
          Accelerator Content Performance
        </h3>
        <div className="accelerator-performance-grid">
          {monthlyData.acceleratorPerformance.map((acc, index) => (
            <div key={index} className="acc-performance-card">
              <h4 className="acc-perf-name">{acc.name}</h4>
              <div className="acc-perf-metrics">
                <div className="acc-perf-row">
                  <span>Downloads</span>
                  <span className="acc-perf-value">{acc.downloads}</span>
                </div>
                <div className="acc-perf-row">
                  <span>Active Usage</span>
                  <span className="acc-perf-value">{acc.usage.toLocaleString()}</span>
                </div>
                <div className="acc-perf-row">
                  <span>Satisfaction</span>
                  <span className="acc-perf-value">
                    ⭐ {acc.satisfaction}/5
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MongoDB Sources & Most Effective CTA */}
      <div className="two-column-section">
        <div className="analytics-section half-width">
          <h3 className="section-heading">
            <span className="section-icon">🔗</span>
            MongoDB Domain Sources
          </h3>
          <div className="mongodb-sources">
            {monthlyData.topMongoDBSources.map((source, index) => (
              <div key={index} className="mongodb-source-item">
                <span className="source-domain">{source.domain}</span>
                <div className="source-stats">
                  <span>{source.visitors.toLocaleString()} visitors</span>
                  <span className="conversions-chip">{source.conversions} conv.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-section half-width">
          <h3 className="section-heading">
            <span className="section-icon">🎯</span>
            Most Effective CTA
          </h3>
          <div className="effective-cta-card">
            <h4 className="cta-card-name">{monthlyData.mostEffectiveCTA.name}</h4>
            <div className="cta-card-metrics">
              <div className="cta-metric">
                <span className="cta-metric-value">{monthlyData.mostEffectiveCTA.clicks.toLocaleString()}</span>
                <span className="cta-metric-label">Clicks</span>
              </div>
              <div className="cta-metric">
                <span className="cta-metric-value">{monthlyData.mostEffectiveCTA.conversions}</span>
                <span className="cta-metric-label">Conversions</span>
              </div>
              <div className="cta-metric">
                <span className="cta-metric-value success">{monthlyData.mostEffectiveCTA.conversionRate}%</span>
                <span className="cta-metric-label">Conv. Rate</span>
              </div>
            </div>
            <div className="cta-revenue">Est. Revenue: {monthlyData.mostEffectiveCTA.revenue}</div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">📊</span>
          Conversion Funnel Metrics
        </h3>
        <div className="funnel-container">
          {monthlyData.conversionFunnel.map((stage, index) => (
            <div key={index} className="funnel-stage">
              <div className="funnel-stage-header">
                <span className="funnel-stage-name">{stage.stage}</span>
                <span className="funnel-visitors">{stage.visitors.toLocaleString()}</span>
              </div>
              <div className="funnel-bar-container">
                <div 
                  className="funnel-bar"
                  style={{ width: `${100 - stage.dropRate}%` }}
                ></div>
              </div>
              {stage.dropRate > 0 && (
                <span className="funnel-drop">-{stage.dropRate}% drop</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Page Speed & Performance */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">⚡</span>
          Page Speed & Performance
        </h3>
        <div className="performance-grid">
          <div className="perf-card">
            <div className="perf-label">Avg. Load Time</div>
            <div className="perf-value large">{monthlyData.pageSpeed.avgLoadTime}</div>
          </div>
          <div className="perf-card">
            <div className="perf-label">Mobile Score</div>
            <div className="perf-value">{monthlyData.pageSpeed.mobileScore}/100</div>
            <div className="perf-bar">
              <div className="perf-bar-fill" style={{ width: `${monthlyData.pageSpeed.mobileScore}%` }}></div>
            </div>
          </div>
          <div className="perf-card">
            <div className="perf-label">Desktop Score</div>
            <div className="perf-value">{monthlyData.pageSpeed.desktopScore}/100</div>
            <div className="perf-bar">
              <div className="perf-bar-fill" style={{ width: `${monthlyData.pageSpeed.desktopScore}%` }}></div>
            </div>
          </div>
          <div className="perf-card">
            <div className="perf-label">LCP</div>
            <div className="perf-value small">{monthlyData.pageSpeed.largestContentfulPaint}</div>
          </div>
          <div className="perf-card">
            <div className="perf-label">FID</div>
            <div className="perf-value small">{monthlyData.pageSpeed.firstInputDelay}</div>
          </div>
          <div className="perf-card">
            <div className="perf-label">CLS</div>
            <div className="perf-value small">{monthlyData.pageSpeed.cumulativeLayoutShift}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;







