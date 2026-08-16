// src/hooks/useLearningState.js
import { useState, useCallback } from 'react'

export const useLearningState = () => {
  const [userProfile, setUserProfile] = useState({
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    level: 'intermediate',
    streak: 12,
    totalLearningTime: 18.38,
  })

  const [weakTopics, setWeakTopics] = useState([
    { name: 'Calculus', mastery: 45 },
    { name: 'Polynomials', mastery: 61 },
    { name: 'Trigonometry', mastery: 55 },
  ])

  const [learningProgress, setLearningProgress] = useState({
    algebra: 85,
    geometry: 62,
    calculus: 45,
    statistics: 72,
  })

  const updateProgress = useCallback((topic, newProgress) => {
    setLearningProgress((prev) => ({
      ...prev,
      [topic]: Math.min(newProgress, 100),
    }))
  }, [])

  const updateStreak = useCallback((newStreak) => {
    setUserProfile((prev) => ({
      ...prev,
      streak: newStreak,
    }))
  }, [])

  return {
    userProfile,
    setUserProfile,
    weakTopics,
    setWeakTopics,
    learningProgress,
    updateProgress,
    updateStreak,
  }
}

export default useLearningState
