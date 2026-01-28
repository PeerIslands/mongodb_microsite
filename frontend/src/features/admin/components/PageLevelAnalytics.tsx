import { useState, useEffect } from 'react';
import { analyticsService } from '@/api/services/analytics.service';
import '@/styles/features/admin/PageLevelAnalytics.css';

const PageLevelAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getPageLevel(30);
        setData(response);
      } catch (err) {
        console.error('Failed to fetch page level analytics:', err);
        setError('Failed to load page level analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-level-analytics">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading page analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-level-analytics">
        <div className="analytics-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-level-analytics">
        <div className="analytics-empty">No data available</div>
      </div>
    );
  }

  const pageLevelData = {
    scrollDepth: (data.scroll_depth || []).filter((item: any) => 
      !item.page?.startsWith('/admin') && item.page !== '/'
    ),
    ctaClicks: (data.cta_clicks || []).filter((item: any) => {
      const ctaName = item.cta || item.cta_name || '';
      return !ctaName.includes('Admin') && item.page !== '/';
    }),
    acceleratorEngagement: data.accelerator_engagement || []
  };

  return (
    <div className="page-level-analytics">
      {/* Scroll Depth */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">📜</span>
          Scroll Depth Analysis
        </h3>
        <div className="scroll-depth-container">
          {pageLevelData.scrollDepth.map((item: any, index: number) => {
            const avgDepth = item.avgDepth || 0;
            const completions = item.completions || 0;
            return (
              <div key={index} className="scroll-item">
                <div className="scroll-page">{item.page || 'Unknown'}</div>
                <div className="scroll-metrics">
                  <div className="scroll-bar-wrapper">
                    <div className="scroll-bar-bg">
                      <div 
                        className="scroll-bar-fill"
                        style={{ width: `${avgDepth}%` }}
                      >
                        <span className="scroll-percentage">{avgDepth}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="scroll-completions">{completions} completions</div>
                </div>
              </div>
            );
          })}
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
              </tr>
            </thead>
            <tbody>
              {pageLevelData.ctaClicks.map((cta: any, index: number) => {
                const clicks = cta.clicks || 0;
                return (
                  <tr key={index}>
                    <td className="cta-name">{cta.cta || 'Unknown'}</td>
                    <td>{cta.page || 'Unknown'}</td>
                    <td>{clicks.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accelerator Engagement */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">🚀</span>
          Accelerator Engagement
        </h3>
        <div className="accelerator-grid">
          {pageLevelData.acceleratorEngagement.map((acc: any, index: number) => (
            <div key={index} className="accelerator-card">
              <div className="acc-header">
                <h4 className="acc-name">{acc.name || 'Unknown'}</h4>
              </div>
              <div className="acc-stats">
                <div className="acc-stat">
                  <span className="acc-stat-label">Downloads</span>
                  <span className="acc-stat-value">{acc.downloads || 0}</span>
                </div>
                <div className="acc-stat">
                  <span className="acc-stat-label">Page Views</span>
                  <span className="acc-stat-value">{(acc.pageViews || 0).toLocaleString()}</span>
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

