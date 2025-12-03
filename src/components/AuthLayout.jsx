import { Link } from 'react-router-dom'

function AuthLayout({ title, subtitle, children, footerLink }) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-purple-500/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-60 w-60 rounded-full bg-blue-500/30 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Realtime Chat</p>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="text-base text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
        {footerLink ? (
          <p className="text-center text-sm text-slate-400">
            {footerLink.prefix}{' '}
            <Link to={footerLink.href} className="font-medium text-white underline-offset-4 hover:underline">
              {footerLink.label}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default AuthLayout
