import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout, MainLayout, AdminLayout } from '@/layouts';
import { ROUTES } from '@/constants';
import ErrorBoundary from '@/components/ErrorBoundary';

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
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
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
            path: ROUTES.EVENTS,
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

