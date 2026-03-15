import react from '@vitejs/plugin-react-swc';
import UnoCSS from 'unocss/vite';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    UnoCSS(),
    react(),
    {
      name: 'inject-build-info',
      config(_, { command }) {
        const isBuild = command === 'build';
        return {
          define: {
            'import.meta.env.VITE_BUILD_TIME': JSON.stringify(
              new Date().toISOString(),
            ),
            'import.meta.env.VITE_BUILD_HASH': JSON.stringify(
              isBuild ? `build-${Date.now().toString(36)}` : 'dev',
            ),
          },
        };
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
