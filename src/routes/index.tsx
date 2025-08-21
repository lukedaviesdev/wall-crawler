import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { LoadingPage } from '../components/ui/loading-spinner';

// Use debug page to test data flow
const GalleryPage = lazy(() =>
  import('../pages/gallery').then((module) => ({
    default: module.GalleryPage,
  })),
);

export const Route = createFileRoute('/')({
  component: () => (
    <Suspense fallback={<LoadingPage />}>
      <GalleryPage />
    </Suspense>
  ),
});
