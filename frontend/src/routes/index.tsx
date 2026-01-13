import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout, MainLayout, AdminLayout } from '@/layouts';
import { ROUTES } from '@/constants';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AcceleratorsPage = lazy(() => import('@/pages/AcceleratorsPage'));
const AcceleratorDetailPage = lazy(() => import('@/pages/AcceleratorDetailPage'));
const CaseStudiesPage = lazy(() => import('@/pages/CaseStudiesPage'));
const CaseStudyDetailPage = lazy(() => import('@/pages/CaseStudyDetailPage'));
const BlogsPage = lazy(() => import('@/pages/BlogsPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#020916',
    color: 'white',
  }}>
    <div>Loading...</div>
  </div>
);

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: (
      <RootLayout>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        </ErrorBoundary>
      </RootLayout>
    ),
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: ROUTES.HOME,
            element: (
              <Suspense fallback={<PageLoader />}>
                <HomePage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.ACCELERATORS,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AcceleratorsPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.ACCELERATOR_DETAIL,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AcceleratorDetailPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.CASE_STUDIES,
            element: (
              <Suspense fallback={<PageLoader />}>
                <CaseStudiesPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.SUCCESS_STORIES,
            element: (
              <Suspense fallback={<PageLoader />}>
                <CaseStudiesPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.CASE_STUDY_DETAIL,
            element: (
              <Suspense fallback={<PageLoader />}>
                <CaseStudyDetailPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.INSIGHTS,
            element: (
              <Suspense fallback={<PageLoader />}>
                <BlogsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'accelerators',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'case-studies',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'analytics',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

// Router Provider Component
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;

