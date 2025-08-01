import { readme } from '@/assets/readme';
import { BackToTop } from '@/components/back-to-top/back-to-top';
import { Markdown } from '@/components/markdown/markdown';
import { DefaultLayout } from '@/layout/default-layout';
import './styles.scss';
export const HomePage = () => {
  return (
    <DefaultLayout
      meta={{
        title: 'Home Page',
      }}
    >
      <div className="border rounded-lg p-6 bg-card space-y-8 markdown-container">
        <Markdown content={readme} />
      </div>
      <BackToTop />
    </DefaultLayout>
  );
};
