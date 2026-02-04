import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/features/home/components/Header';
import Footer from '@/features/home/components/Footer';
import '@/styles/layouts/MainLayout.css';

/**
 * Main layout with header and footer for public pages
 */
const MainLayout = () => {
  const location = useLocation();
  
  // Check if current route is the calendar download page
  const isCalendarDownloadPage = /^\/events\/[^/]+\/calendar$/.test(location.pathname);

  return (
    <div className="main-layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      {/* Hide footer on calendar download page */}
      {!isCalendarDownloadPage && <Footer />}
    </div>
  );
};

export default MainLayout;

