import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ADD THIS:
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ADD THIS:
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // (optional) you can keep or remove this; default root is '.'
  root: '.',
})
