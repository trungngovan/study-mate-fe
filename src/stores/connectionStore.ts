import { create } from 'zustand'
import api from '@/utils/api'

export interface UserBasic {
  id: number
  email: string
  full_name: string
  avatar_url: string
  school: number
  major: string
  year: number
  bio: string
}

export interface ConnectionRequest {
  id: number
  sender?: UserBasic
  receiver?: UserBasic
  // Alternative API response format with simplified fields
  sender_name?: string
  sender_avatar?: string
  receiver_name?: string
  receiver_avatar?: string
  state: 'pending' | 'accepted' | 'rejected' | 'blocked'
  message: string
  created_at: string
  updated_at?: string
  accepted_at?: string | null
  rejected_at?: string | null
  can_accept?: boolean
  can_reject?: boolean
  can_message?: boolean
}

export interface Connection {
  id: number
  user: UserBasic
  connection_state: 'accepted'
  accepted_at: string
  can_message: boolean
  conversation_id: number
}

interface ConnectionState {
  requests: ConnectionRequest[]
  sentRequests: ConnectionRequest[]
  receivedRequests: ConnectionRequest[]
  connections: Connection[]
  isLoading: boolean
  error: string | null

  // Pagination state for sent requests
  sentCurrentPage: number
  sentPageSize: number
  sentTotalCount: number
  sentHasNext: boolean
  sentHasPrevious: boolean

  // Pagination state for received requests
  receivedCurrentPage: number
  receivedPageSize: number
  receivedTotalCount: number
  receivedHasNext: boolean
  receivedHasPrevious: boolean

  // Pagination state for connections
  connCurrentPage: number
  connPageSize: number
  connTotalCount: number
  connHasNext: boolean
  connHasPrevious: boolean

  // Actions
  sendRequest: (receiverId: number, message: string) => Promise<ConnectionRequest>
  fetchAllData: () => Promise<void>
  fetchSentRequests: (page?: number) => Promise<void>
  fetchReceivedRequests: (page?: number) => Promise<void>
  fetchConnections: (page?: number) => Promise<void>
  acceptRequest: (requestId: number) => Promise<void>
  rejectRequest: (requestId: number) => Promise<void>
  blockRequest: (requestId: number) => Promise<void>
  cancelRequest: (requestId: number) => Promise<void>
  clearError: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  requests: [],
  sentRequests: [],
  receivedRequests: [],
  connections: [],
  isLoading: false,
  error: null,

  // Pagination state for sent requests
  sentCurrentPage: 1,
  sentPageSize: 10,
  sentTotalCount: 0,
  sentHasNext: false,
  sentHasPrevious: false,

  // Pagination state for received requests
  receivedCurrentPage: 1,
  receivedPageSize: 10,
  receivedTotalCount: 0,
  receivedHasNext: false,
  receivedHasPrevious: false,

  // Pagination state for connections
  connCurrentPage: 1,
  connPageSize: 10,
  connTotalCount: 0,
  connHasNext: false,
  connHasPrevious: false,

  sendRequest: async (receiverId, message) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/matching/requests/', {
        receiver_id: receiverId,
        message,
      })
      const newRequest = response.data

      // Add to requests list
      set((state) => ({
        requests: [newRequest, ...state.requests],
        isLoading: false,
      }))

      return newRequest
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to send request'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },

  fetchAllData: async () => {
    set({ isLoading: true, error: null })
    try {
      // Call all 3 APIs in parallel
      const [sentRes, receivedRes, connectionsRes] = await Promise.all([
        api.get('/matching/requests/sent/'),
        api.get('/matching/requests/received/'),
        api.get('/matching/connections/'),
      ])

      // Combine sent and received for the main requests list
      const allRequests = [
        ...(sentRes.data.results || []),
        ...(receivedRes.data.results || []),
      ]

      set({
        requests: allRequests,
        sentRequests: sentRes.data.results || [],
        sentTotalCount: sentRes.data.count || 0,
        sentHasNext: !!sentRes.data.next,
        sentHasPrevious: !!sentRes.data.previous,
        receivedRequests: receivedRes.data.results || [],
        receivedTotalCount: receivedRes.data.count || 0,
        receivedHasNext: !!receivedRes.data.next,
        receivedHasPrevious: !!receivedRes.data.previous,
        connections: connectionsRes.data.results || [],
        connTotalCount: connectionsRes.data.count || 0,
        connHasNext: !!connectionsRes.data.next,
        connHasPrevious: !!connectionsRes.data.previous,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch data'
      set({ error: errorMsg, isLoading: false })
    }
  },

  fetchSentRequests: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/matching/requests/sent/', { params: { page } })
      set({
        sentRequests: response.data.results || [],
        sentCurrentPage: page,
        sentTotalCount: response.data.count || 0,
        sentHasNext: !!response.data.next,
        sentHasPrevious: !!response.data.previous,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch sent requests'
      set({ error: errorMsg, isLoading: false })
    }
  },

  fetchReceivedRequests: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/matching/requests/received/', { params: { page } })
      set({
        receivedRequests: response.data.results || [],
        receivedCurrentPage: page,
        receivedTotalCount: response.data.count || 0,
        receivedHasNext: !!response.data.next,
        receivedHasPrevious: !!response.data.previous,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch received requests'
      set({ error: errorMsg, isLoading: false })
    }
  },

  fetchConnections: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/matching/connections/', { params: { page } })
      set({
        connections: response.data.results || [],
        connCurrentPage: page,
        connTotalCount: response.data.count || 0,
        connHasNext: !!response.data.next,
        connHasPrevious: !!response.data.previous,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to fetch connections'
      set({ error: errorMsg, isLoading: false })
    }
  },

  acceptRequest: async (requestId) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/matching/requests/${requestId}/accept/`)

      // Update request status in store - remove from received/sent lists
      set((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => r.id !== requestId),
        sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
        isLoading: false,
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to accept request'
      set({ error: errorMsg, isLoading: false })
    }
  },

  rejectRequest: async (requestId) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/matching/requests/${requestId}/reject/`)

      // Remove from received/sent lists
      set((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => r.id !== requestId),
        sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
        isLoading: false,
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to reject request'
      set({ error: errorMsg, isLoading: false })
    }
  },

  blockRequest: async (requestId) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/matching/requests/${requestId}/block/`)

      // Remove from received/sent lists
      set((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => r.id !== requestId),
        sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
        isLoading: false,
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to block'
      set({ error: errorMsg, isLoading: false })
    }
  },

  cancelRequest: async (requestId) => {
    set({ isLoading: true, error: null })
    try {
      await api.delete(`/matching/requests/${requestId}/`)

      // Remove from received/sent lists
      set((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => r.id !== requestId),
        sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
        isLoading: false,
      }))
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to cancel request'
      set({ error: errorMsg, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
