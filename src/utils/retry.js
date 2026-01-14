/**
 * Retry utility with exponential backoff
 * Used for Supabase operations that may fail due to network issues
 */

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry all)
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options

  let lastError
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if we've exhausted attempts or error shouldn't be retried
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, maxDelay)
    }
  }

  throw lastError
}

/**
 * Determines if a Supabase error should be retried
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether to retry
 */
export function shouldRetrySupabaseError(error) {
  // Don't retry authentication errors (401, 403)
  if (error?.status === 401 || error?.status === 403) {
    return false
  }

  // Don't retry validation errors (400)
  if (error?.status === 400) {
    return false
  }

  // Retry network errors, timeouts, and server errors (500+)
  if (
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('fetch') ||
    error?.status >= 500
  ) {
    return true
  }

  // Retry by default for unknown errors
  return true
}

/**
 * Wrapper for Supabase operations with automatic retry
 * @param {Function} operation - Supabase operation function
 * @param {Object} retryOptions - Options for retry logic
 * @returns {Promise} - Result of the operation
 */
export async function retrySupabaseOperation(operation, retryOptions = {}) {
  return retryWithBackoff(operation, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    shouldRetry: shouldRetrySupabaseError,
    ...retryOptions,
  })
}

