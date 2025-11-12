import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? '/bengaliaddin/' : '/', // ✅ automatic base path
  define: {
    'process.env': process.env,
  },
  server: {
    https: true,
    port: 5173,
  },
});
