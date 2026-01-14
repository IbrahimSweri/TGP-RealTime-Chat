/**
 * Validation utilities for form inputs
 */

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid, score, and feedback
 */
export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: [],
      strength: 'weak'
    }
  }

  const feedback = []
  let score = 0

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add at least one uppercase letter')
  } else {
    score += 1
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Add at least one lowercase letter')
  } else {
    score += 1
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    feedback.push('Add at least one number')
  } else {
    score += 1
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Add at least one special character (!@#$%^&*)')
  } else {
    score += 1
  }

  // Length bonus
  if (password.length >= 12) {
    score += 1
  }

  let strength = 'weak'
  if (score >= 5) {
    strength = 'strong'
  } else if (score >= 3) {
    strength = 'medium'
  }

  return {
    isValid: feedback.length === 0,
    score,
    feedback,
    strength
  }
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function validateEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates username
 * @param {string} username - Username to validate
 * @returns {Object} - Validation result
 */
export function validateUsername(username) {
  if (!username) {
    return {
      isValid: false,
      feedback: 'Username is required'
    }
  }

  if (username.length < 3) {
    return {
      isValid: false,
      feedback: 'Username must be at least 3 characters long'
    }
  }

  if (username.length > 30) {
    return {
      isValid: false,
      feedback: 'Username must be less than 30 characters'
    }
  }

  // Allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      isValid: false,
      feedback: 'Username can only contain letters, numbers, underscores, and hyphens'
    }
  }

  return {
    isValid: true,
    feedback: ''
  }
}

