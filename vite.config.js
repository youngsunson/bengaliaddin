import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/bengaliaddin/',   // <-- ADD THIS LINE
  plugins: [react()],
  server: {
    https: true,
    port: 5173,
  },
});
