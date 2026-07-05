import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        /* Pisah bagian yang jarang berubah ke chunk sendiri agar cache
           bertahan lintas rilis & first-load paralel:
           - firebase & react: vendor besar
           - data: konten klinis statis (algoritma/obat/EKG/kalkulator ~2273
             baris) yang jarang berubah dibanding logika UI. TIDAK di-lazy
             karena home-search butuh semua data serentak — cukup dipisah
             chunk untuk granularitas cache. */
        manualChunks(id) {
          if (id.includes('/firebase/')) return 'firebase';
          if (id.includes('/react-dom/') || id.includes('/node_modules/react/')) return 'react';
          if (id.includes('/src/data/')) return 'data';
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
