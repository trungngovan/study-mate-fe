import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path'
import { copyFileSync } from 'fs'

// Plugin to copy index.html to 404.html for SPA routing on Render
const render404Plugin = () => {
  return {
    name: 'render-404',
    closeBundle() {
      const distPath = resolve(__dirname, 'dist')
      copyFileSync(
        resolve(distPath, 'index.html'),
        resolve(distPath, '404.html')
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), render404Plugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false
  }
})
