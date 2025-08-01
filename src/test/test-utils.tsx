import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: AllTheProviders, ...options }),
  };
};

export * from '@testing-library/react';

export { customRender as render };
