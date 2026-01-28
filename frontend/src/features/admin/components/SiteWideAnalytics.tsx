import { useState, useEffect } from 'react';
import { analyticsService } from '@/api/services/analytics.service';
import '@/styles/features/admin/SiteWideAnalytics.css';

const SiteWideAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getSiteWide(30);
        setData(response);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="site-wide-analytics">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="site-wide-analytics">
        <div className="analytics-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="site-wide-analytics">
        <div className="analytics-empty">No data available</div>
      </div>
    );
  }

  const siteWideData = {
    traffic: data.traffic || {},
    userDomains: data.user_domains || []
  };

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
            <div className="metric-value">{(siteWideData.traffic.totalVisitors || 0).toLocaleString()}</div>
            <div className="metric-trend positive">{siteWideData.traffic.trend || '+0%'} vs last month</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Unique Visitors</div>
            <div className="metric-value">{(siteWideData.traffic.uniqueVisitors || 0).toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Page Views</div>
            <div className="metric-value">{(siteWideData.traffic.pageViews || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* User Domains */}
      <div className="analytics-section">
        <h3 className="section-heading">
          <span className="section-icon">📧</span>
          User Email Domains
        </h3>
        <div className="domain-table">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>User Count</th>
              </tr>
            </thead>
            <tbody>
              {(siteWideData.userDomains || []).length > 0 ? (
                siteWideData.userDomains.map((domain: any, index: number) => {
                  const userCount = domain.user_count || domain.userCount || 0;
                  return (
                    <tr key={index}>
                      <td className="domain-name">{domain.domain || 'Unknown'}</td>
                      <td>{userCount}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No user domains yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SiteWideAnalytics;

