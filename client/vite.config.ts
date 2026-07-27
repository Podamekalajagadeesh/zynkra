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
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})