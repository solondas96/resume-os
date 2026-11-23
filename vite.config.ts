import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The user is asked before a new version takes over (see UpdatePrompt)
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'data/skills.json'],
      manifest: {
        name: 'ResumeLabs',
        short_name: 'ResumeLabs',
        description: 'Resume intelligence without AI. Everything stays in your browser.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#faf9f5',
        theme_color: '#c96442',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // App shell, styles, scripts, icons and the skills data. Fonts are loaded from Google Fonts
        // and are not cached here; the app falls back to system fonts offline.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2,ttf}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  base: './', // Vital for GitHub Pages subpath hosting
  build: {
    rollupOptions: {
      output: {
        // A stable name for the startup entry, so the size budget checks exactly that file
        entryFileNames: 'assets/entry-[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // DOMPurify needs a DOM window at import time; tests run under jsdom
    environment: 'jsdom',
    // Playwright owns tests/e2e and tests/perf (*.spec.ts)
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**', 'tests/perf/**'],
    coverage: {
      provider: 'v8',
      include: ['src/intelligence/**', 'src/model/**'],
      reporter: ['text', 'json-summary'],
      // The gate: these folders must stay at or above 90% line coverage, or CI fails
      thresholds: {
        'src/intelligence/**': { lines: 90 },
        'src/model/**': { lines: 90 },
      },
    },
  },
});
