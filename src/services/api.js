// src/services/api.js
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(error)
  }
)

// Quiz Services
export const quizService = {
  getQuestions: async () => {
    try {
      const response = await apiClient.get('/quiz/questions')
      return response.data
    } catch (error) {
      console.error('Error fetching quiz questions:', error)
      throw error
    }
  },

  submitQuiz: async (answers) => {
    try {
      const response = await apiClient.post('/quiz/submit', { answers })
      return response.data
    } catch (error) {
      console.error('Error submitting quiz:', error)
      throw error
    }
  },

  getQuizResults: async (quizId) => {
    try {
      const response = await apiClient.get(`/quiz/${quizId}/results`)
      return response.data
    } catch (error) {
      console.error('Error fetching quiz results:', error)
      throw error
    }
  },
}

// User Services
export const userService = {
  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile')
      return response.data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/user/profile', userData)
      return response.data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  getProgress: async () => {
    try {
      const response = await apiClient.get('/user/progress')
      return response.data
    } catch (error) {
      console.error('Error fetching user progress:', error)
      throw error
    }
  },
}

// Learning Services
export const learningService = {
  getRoadmap: async () => {
    try {
      const response = await apiClient.get('/learning/roadmap')
      return response.data
    } catch (error) {
      console.error('Error fetching learning roadmap:', error)
      throw error
    }
  },

  getWeakTopics: async () => {
    try {
      const response = await apiClient.get('/learning/weak-topics')
      return response.data
    } catch (error) {
      console.error('Error fetching weak topics:', error)
      throw error
    }
  },

  getRecommendations: async () => {
    try {
      const response = await apiClient.get('/learning/recommendations')
      return response.data
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      throw error
    }
  },

  getCourses: async () => {
    try {
      const response = await apiClient.get('/learning/courses')
      return response.data
    } catch (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
  },
}

// AI Tutor Services
export const tutorService = {
  sendMessage: async (message, conversationId) => {
    try {
      const response = await apiClient.post('/tutor/chat', {
        message,
        conversation_id: conversationId,
      })
      return response.data
    } catch (error) {
      console.error('Error sending message to tutor:', error)
      throw error
    }
  },

  getConversations: async () => {
    try {
      const response = await apiClient.get('/tutor/conversations')
      return response.data
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  },

  getConversation: async (conversationId) => {
    try {
      const response = await apiClient.get(`/tutor/conversations/${conversationId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching conversation:', error)
      throw error
    }
  },

  createConversation: async (title) => {
    try {
      const response = await apiClient.post('/tutor/conversations', { title })
      return response.data
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  },
}

// Analytics Services
export const analyticsService = {
  getWeeklyProgress: async () => {
    try {
      const response = await apiClient.get('/analytics/weekly-progress')
      return response.data
    } catch (error) {
      console.error('Error fetching weekly progress:', error)
      throw error
    }
  },

  getTopicBreakdown: async () => {
    try {
      const response = await apiClient.get('/analytics/topic-breakdown')
      return response.data
    } catch (error) {
      console.error('Error fetching topic breakdown:', error)
      throw error
    }
  },

  getMasteryScores: async () => {
    try {
      const response = await apiClient.get('/analytics/mastery-scores')
      return response.data
    } catch (error) {
      console.error('Error fetching mastery scores:', error)
      throw error
    }
  },
}

// Authentication Services
export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
      }
      return response.data
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData)
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
      }
      return response.data
    } catch (error) {
      console.error('Error registering:', error)
      throw error
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('auth_token')
      return true
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  },
}

export default apiClient
