import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

// Custom Modern Brand SVG Logo (Consistent with Navbar)
const BrandIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 drop-shadow-md">
    <path 
      d="M22 10.5C22 10.5 19 5 13 5C7 5 4 11 4 16C4 21 7 27 13 27C19 27 22 21.5 22 21.5" 
      stroke="url(#brandGradFooter)" 
      strokeWidth="4.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <circle cx="22" cy="21.5" r="3.5" fill="url(#brandGradFooter)" />
    <circle cx="22" cy="10.5" r="3.5" fill="url(#brandGradFooter)" />
    <defs>
      <linearGradient id="brandGradFooter" x1="4" y1="5" x2="24" y2="27" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4F46E5" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
)

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5">
            <Link to="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <BrandIcon />
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Concepta<span className="text-indigo-600 dark:text-indigo-400">.</span>
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed pr-4">
              A personalized learning workspace for Class 11 Commerce—clear concepts, focused practice and progress that makes sense.
            </p>
          </div>

          {/* Product Links */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2 lg:col-start-7">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Product</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link to="/dashboard" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/tutor" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">AI Tutor</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Resources</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/quiz" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Practice Quiz</Link></li>
              <li><Link to="/pdf-notes" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">PDF Notes</Link></li>
              <li><a href="mailto:agrawalpratibha63@gmail.com" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse md:flex-row justify-between items-center gap-6">
          
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © {currentYear} Concepta. All rights reserved.
          </p>
          
          {/* Legal Links */}
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span>Student privacy first</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-5">
            <a href="mailto:agrawalpratibha63@gmail.com" aria-label="Email Concepta" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
          
        </div>
      </div>
    </footer>
  )
}
