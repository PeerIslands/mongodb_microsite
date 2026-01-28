import { Link, useNavigate } from 'react-router-dom';
import '@/styles/pages/NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-animation">
          <div className="error-code">404</div>
          <div className="error-glow"></div>
        </div>
        
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-description">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="not-found-actions">
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path 
                d="M10 3L2 10H5V17H9V13H11V17H15V10H18L10 3Z" 
                fill="currentColor"
              />
            </svg>
            Go Home
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => navigate(-1)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path 
                d="M15 10H5M5 10L10 15M5 10L10 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Go Back
          </button>
        </div>

        <div className="not-found-links">
          <p className="links-title">Popular pages:</p>
          <div className="links-grid">
            <Link to="/" className="page-link">Home</Link>
            <Link to="/accelerators" className="page-link">Accelerators</Link>
            <Link to="/success-stories" className="page-link">Success Stories</Link>
            <Link to="/insights" className="page-link">Insights</Link>
          </div>
        </div>
      </div>

      {/* Background decorations */}
      <div className="bg-decoration decoration-1"></div>
      <div className="bg-decoration decoration-2"></div>
      <div className="bg-decoration decoration-3"></div>
    </div>
  );
};

export default NotFoundPage;

