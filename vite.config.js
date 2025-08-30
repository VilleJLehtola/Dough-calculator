// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router'))
              return 'react-vendor';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
            if (id.includes('lucide-react')) return 'icons';
            return 'vendor';
          }
        },
      },
      treeshake: true,
    },
  },
});
