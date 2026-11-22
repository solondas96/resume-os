import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Vital for GitHub Pages subpath hosting
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // DOMPurify needs a DOM window at import time; tests run under jsdom
    environment: 'jsdom',
    // Playwright owns tests/e2e (*.spec.ts)
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
  },
});
