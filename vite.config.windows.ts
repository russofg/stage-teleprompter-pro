import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración específica para Windows - evita módulos nativos
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
    target: 'es2015', // Target más compatible
    rollupOptions: {
      // Configuración específica para evitar módulos nativos
      external: [],
      output: {
        manualChunks: undefined,
        format: 'es'
      }
    }
  },
  optimizeDeps: {
    // Excluir completamente dependencias nativas problemáticas
    exclude: [
      '@rollup/rollup-win32-x64-msvc',
      '@rollup/rollup-win32-ia32-msvc',
      '@rollup/rollup-darwin-x64',
      '@rollup/rollup-darwin-arm64',
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-x64-musl'
    ]
  },
  define: {
    // Forzar variables de entorno
    'process.env.ROLLUP_SKIP_NATIVE': '"true"',
    'process.env.VITE_SKIP_NATIVE': '"true"'
  },
  watch: {
    ignored: ['dist/**', 'dist-electron/**', 'node_modules/**']
  }
})
