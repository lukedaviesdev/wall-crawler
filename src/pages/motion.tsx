import { MotionDemo } from '@/components/motion/motion';
import { DefaultLayout } from '@/layout/default-layout';

export const MotionPage = () => {
  const meta = {
    title: 'Motion Page',
  };
  return (
    <DefaultLayout meta={meta}>
      <div className="border rounded-lg p-6 bg-card space-y-8">
        <h1>Welcome to the new Motion page!!</h1>
        <MotionDemo />
      </div>
    </DefaultLayout>
  );
};
