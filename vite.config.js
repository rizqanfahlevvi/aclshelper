import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'ACLS Helper',
        short_name: 'ACLS',
        description: 'Alat bantu kognitif bedside BHJL/BHJD — PERKI 2025 + AHA 2025',
        theme_color: '#FF3B30',
        background_color: '#F2F2F7',
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
