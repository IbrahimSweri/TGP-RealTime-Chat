import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  
  // ============================================
  // Build Optimization
  // ============================================
  build: {
    // Increase warning limit (optional)
    chunkSizeWarningLimit: 600,
    
    rollupOptions: {
      output: {
        // Manual code splitting for better caching
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          
          // Chat UI kit
          if (id.includes('node_modules/@chatscope')) {
            return 'vendor-chat-ui'
          }
          
          // Utilities
          if (id.includes('node_modules/clsx') || 
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/date-fns')) {
            return 'vendor-utils'
          }
        },
      },
    },
  },
})
