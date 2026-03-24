import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout, MainLayout, AdminLayout } from '@/layouts';
import { ROUTES } from '@/constants';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AcceleratorsPage = lazy(() => import('@/pages/AcceleratorsPage'));
const OfferingsPage = lazy(() => import('@/pages/OfferingsPage'));
const CaseStudiesPage = lazy(() => import('@/pages/CaseStudiesPage'));
const BlogsPage = lazy(() => import('@/pages/BlogsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const AdminPricingPage = lazy(() => import('@/pages/AdminPricingPage'));
const EstimatorPage = lazy(() => import('@/pages/EstimatorPage'));
const EstimatorEstimatePage = lazy(() => import('@/pages/EstimatorEstimatePage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const CalendarDownloadPage = lazy(() => import('@/pages/CalendarDownloadPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const LeafLoader = lazy(() => import('@/components/LeafLoader'));

// Loading component
const PageLoader = () => <LeafLoader />;

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
            index: true,
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
            path: ROUTES.OFFERINGS,
            element: (
              <Suspense fallback={<PageLoader />}>
                <OfferingsPage />
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
            path: ROUTES.INSIGHTS,
            element: (
              <Suspense fallback={<PageLoader />}>
                <BlogsPage />
              </Suspense>
            ),
          },
          {
            path: '/profile',
            element: (
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/contact',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ContactPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.ESTIMATOR,
            element: (
              <Suspense fallback={<PageLoader />}>
                <EstimatorPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.ESTIMATOR_FLOW,
            element: (
              <Suspense fallback={<PageLoader />}>
                <EstimatorEstimatePage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.EVENTS,
            element: (
              <Suspense fallback={<PageLoader />}>
                <EventsPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.EVENTS_ON_DEMAND,
            element: (
              <Suspense fallback={<PageLoader />}>
                <EventsPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.ABOUT,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AboutPage />
              </Suspense>
            ),
          },
          {
            path: '/events/:eventId/calendar',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CalendarDownloadPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: ROUTES.ADMIN,
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
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
            path: 'pricing',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminPricingPage />
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

// eslint-disable-next-line react-refresh/only-export-components
export default router;

