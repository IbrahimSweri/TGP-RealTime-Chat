import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

function Signup() {
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isDisabled = useMemo(() => {
    return !form.email || !form.password || !form.displayName || isLoading
  }, [form.email, form.password, form.displayName, isLoading])

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
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-slate-200 italic outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              value={form.displayName}
              onChange={handleChange}
            />
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
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-slate-200 italic outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              value={form.email}
              onChange={handleChange}
            />
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
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-slate-200 italic outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              value={form.password}
              onChange={handleChange}
            />
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
