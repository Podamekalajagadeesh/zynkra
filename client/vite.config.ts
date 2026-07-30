import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@privacyresearch/libsignal-protocol-typescript',
      '@privacyresearch/curve25519-typescript',
    ],
  },
  ssr: {
    noExternal: [],
    external: ['@privacyresearch/libsignal-protocol-typescript', '@privacyresearch/curve25519-typescript'],
  },
  publicDir: 'public',
  build: {
    commonjsOptions: {
      include: [
        /node_modules/,
      ],
    },
    rollupOptions: {
      external: [
        /@privacyresearch/,
      ],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react';
          }

          if (id.includes('/react-router/') || id.includes('/react-router-dom/')) {
            return 'vendor-router';
          }

          if (id.includes('/axios/')) {
            return 'vendor-network';
          }

          if (id.includes('/lucide-react/')) {
            return 'vendor-icons';
          }

          const match = id.match(/node_modules\/(\@[^/]+\/[^/]+|[^/]+)/);
          const pkgName = match?.[1];

          if (!pkgName) {
            return;
          }

          if (pkgName.startsWith('@walletconnect/')) {
            return `vendor-${pkgName.replace('@', '').replace('/', '-')}`;
          }

          if (pkgName.startsWith('@reown/')) {
            return `vendor-${pkgName.replace('@', '').replace('/', '-')}`;
          }

          if (pkgName === 'ethers' || pkgName === 'viem' || pkgName === 'siwe' || pkgName === 'ox') {
            return `vendor-${pkgName}`;
          }

          return;
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/auth': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/users': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/posts': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/feed': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/comments': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/dms': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/notifications': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/search': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/upload': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/payments': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/wallet': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/subscriptions': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/tips': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/groups': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/events': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/marketplace': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/stories': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/reels': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/articles': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/polls': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/admin': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/moderation': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/explore': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/activity': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/favorites': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/ai': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/courses': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/podcasts': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/newsletters': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/sync': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/analytics': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/siwe': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/sessions': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/reports': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/keys': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/webhooks': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/places': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/api': { target: 'http://localhost:3000', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, ''), ws: true },
    },
  },
})