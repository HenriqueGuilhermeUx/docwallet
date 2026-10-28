import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Standalone USA-only bundle. Never use the BR root index.html or public/ assets.
const root = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [react()],
  root: resolve(root, 'usa-preview'),
  publicDir: resolve(root, 'usa-preview/public'),
  base: '/',
  build: {
    outDir: resolve(root, 'dist-usa-docwallet'),
    emptyOutDir: true,
  },
});
