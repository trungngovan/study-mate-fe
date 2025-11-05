import { create } from 'zustand'
import api from '@/utils/api'

export interface User {
  id: number
  email: string
  phone: string
  full_name: string
  school: number
  school_name: string
  major: string
  year: number
  bio: string
  avatar_url: string
  learning_radius_km: number
  privacy_level: 'open' | 'friends_of_friends' | 'private'
  status: 'active' | 'banned' | 'deleted'
  last_active_at: string | null
  created_at: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  register: (data: any) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true - will be set to false after restoreSession completes or fails
  error: null,

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/auth/register/', data)
      const { user, tokens } = response.data

      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)

      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Registration failed'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/auth/login/', { email, password })
      const { user, tokens } = response.data

      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)

      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Login failed'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  restoreSession: async () => {
    console.log('🔄 Starting session restoration...')
    console.log('🌍 Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
    const accessToken = localStorage.getItem('access_token')
    console.log('🔑 Token found:', !!accessToken)
    if (accessToken) {
      console.log('🔑 Token length:', accessToken.length)
    }

    if (accessToken) {
      set({ isAuthenticated: true, isLoading: true })
      try {
        console.log('📡 Fetching user profile...')
        const response = await api.get('/auth/profile/')
        console.log('✅ Profile fetch successful:', response.data)
        set({
          user: response.data,
          isAuthenticated: true, // Explicitly set again
          isLoading: false,
          error: null
        })
        console.log('✅ Session restored successfully')
      } catch (error: any) {
        console.error('❌ Failed to restore session:', error)
        // Token might be invalid, clear it
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired. Please login again.'
        })
        console.log('🧹 Token cleared, user logged out')
      }
    } else {
      // No token found
      console.log('⚠️ No token found in localStorage')
      set({ isLoading: false, isAuthenticated: false })
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/auth/profile/')
      set({ user: response.data, isLoading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch profile'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.patch('/auth/profile/', data)
      set({ user: response.data, isLoading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to update profile'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPassword,
      })
      set({ isLoading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to change password'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
