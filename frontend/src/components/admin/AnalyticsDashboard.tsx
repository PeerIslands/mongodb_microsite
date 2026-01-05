import { useState } from 'react';
import '@/styles/components/admin/AnalyticsDashboard.css';
import SiteWideAnalytics from './SiteWideAnalytics';
import PageLevelAnalytics from './PageLevelAnalytics';
import MonthlyReport from './MonthlyReport';

type AnalyticsView = 'overview' | 'pages' | 'monthly';

const AnalyticsDashboard = () => {
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');

  return (
    <div className="analytics-dashboard">
      {/* Analytics Header */}
      <div className="analytics-header">
        <div className="analytics-header-left">
          <h2 className="analytics-title">Analytics Dashboard</h2>
          <span className="date-range">Last 30 Days</span>
        </div>
        <div className="analytics-nav">
          <button
            className={`nav-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            Site-Wide
          </button>
          <button
            className={`nav-tab ${activeView === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveView('pages')}
          >
            Page-Level
          </button>
          <button
            className={`nav-tab ${activeView === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveView('monthly')}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {activeView === 'overview' && <SiteWideAnalytics />}
        {activeView === 'pages' && <PageLevelAnalytics />}
        {activeView === 'monthly' && <MonthlyReport />}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;







