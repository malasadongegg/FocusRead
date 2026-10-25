import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
    manifest: {
      name: 'FocusRead — Speed Reading', short_name: 'FocusRead',
      description: 'Private RSVP speed reading with offline ambient audio.',
      start_url: '/', scope: '/', display: 'standalone',
      background_color: '#0b0d0f', theme_color: '#0b0d0f',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{html,js,css,webp,ico}'],
      navigateFallback: '/index.html',
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: false,
    },
  })],
  test: { environment: 'jsdom', setupFiles: './tests/setup.ts', globals: true },
})
