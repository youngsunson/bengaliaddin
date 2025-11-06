import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // load .env, .env.development, etc
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/bengaliaddin/", // REQUIRED for GitHub Pages deployment
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    // No runtime API client code here — keep config only
  };
});
