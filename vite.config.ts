import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // ✅ crucial for Netlify root deployment
  define: {
    'process.env': process.env,
  },
  server: {
    https: true,
    port: 5173,
  },
});
