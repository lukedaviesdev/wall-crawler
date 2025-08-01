import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <main className="min-h-screen bg-background text-foreground">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
});
