import { Outlet, Link } from 'react-router-dom';
import '@/styles/layouts/AdminLayout.css';
// Pre-import admin component CSS to prevent flash of unstyled content during lazy loading
import '@/styles/pages/AdminDashboardPage.css';
import '@/styles/features/admin/CaseStudyList.css';
import '@/styles/features/admin/AcceleratorList.css';
import '@/styles/features/admin/BlogList.css';
import '@/styles/features/admin/AnalyticsDashboard.css';
import logo from '@/assets/logo.svg';

/**
 * Admin layout with header and sidebar
 */
const AdminLayout = () => {
  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo-section">
            <img src={logo} alt="PeerAI X MongoDB" className="logo-image" />
          </div>
          
          <div className="admin-title">
            <span className="admin-badge">Admin</span>
            <h1>Content Manager</h1>
          </div>
          
          <div className="admin-actions">
            <Link to="/" className="view-site-link">View Site</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

