import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ADD THIS:
import { fileURLToPath, URL } from 'node:url'
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  root: '.',
})
