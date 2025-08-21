import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';

import './index.css';
import { ErrorBoundary } from './components/error/error-boundary';
import { cacheConfig } from './lib/query/cache-config';
// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Debug utilities moved to backend - available at API endpoints

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: cacheConfig.defaults,
});

const App = () => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);

  // Enable HMR for development
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      root.render(<App />);
    });
  }
}
