import { DefaultLayout } from '@/layout/default-layout';

export const AboutPage = () => {
  return (
    <DefaultLayout
      meta={{
        title: 'About Page',
      }}
    >
      <div className="border rounded-lg p-6 bg-card space-y-8">
        <p>About page!</p>
      </div>
    </DefaultLayout>
  );
};
