import App from './App';
import AdminDashboard from './pages/AdminDashboard';
import AcceleratorsSingle from './pages/AcceleratorsSingle';

// Simple routing setup - can be replaced with React Router later
const AppRoutes = () => {
  const pathname = window.location.pathname;

  // Admin routes
  if (pathname.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  // Accelerators route (single page with tabs - Figma Node 76-414)
  if (pathname === '/accelerators' || pathname.startsWith('/accelerators/')) {
    return <AcceleratorsSingle />;
  }

  // Homepage (default)
  return <App />;
};

export default AppRoutes;

