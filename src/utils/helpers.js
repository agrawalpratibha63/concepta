// src/utils/helpers.js

/**
 * Format time remaining in MM:SS format
 */
export const formatTimeRemaining = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate mastery percentage
 */
export const calculateMastery = (correct, total) => {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

/**
 * Get color based on mastery level
 */
export const getMasteryColor = (mastery) => {
  if (mastery >= 80) return 'text-green-500'
  if (mastery >= 60) return 'text-cyan-500'
  if (mastery >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

/**
 * Get background color based on mastery level
 */
export const getMasteryBgColor = (mastery) => {
  if (mastery >= 80) return 'bg-green-500/10'
  if (mastery >= 60) return 'bg-cyan-500/10'
  if (mastery >= 40) return 'bg-yellow-500/10'
  return 'bg-red-500/10'
}

/**
 * Format large numbers
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Calculate days until mastery
 */
export const calculateDaysToMastery = (currentMastery, learningRatePerDay = 5) => {
  const targetMastery = 90
  const remainingProgress = Math.max(0, targetMastery - currentMastery)
  return Math.ceil(remainingProgress / learningRatePerDay)
}

/**
 * Get achievement badge based on stats
 */
export const getAchievements = (stats) => {
  const achievements = []

  if (stats.streak >= 7) achievements.push({ emoji: '🔥', label: 'Week Warrior' })
  if (stats.averageMastery >= 90) achievements.push({ emoji: '⭐', label: '100% Accuracy' })
  if (stats.totalLearningTime >= 100) achievements.push({ emoji: '📚', label: 'Learning Legend' })
  if (stats.topicsCompleted >= 5) achievements.push({ emoji: '🏆', label: 'Master Scholar' })

  return achievements
}

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Get reading time estimate (words per minute)
 */
export const getReadingTime = (text, wordsPerMinute = 200) => {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return minutes
}
