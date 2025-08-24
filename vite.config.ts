import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Vite options for Electron development
  clearScreen: false,
  base: './', // Importante: usar rutas relativas para Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173, // Electron espera este puerto
    strictPort: false, // Permitir puerto alternativo si 5173 está ocupado
    host: true, // Permitir conexiones externas
    hmr: {
      port: 5174,
    },
    watch: {
      // Ignorar archivos de Electron durante desarrollo
      ignored: ["**/electron/**"],
    },
    // Handle routing for multi-page app
    middlewareMode: false,
    fs: {
      strict: false
    }
  },
});
