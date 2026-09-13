import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^three$/,
        replacement: path.resolve(import.meta.dirname, 'src/lib/three-shim.ts'),
      },
    ],
  },
  server: {
    host: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    port: 5173,
  },
});
