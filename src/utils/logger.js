/**
 * Centralized logging utility
 * Only logs in development mode to prevent console statements in production
 */

const isDevelopment = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args)
    }
  },

  error: (...args) => {
    // Always log errors, even in production (but could be sent to error tracking service)
    console.error('[ERROR]', ...args)
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  }
}

export default logger

