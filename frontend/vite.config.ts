import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    modulePreload: {
      polyfill: false,
      resolveDependencies(_filename, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('vendor-charts') &&
            !dep.includes('vendor-maps') &&
            !dep.includes('PriceChart') &&
            !dep.includes('StorageMap') &&
            !dep.includes('MidhStagingRegistry')
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const nid = id.replace(/\\/g, '/');
          if (
            nid.includes('node_modules/react/') ||
            nid.includes('node_modules/react-dom/') ||
            nid.includes('node_modules/scheduler/') ||
            nid.includes('node_modules/react-is')
          ) {
            return 'vendor-react';
          }
          if (
            nid.includes('node_modules/recharts') ||
            nid.includes('node_modules/d3-') ||
            nid.includes('node_modules/victory-vendor')
          ) {
            return 'vendor-charts';
          }
          if (
            nid.includes('node_modules/leaflet') ||
            nid.includes('node_modules/react-leaflet')
          ) {
            return 'vendor-maps';
          }
          if (nid.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
