import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { validatePassword, validateEmail, validateUsername } from '../utils/validation'

function Signup() {
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [passwordValidation, setPasswordValidation] = useState(null)
  const [emailError, setEmailError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  // Validate password in real-time
  useEffect(() => {
    if (form.password) {
      setPasswordValidation(validatePassword(form.password))
    } else {
      setPasswordValidation(null)
    }
  }, [form.password])

  // Validate email in real-time
  useEffect(() => {
    if (form.email && !validateEmail(form.email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }, [form.email])

  // Validate username in real-time
  useEffect(() => {
    if (form.displayName) {
      const validation = validateUsername(form.displayName)
      setUsernameError(validation.isValid ? '' : validation.feedback)
    } else {
      setUsernameError('')
    }
  }, [form.displayName])

  const isDisabled = useMemo(() => {
    return (
      !form.email ||
      !form.password ||
      !form.displayName ||
      isLoading ||
      !passwordValidation?.isValid ||
      !!emailError ||
      !!usernameError
    )
  }, [form.email, form.password, form.displayName, isLoading, passwordValidation, emailError, usernameError])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isDisabled) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      await signup({ email: form.email, password: form.password, displayName: form.displayName })
      navigate('/login', {
        replace: true,
        state: {
          message: 'Account created. You can sign in now.',
        },
      })
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-950 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Create an account</h1>
        <p className="text-slate-400 text-center mb-8">  note : no  email confirmation </p>
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-slate-300">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              placeholder="Bobby Fischer"
              required
              className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-white placeholder-slate-200 italic outline-none focus:ring-1 focus:ring-sky-500 transition ${usernameError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-sky-500'
                }`}
              value={form.displayName}
              onChange={handleChange}
              aria-invalid={!!usernameError}
              aria-describedby={usernameError ? 'username-error' : undefined}
            />
            {usernameError && (
              <p id="username-error" className="text-xs text-red-400" role="alert">
                {usernameError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-white placeholder-slate-200 italic outline-none focus:ring-1 focus:ring-sky-500 transition ${emailError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-sky-500'
                }`}
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-xs text-red-400" role="alert">
                {emailError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="password"
              required
              className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-white placeholder-slate-200 italic outline-none focus:ring-1 focus:ring-sky-500 transition ${passwordValidation && !passwordValidation.isValid
                  ? 'border-red-500/50 focus:border-red-500'
                  : passwordValidation?.isValid
                    ? 'border-green-500/50 focus:border-green-500'
                    : 'border-white/10 focus:border-sky-500'
                }`}
              value={form.password}
              onChange={handleChange}
              aria-invalid={passwordValidation && !passwordValidation.isValid}
              aria-describedby={passwordValidation ? 'password-feedback' : undefined}
            />
            {passwordValidation && form.password && (
              <div id="password-feedback" className="space-y-2">
                {/* Password Strength Indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordValidation.strength === 'strong'
                          ? 'bg-green-500 w-full'
                          : passwordValidation.strength === 'medium'
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-red-500 w-1/3'
                        }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${passwordValidation.strength === 'strong'
                        ? 'text-green-400'
                        : passwordValidation.strength === 'medium'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                  >
                    {passwordValidation.strength.toUpperCase()}
                  </span>
                </div>
                {/* Password Requirements */}
                {passwordValidation.feedback.length > 0 && (
                  <ul className="text-xs text-slate-400 space-y-1">
                    {passwordValidation.feedback.map((feedback, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>{feedback}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {passwordValidation.isValid && (
                  <p className="text-xs text-green-400 flex items-center gap-2">
                    <span>✓</span>
                    <span>Password meets all requirements</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-8">
          Already have an account?{' '}
          <a href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition">
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}

export default Signup
