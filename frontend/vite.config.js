import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    sentryVitePlugin({
      org: "YOUR_SENTRY_ORG",
      project: "YOUR_SENTRY_PROJECT",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // The magic line
    },
  },
})
