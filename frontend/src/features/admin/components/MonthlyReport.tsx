import { useState, useEffect } from 'react';
import { analyticsService } from '@/api/services/analytics.service';
import '@/styles/features/admin/MonthlyReport.css';

const MonthlyReport = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current month and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  useEffect(() => {
    const fetchMonthlyReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getMonthlyReport(currentYear, currentMonth);
        setData(response);
      } catch (err) {
        console.error('Failed to fetch monthly report:', err);
        setError('Failed to load monthly report');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyReport();
  }, [currentYear, currentMonth]);

  if (loading) {
    return (
      <div className="monthly-report">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading monthly report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monthly-report">
        <div className="analytics-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="monthly-report">
        <div className="analytics-empty">No data available</div>
      </div>
    );
  }

  const monthlyData = {
    reportMonth: data.report_month || '',
    topPages: (data.top_pages || [])
      .filter((page: any) => 
        !page.page?.startsWith('/admin') && 
        !page.page?.startsWith('/profile') && 
        page.page !== '/'
      )
      .map((page: any, index: number) => ({
        ...page,
        rank: index + 1
      })),
    topDownloads: data.top_downloads || [],
    mostEngagingCaseStudy: data.most_engaging_case_study ? {
      ...data.most_engaging_case_study,
      views: data.most_engaging_case_study.views ?? 0,
      downloads: data.most_engaging_case_study.downloads ?? 0
    } : null,
    mostEngagingAccelerator: data.most_engaging_accelerator ? {
      ...data.most_engaging_accelerator,
      downloads: data.most_engaging_accelerator.downloads ?? 0
    } : null,
    mongodbDomainVisitors: data.mongodb_domain_visitors || []
  };

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
              </tr>
            </thead>
            <tbody>
              {monthlyData.topPages.map((page: any) => {
                const rank = page.rank || 0;
                const views = page.views || 0;
                return (
                  <tr key={rank}>
                    <td>
                      <span className={`rank-badge rank-${rank <= 3 ? 'top' : 'normal'}`}>
                        {rank}
                    </span>
                  </td>
                    <td className="page-name">{page.title || page.page || 'Unknown'}</td>
                    <td>{views.toLocaleString()}</td>
                </tr>
                );
              })}
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
          {monthlyData.topDownloads.map((item: any) => (
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
        {monthlyData.mostEngagingCaseStudy ? (
        <div className="highlight-card" key={`case-study-${monthlyData.mostEngagingCaseStudy.title}-${monthlyData.mostEngagingCaseStudy.views}-${monthlyData.mostEngagingCaseStudy.downloads}`}>
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
              <span className="metric-label">Downloads</span>
              <span className="metric-value">{monthlyData.mostEngagingCaseStudy.downloads.toLocaleString()}</span>
            </div>
          </div>
        </div>
        ) : (
        <div className="highlight-card">
          <div className="highlight-header">
              <span className="highlight-icon">⭐</span>
              <h4 className="highlight-title">Most Engaging Case Study</h4>
            </div>
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No case study data available yet</p>
          </div>
        )}

        {/* Most Engaging Accelerator */}
        {monthlyData.mostEngagingAccelerator ? (
          <div className="highlight-card" key={`accelerator-${monthlyData.mostEngagingAccelerator.title}-${monthlyData.mostEngagingAccelerator.downloads}`}>
            <div className="highlight-header">
              <span className="highlight-icon">🚀</span>
              <h4 className="highlight-title">Most Engaging Accelerator</h4>
            </div>
            <h3 className="highlight-content-title">{monthlyData.mostEngagingAccelerator.title || monthlyData.mostEngagingAccelerator.page}</h3>
          <div className="highlight-metrics">
            <div className="highlight-metric">
              <span className="metric-label">Downloads</span>
                <span className="metric-value">{monthlyData.mostEngagingAccelerator.downloads.toLocaleString()}</span>
            </div>
            </div>
          </div>
        ) : (
          <div className="highlight-card">
            <div className="highlight-header">
              <span className="highlight-icon">🚀</span>
              <h4 className="highlight-title">Most Engaging Accelerator</h4>
            </div>
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No accelerator data available yet</p>
          </div>
        )}
      </div>

      {/* Most Effective CTA */}
    </div>
  );
};

export default MonthlyReport;




