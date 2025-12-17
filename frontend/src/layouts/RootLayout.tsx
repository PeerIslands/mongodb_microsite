import { Outlet } from 'react-router-dom';
import '@/styles/layouts/RootLayout.css';

/**
 * Root layout wrapper for all pages
 */
const RootLayout = () => {
  return (
    <div className="root-layout">
      <Outlet />
    </div>
  );
};

export default RootLayout;

