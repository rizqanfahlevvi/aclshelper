import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        /* Pisah vendor besar ke chunk sendiri: Firebase & React jarang
           berubah dibanding kode app, jadi cache-nya bertahan lintas rilis
           dan first-load bisa mengunduh paralel. */
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'ACLS Helper',
        short_name: 'ACLS Helper',
        description: 'Alat bantu kognitif bedside BHJL/BHJD — PERKI 2025 + AHA 2025',
        theme_color: '#BA1A1A',
        background_color: '#F3F3F8',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'id',
        dir: 'ltr',
        categories: ['medical', 'health', 'utilities'],
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        /* New SW takes over immediately — no waiting for tabs to close */
        skipWaiting: true,
        clientsClaim: true,
        /* Navigation requests: network-first so online users always get
           the latest index.html (which references hashed JS/CSS bundles).
           Falls back to cache after 3 s if network is slow/offline. */
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
})
