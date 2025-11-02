import { create } from 'zustand'
import api from '@/utils/api'

export interface StudySession {
  id: number
  title: string
  description?: string
  session_type: 'in_person' | 'virtual' | 'hybrid'
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  start_time: string
  duration_minutes: number
  location_name?: string
  meeting_link?: string
  participant_count: number
  is_host?: boolean
  is_participant?: boolean
}

interface CreateSessionInput {
  title: string
  description?: string
  session_type: 'in_person' | 'virtual' | 'hybrid'
  start_time: string
  duration_minutes: number
  location_name?: string
  latitude?: number
  longitude?: number
  meeting_link?: string
}

interface SessionState {
  sessions: StudySession[]
  isLoading: boolean
  error: string | null
  currentPage: number
  pageSize: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean

  // Actions
  fetchSessions: (filter?: string, page?: number) => Promise<void>
  getSessionDetails: (id: number) => Promise<StudySession | null>
  joinSession: (id: number) => Promise<void>
  leaveSession: (id: number) => Promise<void>
  createSession: (data: CreateSessionInput) => Promise<StudySession>
  updateSession: (id: number, data: CreateSessionInput) => Promise<StudySession>
  goToPage: (page: number, filter?: string) => Promise<void>
  clearError: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  hasNext: false,
  hasPrevious: false,

  fetchSessions: async (filter = 'upcoming', page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/sessions/', {
        params: { time_filter: filter, page },
      })
      const data = response.data
      set({
        sessions: data.results || [],
        currentPage: page,
        totalCount: data.count || 0,
        hasNext: !!data.next,
        hasPrevious: !!data.previous,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch sessions'
      set({ error: errorMsg, isLoading: false })
    }
  },

  getSessionDetails: async (id) => {
    try {
      const response = await api.get(`/sessions/${id}/`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch session details:', error)
      return null
    }
  },

  joinSession: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/sessions/${id}/join/`)
      // Update session in list to mark as participant
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, is_participant: true } : s
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to join session'
      set({ error: errorMsg, isLoading: false })
    }
  },

  leaveSession: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/sessions/${id}/leave/`)
      // Update session in list to mark as non-participant
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, is_participant: false } : s
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to leave session'
      set({ error: errorMsg, isLoading: false })
    }
  },

  createSession: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/sessions/', data)
      const newSession = response.data
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        isLoading: false,
      }))
      return newSession
    } catch (error: any) {
      // Extract error message - check for non_field_errors first
      let errorMsg = 'Failed to create session'
      const errorResponse = error.response?.data

      if (errorResponse?.non_field_errors && Array.isArray(errorResponse.non_field_errors)) {
        errorMsg = errorResponse.non_field_errors[0]
      } else if (errorResponse?.detail) {
        errorMsg = errorResponse.detail
      } else if (typeof errorResponse === 'object') {
        // Try to get first error message from any field
        const firstError = Object.values(errorResponse)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMsg = firstError[0]
        }
      }

      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  updateSession: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.patch(`/sessions/${id}/`, data)
      const updatedSession = response.data
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? updatedSession : s
        ),
        isLoading: false,
      }))
      return updatedSession
    } catch (error: any) {
      // Extract error message - check for non_field_errors first
      let errorMsg = 'Failed to update session'
      const errorResponse = error.response?.data

      if (errorResponse?.non_field_errors && Array.isArray(errorResponse.non_field_errors)) {
        errorMsg = errorResponse.non_field_errors[0]
      } else if (errorResponse?.detail) {
        errorMsg = errorResponse.detail
      } else if (typeof errorResponse === 'object') {
        // Try to get first error message from any field
        const firstError = Object.values(errorResponse)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMsg = firstError[0]
        }
      }

      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  goToPage: async (page, filter = 'upcoming') => {
    const state = useSessionStore.getState()
    await state.fetchSessions(filter, page)
  },

  clearError: () => set({ error: null }),
}))
