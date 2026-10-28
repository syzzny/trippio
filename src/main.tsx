import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TripDraftProvider } from '@/store/TripDraftContext';
import { ItineraryProvider } from '@/store/ItineraryContext';
import App from './App';
import '@/styles/global.scss';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TripDraftProvider>
        <ItineraryProvider>
          <App />
        </ItineraryProvider>
      </TripDraftProvider>
    </QueryClientProvider>
  </StrictMode>,
);
