import { describe, it, expect } from 'vitest'
import { validatePassword, validateEmail, validateUsername } from './validation'

describe('validatePassword', () => {
  it('should return weak for empty password', () => {
    const result = validatePassword('')
    expect(result.isValid).toBe(false)
    expect(result.strength).toBe('weak')
  })

  it('should return weak for short password', () => {
    const result = validatePassword('short')
    expect(result.isValid).toBe(false)
    expect(result.strength).toBe('weak')
  })

  it('should return medium for password with some requirements', () => {
    const result = validatePassword('Password1')
    expect(result.strength).toBe('medium')
  })

  it('should return strong for password with all requirements', () => {
    const result = validatePassword('Password123!')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('strong')
  })

  it('should check for uppercase letter', () => {
    const result = validatePassword('password123!')
    expect(result.feedback).toContain('Add at least one uppercase letter')
  })

  it('should check for lowercase letter', () => {
    const result = validatePassword('PASSWORD123!')
    expect(result.feedback).toContain('Add at least one lowercase letter')
  })

  it('should check for number', () => {
    const result = validatePassword('Password!')
    expect(result.feedback).toContain('Add at least one number')
  })

  it('should check for special character', () => {
    const result = validatePassword('Password123')
    expect(result.feedback).toContain('Add at least one special character')
  })
})

describe('validateEmail', () => {
  it('should return false for empty email', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
  })

  it('should return true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('test.email+tag@example.co.uk')).toBe(true)
  })
})

describe('validateUsername', () => {
  it('should return invalid for empty username', () => {
    const result = validateUsername('')
    expect(result.isValid).toBe(false)
    expect(result.feedback).toBe('Username is required')
  })

  it('should return invalid for short username', () => {
    const result = validateUsername('ab')
    expect(result.isValid).toBe(false)
    expect(result.feedback).toContain('at least 3 characters')
  })

  it('should return invalid for long username', () => {
    const result = validateUsername('a'.repeat(31))
    expect(result.isValid).toBe(false)
    expect(result.feedback).toContain('less than 30 characters')
  })

  it('should return invalid for username with special characters', () => {
    const result = validateUsername('user@name')
    expect(result.isValid).toBe(false)
    expect(result.feedback).toContain('letters, numbers, underscores, and hyphens')
  })

  it('should return valid for proper username', () => {
    const result = validateUsername('username123')
    expect(result.isValid).toBe(true)
    expect(result.feedback).toBe('')
  })

  it('should allow underscores and hyphens', () => {
    expect(validateUsername('user_name').isValid).toBe(true)
    expect(validateUsername('user-name').isValid).toBe(true)
    expect(validateUsername('user_name-123').isValid).toBe(true)
  })
})

