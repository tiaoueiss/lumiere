import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'

const initialTouched = {
  name: false,
  email: false,
  password: false,
  otp: false,
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateSignup({ name, email, password }) {
  const errors = {}

  if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  if (!emailPattern.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must include at least one letter and one number.'
  }

  return errors
}

export default function AuthModal({ onClose }) {
  const { login, requestSignupOtp, verifySignupOtp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'verify'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [otp, setOtp] = useState('')
  const [touched, setTouched] = useState(initialTouched)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const signupErrors = validateSignup({ name, email, password })
  const visibleSignupErrors = Object.fromEntries(
    Object.entries(signupErrors).filter(([field]) => touched[field])
  )

  const setFieldTouched = field => {
    setTouched(current => ({ ...current, [field]: true }))
  }

  const resetFeedback = () => {
    setError('')
    setNotice('')
  }

  const requestOtp = async () => {
    const errors = validateSignup({ name, email, password })
    setTouched(current => ({ ...current, name: true, email: true, password: true }))

    if (Object.keys(errors).length > 0) {
      setError('Please fix the highlighted signup details.')
      return
    }

    setBusy(true)
    resetFeedback()
    try {
      const result = await requestSignupOtp(name.trim(), email.trim(), password)
      setMode('verify')
      setOtp('')
      setNotice(result.emailSent
        ? `We sent a 6-digit code to ${result.email}.`
        : 'Development mode: check the backend console for your 6-digit code.'
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    resetFeedback()

    if (mode === 'signup') {
      await requestOtp()
      return
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await verifySignupOtp(email.trim(), otp)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(current => current === 'login' ? 'signup' : 'login')
    setTouched(initialTouched)
    setOtp('')
    resetFeedback()
  }

  const isSignup = mode === 'signup'
  const isVerify = mode === 'verify'
  const title = mode === 'login' ? 'Sign In' : isVerify ? 'Verify Email' : 'Create Account'
  const kicker = mode === 'login' ? 'Welcome back' : isVerify ? 'Check your inbox' : 'Join Lumiere'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-[3px] gold-rule" />

        <div className="px-8 pt-8 pb-6">
          <div className="text-center mb-6">
            <p className="font-body text-[0.5rem] tracking-[0.35em] uppercase text-gold mb-1">
              {kicker}
            </p>
            <h2 className="font-display text-2xl text-ink">
              {title}
            </h2>
            {isVerify && (
              <p className="font-body text-xs text-muted mt-2">
                Enter the code we sent to {email.trim()}.
              </p>
            )}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {isSignup && (
              <div className="flex flex-col gap-1">
                <label className="font-ui text-[11px] tracking-widest uppercase text-muted">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onBlur={() => setFieldTouched('name')}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="border border-cream-3 rounded-lg px-4 py-2.5 font-body text-sm text-ink
                    outline-none focus:border-gold transition-colors"
                />
                {visibleSignupErrors.name && (
                  <p className="font-body text-[11px] text-red-600">{visibleSignupErrors.name}</p>
                )}
              </div>
            )}

            {!isVerify && (
              <div className="flex flex-col gap-1">
                <label className="font-ui text-[11px] tracking-widest uppercase text-muted">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onBlur={() => setFieldTouched('email')}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border border-cream-3 rounded-lg px-4 py-2.5 font-body text-sm text-ink
                    outline-none focus:border-gold transition-colors"
                />
                {isSignup && visibleSignupErrors.email && (
                  <p className="font-body text-[11px] text-red-600">{visibleSignupErrors.email}</p>
                )}
              </div>
            )}

            {!isVerify && (
              <div className="flex flex-col gap-1">
                <label className="font-ui text-[11px] tracking-widest uppercase text-muted">Password</label>
                <input
                  type="password"
                  required
                  minLength={isSignup ? 8 : 1}
                  value={password}
                  onBlur={() => setFieldTouched('password')}
                  onChange={e => setPass(e.target.value)}
                  placeholder="********"
                  className="border border-cream-3 rounded-lg px-4 py-2.5 font-body text-sm text-ink
                    outline-none focus:border-gold transition-colors"
                />
                {isSignup && visibleSignupErrors.password && (
                  <p className="font-body text-[11px] text-red-600">{visibleSignupErrors.password}</p>
                )}
              </div>
            )}

            {isVerify && (
              <div className="flex flex-col gap-1">
                <label className="font-ui text-[11px] tracking-widest uppercase text-muted">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onBlur={() => setFieldTouched('otp')}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="border border-cream-3 rounded-lg px-4 py-2.5 font-body text-sm text-ink
                    text-center tracking-[0.45em] outline-none focus:border-gold transition-colors"
                />
                {touched.otp && otp.length > 0 && otp.length < 6 && (
                  <p className="font-body text-[11px] text-red-600">Enter all 6 digits.</p>
                )}
              </div>
            )}

            {notice && (
              <p className="font-body text-xs text-emerald-700 text-center">{notice}</p>
            )}

            {error && (
              <p className="font-body text-xs text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy || (isVerify && otp.length !== 6)}
              className="mt-1 bg-gradient-to-br from-gold to-gold-dark text-white font-ui text-xs
                tracking-[2px] uppercase py-3 rounded-full transition-opacity
                hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : isVerify ? 'Verify & Create Account' : 'Send Code'}
            </button>
          </form>

          {isVerify ? (
            <div className="font-body text-xs text-muted text-center mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={requestOtp}
                disabled={busy}
                className="text-gold-dark underline cursor-pointer bg-transparent border-none font-body text-xs disabled:opacity-60"
              >
                Send a new code
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); resetFeedback() }}
                className="text-muted underline cursor-pointer bg-transparent border-none font-body text-xs"
              >
                Change signup details
              </button>
            </div>
          ) : (
            <p className="font-body text-xs text-muted text-center mt-5">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={switchMode}
                className="text-gold-dark underline cursor-pointer bg-transparent border-none font-body text-xs"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
            text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none text-xl"
          aria-label="Close"
        >
          x
        </button>
      </div>
    </div>,
    document.body
  )
}
