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
        // Simpler chunking to avoid React loading order issues
        manualChunks: {
          // Keep React and chatscope together to ensure proper loading order
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@chatscope/chat-ui-kit-react',
          ],
        },
      },
    },
  },
})
