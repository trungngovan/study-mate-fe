import { create } from 'zustand'
import api from '@/utils/api'

export interface StudyGroup {
  id: number
  name: string
  description: string
  privacy: 'public' | 'private' | 'invite_only'
  member_count: number
  created_by: { id?: number; full_name: string }
  is_member?: boolean
  is_admin?: boolean
  user_role?: 'admin' | 'moderator' | 'member'
  can_edit?: boolean
}

interface CreateGroupInput {
  name: string
  description: string
  privacy: 'public' | 'private' | 'invite_only'
}

interface GroupState {
  groups: StudyGroup[]
  isLoading: boolean
  error: string | null
  currentPage: number
  pageSize: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean

  // Actions
  fetchGroups: (search?: string, page?: number) => Promise<void>
  getGroupDetails: (id: number) => Promise<StudyGroup | null>
  joinGroup: (id: number) => Promise<void>
  leaveGroup: (id: number) => Promise<void>
  createGroup: (data: CreateGroupInput) => Promise<StudyGroup>
  updateGroup: (id: number, data: CreateGroupInput) => Promise<StudyGroup>
  deleteGroup: (id: number) => Promise<void>
  goToPage: (page: number, search?: string) => Promise<void>
  clearError: () => void
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  hasNext: false,
  hasPrevious: false,

  fetchGroups: async (search = '', page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/groups/', {
        params: { search, page },
      })
      const data = response.data
      set({
        groups: data.results || [],
        currentPage: page,
        totalCount: data.count || 0,
        hasNext: !!data.next,
        hasPrevious: !!data.previous,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch groups'
      set({ error: errorMsg, isLoading: false })
    }
  },

  getGroupDetails: async (id) => {
    try {
      const response = await api.get(`/groups/${id}/`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch group details:', error)
      return null
    }
  },

  joinGroup: async (id) => {
    // Don't set isLoading here to avoid triggering full page reloads
    // Components will manage their own loading states
    try {
      await api.post(`/groups/${id}/join/`)
      // Update group in list to mark as member
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, is_member: true, member_count: g.member_count + 1 } : g
        ),
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to join group'
      set({ error: errorMsg })
      throw error
    }
  },

  leaveGroup: async (id) => {
    // Don't set isLoading here to avoid triggering full page reloads
    // Components will manage their own loading states
    try {
      await api.post(`/groups/${id}/leave/`)
      // Update group in list to mark as non-member
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, is_member: false, member_count: Math.max(0, g.member_count - 1) } : g
        ),
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to leave group'
      set({ error: errorMsg })
      throw error
    }
  },

  createGroup: async (data) => {
    // Don't set isLoading here to avoid triggering full page reloads
    // Components will manage their own loading states
    try {
      const response = await api.post('/groups/', data)
      const newGroup = response.data
      set((state) => ({
        groups: [newGroup, ...state.groups],
      }))
      return newGroup
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to create group'
      set({ error: errorMsg })
      throw error
    }
  },

  updateGroup: async (id, data) => {
    // Don't set isLoading here to avoid triggering full page reloads
    // Components will manage their own loading states
    try {
      const response = await api.patch(`/groups/${id}/`, data)
      const updatedGroup = response.data
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? updatedGroup : g)),
      }))
      return updatedGroup
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to update group'
      set({ error: errorMsg })
      throw error
    }
  },

  deleteGroup: async (id) => {
    // Don't set isLoading here to avoid triggering full page reloads
    // Components will manage their own loading states
    try {
      await api.delete(`/groups/${id}/`)
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete group'
      set({ error: errorMsg })
      throw error
    }
  },

  goToPage: async (page, search = '') => {
    const state = useGroupStore.getState()
    await state.fetchGroups(search, page)
  },

  clearError: () => set({ error: null }),
}))
