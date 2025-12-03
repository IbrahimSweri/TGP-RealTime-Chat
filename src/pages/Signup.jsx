import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../contexts/AuthContext'

function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
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
    <AuthLayout
      title="Create an account"
      subtitle="Sign up instantly — email confirmations depend on your Supabase settings"
      footerLink={{ prefix: 'Already have an account?', label: 'Log in', href: '/login' }}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm text-slate-300">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            placeholder="Taylor Swift"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            value={form.displayName}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-slate-300">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-slate-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Signup
