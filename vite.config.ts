import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/zealrn-web/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/zealrn-web.svg', 'attribution.json', 'offline.html'],
      manifest: {
        id: '/zealrn-web/',
        name: 'ZealRN Web',
        short_name: 'ZealRN Web',
        description: 'Offline starter documentation, page-linked learning notes, and a web playground.',
        start_url: '/zealrn-web/',
        scope: '/zealrn-web/',
        display: 'standalone',
        background_color: '#fbf7ec',
        theme_color: '#b4322b',
        categories: ['education', 'developer tools', 'productivity'],
        icons: [
          { src: 'icons/zealrn-web-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/zealrn-web-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/zealrn-web-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,css,js,json,svg,png}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
