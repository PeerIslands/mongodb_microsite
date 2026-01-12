import { Outlet } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import '@/styles/layouts/RootLayout.css';
import { ReactNode } from 'react';

/**
 * Root layout wrapper for all pages
 */
const RootLayout = ({ children }: { children?: ReactNode }) => {
  return (
    <ToastProvider>
      <div className="root-layout">
        {children || <Outlet />}
        <ToastContainer />
      </div>
    </ToastProvider>
  );
};

export default RootLayout;

