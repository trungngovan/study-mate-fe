import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import { ConfigProvider } from 'antd'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import DiscoverPage from '@/pages/DiscoverPage'
import ConnectionsPage from '@/pages/ConnectionsPage'
import ChatPage from '@/pages/ChatPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import StudySessionsPage from '@/pages/StudySessionsPage'
import SessionDetailPage from '@/pages/SessionDetailPage'
import StudyGroupsPage from '@/pages/StudyGroupsPage'
import GroupDetailPage from '@/pages/GroupDetailPage'

// Components
import Layout from '@/components/layout/Layout'
import PrivateRoute from '@/components/PrivateRoute'

export default function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // Call async restoreSession immediately - don't await
    // PrivateRoute will show loading spinner while it runs
    // Only run once on mount - restoreSession is stable from Zustand
    restoreSession().catch((error) => {
      console.error('Session restoration failed:', error)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  // Listen for storage events to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If access_token was added/updated in another tab and we're not authenticated, restore session
      if (e.key === 'access_token' && e.newValue && !isAuthenticated) {
        console.log('Token detected in other tab, restoring session...')
        restoreSession().catch((error) => {
          console.error('Session restoration failed:', error)
        })
      }
      // If access_token was removed in another tab and we're authenticated, logout
      if (e.key === 'access_token' && !e.newValue && isAuthenticated) {
        console.log('Token removed in other tab, logging out...')
        useAuthStore.getState().logout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isAuthenticated, restoreSession])

  return (
    <ConfigProvider
      theme={{
        token: {
          // Ant Design Primary Color
          colorPrimary: '#1677FF',
          colorInfo: '#1677FF',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          // Border and Layout
          colorBorder: '#d9d9d9',
          borderRadius: 8,
          // Typography
          fontSize: 14,
          colorText: 'rgba(0, 0, 0, 0.88)',
          colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
          colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
          colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
        },
        components: {
          Button: {
            primaryShadow: '0 2px 0 rgba(22, 119, 255, 0.1)',
          },
        },
      }}
    >
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sessions" element={<StudySessionsPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/groups" element={<StudyGroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}
