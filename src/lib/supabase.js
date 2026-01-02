import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  logger.error('Missing Supabase environment variables. Please check your .env file.')
}

// Use global variable to persist across HMR (Hot Module Reload)
// This prevents multiple GoTrueClient instances during development
const GLOBAL_SUPABASE_KEY = '__SWERI_CHAT_SUPABASE_CLIENT__'

/**
 * Get or create the Supabase client instance
 * Ensures only one instance exists across the application, even during HMR
 */
function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null
  }

  // Check if instance exists in global scope (survives HMR)
  if (typeof window !== 'undefined' && window[GLOBAL_SUPABASE_KEY]) {
    return window[GLOBAL_SUPABASE_KEY]
  }

  // Create new instance with explicit storage key to avoid conflicts
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'sweri-chat-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

  // Store in global scope to persist across HMR
  if (typeof window !== 'undefined') {
    window[GLOBAL_SUPABASE_KEY] = client
  }

  return client
}

// Export the singleton instance
export const supabase = getSupabaseClient()
