import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import DestinationPage from '@/pages/DestinationPage';
import ComingSoonPage from '@/pages/ComingSoonPage';

// 지도 의존성이 큰 조건 입력 화면은 코드 스플리팅
const ConditionsPage = lazy(() => import('@/pages/ConditionsPage'));
const GeneratingPage = lazy(() => import('@/pages/GeneratingPage'));
const PlanPage = lazy(() => import('@/pages/PlanPage'));
const OverviewPage = lazy(() => import('@/pages/OverviewPage'));
const TripsPage = lazy(() => import('@/pages/TripsPage'));

const router = createBrowserRouter(
  [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DestinationPage /> },
      {
        path: '/conditions',
        element: (
          <Suspense fallback={null}>
            <ConditionsPage />
          </Suspense>
        ),
      },
      {
        path: '/generating',
        element: (
          <Suspense fallback={null}>
            <GeneratingPage />
          </Suspense>
        ),
      },
      {
        path: '/plan',
        element: (
          <Suspense fallback={null}>
            <PlanPage />
          </Suspense>
        ),
      },
      {
        path: '/overview',
        element: (
          <Suspense fallback={null}>
            <OverviewPage />
          </Suspense>
        ),
      },
      {
        path: '/trips',
        element: (
          <Suspense fallback={null}>
            <TripsPage />
          </Suspense>
        ),
      },
      { path: '*', element: <ComingSoonPage title="페이지를 찾을 수 없어요" /> },
    ],
  },
  ],
  { future: { v7_relativeSplatPath: true } },
);

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
