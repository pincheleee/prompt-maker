import { defineConfig } from 'vite'

export default defineConfig({
  // No plugins needed -- vanilla HTML/JS/CSS
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
})
