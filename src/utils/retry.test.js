import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff, shouldRetrySupabaseError, retrySupabaseOperation } from './retry'

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await retryWithBackoff(fn)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(fn, { maxRetries: 2, initialDelay: 100 })
    
    // Fast-forward time
    await vi.advanceTimersByTimeAsync(200)
    
    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should throw after max retries', async () => {
    const error = new Error('fail')
    const fn = vi.fn().mockRejectedValue(error)

    const promise = retryWithBackoff(fn, { maxRetries: 2, initialDelay: 100 })
    
    await vi.advanceTimersByTimeAsync(500)
    
    await expect(promise).rejects.toThrow('fail')
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should respect shouldRetry function', async () => {
    const error = new Error('fail')
    const fn = vi.fn().mockRejectedValue(error)
    const shouldRetry = vi.fn().mockReturnValue(false)

    const promise = retryWithBackoff(fn, { shouldRetry, maxRetries: 2 })
    
    await expect(promise).rejects.toThrow('fail')
    expect(fn).toHaveBeenCalledTimes(1) // No retries
  })
})

describe('shouldRetrySupabaseError', () => {
  it('should not retry 401 errors', () => {
    const error = { status: 401 }
    expect(shouldRetrySupabaseError(error)).toBe(false)
  })

  it('should not retry 403 errors', () => {
    const error = { status: 403 }
    expect(shouldRetrySupabaseError(error)).toBe(false)
  })

  it('should not retry 400 errors', () => {
    const error = { status: 400 }
    expect(shouldRetrySupabaseError(error)).toBe(false)
  })

  it('should retry 500 errors', () => {
    const error = { status: 500 }
    expect(shouldRetrySupabaseError(error)).toBe(true)
  })

  it('should retry network errors', () => {
    const error = { message: 'network error' }
    expect(shouldRetrySupabaseError(error)).toBe(true)
  })

  it('should retry timeout errors', () => {
    const error = { message: 'timeout' }
    expect(shouldRetrySupabaseError(error)).toBe(true)
  })
})

