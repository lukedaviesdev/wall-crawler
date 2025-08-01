import { Helmet, HelmetProvider } from 'react-helmet-async';

interface Meta {
  title: string;
}

export const DefaultLayout = ({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta: Meta;
}) => {
  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{meta.title}</title>
      </Helmet>
      <div className="container mx-auto p-8">{children}</div>
    </HelmetProvider>
  );
};
