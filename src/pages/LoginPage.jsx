import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Network } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Custom Modern Brand SVG Logo (Consistent with Navbar)
const BrandIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 drop-shadow-md">
    <path 
      d="M22 10.5C22 10.5 19 5 13 5C7 5 4 11 4 16C4 21 7 27 13 27C19 27 22 21.5 22 21.5" 
      stroke="url(#brandGradLogin)" 
      strokeWidth="4.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <circle cx="22" cy="21.5" r="3.5" fill="url(#brandGradLogin)" />
    <circle cx="22" cy="10.5" r="3.5" fill="url(#brandGradLogin)" />
    <defs>
      <linearGradient id="brandGradLogin" x1="4" y1="5" x2="24" y2="27" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4F46E5" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
)

export default function LoginPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail, authLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleGoogleLogin = async () => {
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      await loginWithGoogle(mode)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error(error)
      setErrorMessage('Google authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailAuth = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      if (isSignup) await signupWithEmail({ name, email, password })
      else await loginWithEmail({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const messages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/weak-password': 'Password must contain at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
      }
      setErrorMessage(messages[error.code] || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin mr-2"><Network className="w-6 h-6 text-indigo-600" /></div>
        <span className="text-slate-600 dark:text-slate-400">Loading Concepta...</span>
      </div>
    )
  }

  return (
    <div className="product-page pt-24 min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden"
      >
        {/* Subtle background glow for the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="mb-6 flex justify-center">
            <BrandIcon />
          </div>

          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isSignup
              ? 'Create your Concepta student account.'
              : 'Login to continue your learning journey.'}
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="relative z-10 w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {isSignup ? 'Sign up with Google' : 'Continue with Google'}
        </button>

        <div className="relative my-6 flex items-center">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-slate-400">or use email</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 relative z-10">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Full name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/40" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email address</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/40" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/40" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {errorMessage && <p role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg p-3">{errorMessage}</p>}
          <button disabled={isSubmitting} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold transition-colors">
            {isSubmitting ? 'Please wait…' : isSignup ? 'Create student account' : 'Login to Concepta'}
          </button>
        </form>

        <div className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400 relative z-10">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Login
              </Link>
            </>
          ) : (
            <>
              New to Concepta?{' '}
              <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Signup
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
