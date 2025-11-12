import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // ✅ deploys from root, fixes 404 on Netlify
  server: {
    https: true,
    port: 5173,
  },
});
