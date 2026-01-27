import { useState, useEffect } from 'react';
import { analyticsService } from '@/api/services/analytics.service';
import '@/styles/features/admin/UserActivity.css';

const UserActivity = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: 'all',
    days: 7,
  });

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getUserActivity(filters.days, filters.eventType);
        
        // Filter out ALL admin page activity (page views, scrolls, CTAs, etc.)
        const filteredActivities = response.activities.filter((activity: any) => {
          // Remove anything from /admin page
          if (activity.page_path === '/admin') {
            return false;
          }
          // Remove admin-related CTA clicks
          if (activity.event_type === 'cta_click' && activity.cta_name?.includes('Admin')) {
            return false;
          }
          // Remove CTA clicks from homepage
          if (activity.event_type === 'cta_click' && activity.page_path === '/') {
            return false;
          }
          // Remove scroll events from homepage
          if (activity.event_type === 'scroll_depth' && activity.page_path === '/') {
            return false;
          }
          return true;
        });
        
        setData({ ...response, activities: filteredActivities });
      } catch (err) {
        console.error('Failed to fetch user activity:', err);
        setError('Failed to load user activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [filters]);

  const formatTimestamp = (timestamp: string) => {
    // Parse the UTC timestamp
    const utcDate = new Date(timestamp);
    
    // Convert to IST by adding 5 hours 30 minutes (IST = UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(utcDate.getTime() + istOffset);
    
    // Extract components
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = istDate.getUTCDate();
    const month = months[istDate.getUTCMonth()];
    let hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${day} ${month}, ${hours}:${minutesStr} ${ampm} IST`;
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      download: 'Download',
      page_view: 'Page View',
      cta_click: 'CTA Click',
      form_submit: 'Form Submit',
      scroll_depth: 'Scrolled',
    };
    return labels[eventType] || eventType;
  };

  if (loading) {
    return (
      <div className="user-activity">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading user activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-activity">
        <div className="analytics-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const activities = data?.activities || [];

  return (
    <div className="user-activity">
      {/* Filters */}
      <div className="activity-filters">
        <div className="filter-group">
          <label>Time Period:</label>
          <select
            value={filters.days}
            onChange={(e) => setFilters({ ...filters, days: Number(e.target.value) })}
            className="filter-select"
          >
            <option value={1}>Last 24 Hours</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Event Type:</label>
          <select
            value={filters.eventType}
            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Events</option>
            <option value="download">Downloads</option>
            <option value="page_view">Page Views</option>
            <option value="cta_click">CTA Clicks</option>
            <option value="form_submit">Form Submissions</option>
          </select>
        </div>
        <div className="activity-count">
          <span>{activities.length} events</span>
        </div>
      </div>

      {/* Activity Table */}
      <div className="activity-table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Event</th>
              <th>Page</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.length > 0 ? (
              activities
                .filter((activity: any) => 
                  !activity.page_path?.startsWith('/admin') && 
                  !activity.page_path?.startsWith('/profile') &&
                  !activity.page_path?.startsWith('/contact')
                )
                .map((activity: any, index: number) => (
                <tr key={index}>
                  <td className="user-cell">
                    <div className="user-info">
                      <span className="user-email">
                        {activity.user_email || (activity.user_id ? `User ${activity.user_id.substring(0, 8)}...` : 'Anonymous')}
                      </span>
                      {activity.user_id && (
                        <span className="user-id" title={activity.user_id}>{activity.user_id}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="event-badge">
                      <span className="event-label">{getEventLabel(activity.event_type)}</span>
                    </div>
                  </td>
                  <td className="page-cell">{activity.page_title || activity.page_path || '-'}</td>
                  <td className="time-cell">{formatTimestamp(activity.timestamp)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No user activity found for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserActivity;

