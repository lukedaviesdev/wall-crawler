import { createFileRoute } from '@tanstack/react-router';

import { MotionPage } from '@/pages/motion';

export const Route = createFileRoute('/motion')({
  component: MotionPage,
});
