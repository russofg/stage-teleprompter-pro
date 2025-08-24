import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      port: 5174
    }
  },
  base: './',
  build: {
    rollupOptions: {
      // Forzar uso de versión JavaScript pura de Rollup
      external: [],
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    // Evitar dependencias nativas problemáticas
    exclude: ['@rollup/rollup-win32-x64-msvc']
  },
  watch: {
    ignored: ['dist/**', 'dist-electron/**', 'node_modules/**']
  }
})
