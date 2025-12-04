import { Link } from 'react-router-dom'

function AuthLayout({ title,  children, footerLink }) {
  return (
    <div className="relative isolate  flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-100">
   
      <div className="relative z-10 w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Realtime Chat</p>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
        {footerLink ? (
          <p className="text-center text-sm text-slate-400">
            {footerLink.prefix}{' '}
            <Link to={footerLink.href} className=" text-sky-400 hover:text-sky-300 font-medium transitionunderline-offset-4 hover:underline">
              {footerLink.label}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default AuthLayout
