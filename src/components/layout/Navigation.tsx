import { Menu } from 'lucide-react'
import { Button, Dropdown, Avatar } from 'antd'
import type { MenuProps } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

interface NavigationProps {
  onMenuClick: () => void
}

export default function Navigation({ onMenuClick }: NavigationProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const initials = user?.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 md:hidden">
      <div className="flex items-center justify-between">
        <Button
          type="text"
          icon={<Menu className="h-5 w-5" />}
          onClick={onMenuClick}
          className="md:hidden"
        />

        <h1 className="text-lg font-semibold">StudyMate</h1>

        <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
          <Button type="text" shape="circle" className="p-0">
            <Avatar size="small" src={user?.avatar_url}>
              {initials}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </nav>
  )
}
