import { Outlet } from 'react-router-dom';
import Header from '@/features/home/components/Header';
import Footer from '@/features/home/components/Footer';
import '@/styles/layouts/MainLayout.css';

/**
 * Main layout with header and footer for public pages
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

