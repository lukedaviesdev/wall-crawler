import path from 'path';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add React refresh runtime
      jsxRuntime: 'automatic',
    }),
    TanStackRouterVite(),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: true,
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        ...configDefaults.coverage.exclude!,
        'src/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
      ],
    },
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'e2e/*'],
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
