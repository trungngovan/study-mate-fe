import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import {
  Home,
  Search,
  MessageSquare,
  Users,
  BookOpen,
  Settings,
  LogOut,
  X,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Search, label: 'Discover', path: '/discover' },
  { icon: Users, label: 'Connections', path: '/connections' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: BookOpen, label: 'Sessions', path: '/sessions' },
  { icon: Users, label: 'Groups', path: '/groups' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate() // from react-router-dom

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 border-r border-gray-200 bg-white md:flex md:flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-gray-200 px-4 py-6">
          <h1 className="text-2xl font-bold">StudyMate</h1>
        </div>

        {/* User profile section */}
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{user?.full_name}</p>
              <p className="truncate text-xs text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-blue-1'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom menu */}
        <div className="border-t border-gray-200 p-2">
           <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              location.pathname === '/profile'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-blue-1'
            )}
          >
            <User className="h-5 w-5" />
            Profile
          </Link>
          <Link
            to="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              location.pathname === '/settings'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-blue-1'
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-1"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white md:hidden flex flex-col">
          {/* Close button */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            <h1 className="text-2xl font-bold">StudyMate</h1>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User profile section */}
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
                {user?.full_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{user?.full_name}</p>
                <p className="truncate text-xs text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-blue-1'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Bottom menu */}
          <div className="border-t border-gray-200 p-2">
            <Link
              to="/profile"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                location.pathname === '/profile'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-blue-1'
              )}
            >
              <User className="h-5 w-5" />
              Profile
            </Link>
            <Link
              to="/settings"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                location.pathname === '/settings'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-blue-1'
              )}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-1"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
