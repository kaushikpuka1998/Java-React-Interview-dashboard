import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Precaches the built app shell (JS/CSS/HTML) so the site itself still loads
    // when offline. Question data offline-availability is handled separately
    // (see src/lib/offlineStore.js) since it's paginated/filtered API data, not
    // a static asset Workbox can glob.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Question detail lookups (fetchQuestion) are simple GET-by-id calls;
            // safe to serve stale-while-revalidate so a repeat visit is instant
            // and still works if the network request fails.
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.includes('/api/questions/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'ir-question-api' },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
