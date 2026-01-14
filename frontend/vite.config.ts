import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync } from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Validate required environment variables
  if (!env.VITE_API_BASE_URL) {
    console.error('❌ VITE_API_BASE_URL is not set in .env file');
    console.error('Please create a .env file with: VITE_API_BASE_URL=your_api_url');
  }
  
  return {
    plugins: [
      react(),
      {
        name: 'copy-static-web-app-config',
        closeBundle() {
          // Copy staticwebapp.config.json to dist folder after build
          try {
            copyFileSync('staticwebapp.config.json', 'dist/staticwebapp.config.json')
            console.log('✓ Copied staticwebapp.config.json to dist/')
          } catch (error) {
            console.warn('⚠ Could not copy staticwebapp.config.json:', error)
          }
        }
      }
    ],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})









