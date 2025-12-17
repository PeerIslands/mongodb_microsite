import { Outlet, Link } from 'react-router-dom';
import '@/styles/layouts/AdminLayout.css';
import image2 from '@/assets/image 2.png';
import image3 from '@/assets/image 3.png';
import line1 from '@/assets/Line 1.png';

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
            <div className="logo-image-container">
              <img src={image2} alt="PeerAI" className="logo-image logo-image-2" />
            </div>
            <div className="logo-separator">
              <img src={line1} alt="" className="separator-line" />
            </div>
            <div className="logo-image-container">
              <img src={image3} alt="MongoDB" className="logo-image logo-image-3" />
            </div>
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

