import { createFileRoute } from '@tanstack/react-router';

import { DataPage } from '../pages/data';

export const Route = createFileRoute('/data')({
  component: DataPage,
});
