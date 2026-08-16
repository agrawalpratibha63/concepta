import { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminDashboard from './pages/AdminDashboard'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import QuizPage from './pages/QuizPage'
import AITutorPage from './pages/AITutorPage'
import RoadmapPage from './pages/RoadmapPage'
import PDFNotesPage from './pages/PDFNotesPage'
import LoginPage from './pages/LoginPage'
import MyLearningPage from './pages/MyLearningPage'

import { useAuth } from './context/AuthContext'

// 🛡️ Standard Protected Route (For All Logged-in Users / Students)
function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

// 👑 Founder/Admin Route (Only for You)
function FounderRoute({ children }) {
  const { user, userRole, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Check if user exists AND their role is 'founder'
  if (!user) return <Navigate to="/login" replace />
  if (userRole !== 'founder') return <Navigate to="/dashboard" replace />

  return children
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    } else {
      setIsDarkMode(
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage mode="login" />} />
            <Route path="/signup" element={<LoginPage mode="signup" />} />

            {/* Student/Shared Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor"
              element={
                <ProtectedRoute>
                  <AITutorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute>
                  <RoadmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pdf-notes"
              element={
                <ProtectedRoute>
                  <PDFNotesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/my-learning" element={<ProtectedRoute><MyLearningPage /></ProtectedRoute>} />

           {/* Founder Only Route (Admin Panel) */}
<Route
  path="/admin-panel"
  element={
    <FounderRoute>
      <AdminDashboard />
    </FounderRoute>
  }
/>
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  )
}

export default App
