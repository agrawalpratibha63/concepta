import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  UserCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

// Custom Modern Brand SVG Logo
const BrandIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 drop-shadow-md">
    <path 
      d="M22 10.5C22 10.5 19 5 13 5C7 5 4 11 4 16C4 21 7 27 13 27C19 27 22 21.5 22 21.5" 
      stroke="url(#brandGrad)" 
      strokeWidth="4.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <circle cx="22" cy="21.5" r="3.5" fill="url(#brandGrad)" />
    <circle cx="22" cy="10.5" r="3.5" fill="url(#brandGrad)" />
    <defs>
      <linearGradient id="brandGrad" x1="4" y1="5" x2="24" y2="27" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4F46E5" /> {/* Indigo */}
        <stop offset="1" stopColor="#8B5CF6" /> {/* Violet */}
      </linearGradient>
    </defs>
  </svg>
)

export default function Navbar({ isDarkMode, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userRole, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Quiz', href: '/quiz' },
    { label: 'AI Tutor', href: '/tutor' },
    { label: 'PDF Notes', href: '/pdf-notes' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'My Learning', href: '/my-learning' },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
      navigate('/login')
    } catch (error) {
      console.error(error)
      alert('Logout failed.')
    }
  }

  return (
    <nav className="concepta-nav fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5"
            >
              <BrandIcon />
              {/* Clean SaaS Typography */}
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                Concepta<span className="text-indigo-600 dark:text-indigo-400">.</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`nav-link ${location.pathname === item.href ? 'nav-link-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* 👑 Founder Admin Panel Button (Desktop) */}
            {userRole === 'founder' && (
              <Link
                to="/admin-panel"
                className="ml-2 px-3 py-2 rounded-lg text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </motion.button>

            {user ? (
              <div className="hidden md:flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  )}

                  <div className="hidden lg:block max-w-[150px] pr-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="nav-signup"
                >
                  Signup
                </Link>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shadow-xl absolute left-0 right-0"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  {item.label}
                </Link>
              ))}
              
              {/* 👑 Founder Admin Panel Button (Mobile) */}
              {userRole === 'founder' && (
                <Link
                  to="/admin-panel"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 mt-2 rounded-lg text-base font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
