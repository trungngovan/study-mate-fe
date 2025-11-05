import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, Button, Input, Select, Avatar, Tag, Typography } from 'antd'
import { UserOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { notification } from 'antd'
import { Table, DatePicker, Space } from 'antd'
import api from '@/utils/api'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Title, Text } = Typography

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    major: user?.major || '',
    year: user?.year || 1,
    privacy_level: (user?.privacy_level as 'open' | 'friends_of_friends' | 'private') || 'open',
    learning_radius_km: user?.learning_radius_km || 5,
  })

  // Location state
  const { getCurrentLocation } = useGeolocation()
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number
    longitude: number
    last_updated: string
  } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyData, setHistoryData] = useState<{
    count: number
    next: string | null
    previous: string | null
    results: Array<{
      id: number
      latitude: number
      longitude: number
      recorded_at: string
      accuracy?: number
    }>
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  // Sync formData with user when user changes (only when not editing)
  useEffect(() => {
    if (!isEditing && user) {
      setFormData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        major: user.major || '',
        year: user.year || 1,
        privacy_level: (user.privacy_level as 'open' | 'friends_of_friends' | 'private') || 'open',
        learning_radius_km: user.learning_radius_km || 5,
      })
    }
  }, [user, isEditing])

  // Fetch current location from server
  const fetchCurrentLocation = async () => {
    try {
      const res = await api.get('/users/location/current/')
      setCurrentLocation(res.data)
    } catch (err) {
      console.error('Failed to fetch current location:', err)
    }
  }

  // Fetch history with optional filters
  const fetchHistory = async (url?: string) => {
    setHistoryLoading(true)
    try {
      if (url) {
        const res = await api.get(url)
        setHistoryData(res.data)
      } else {
        const params: Record<string, any> = { limit: pageSize, page: currentPage }
        if (dateRange?.[0]) params.from_date = dateRange[0]?.toISOString()
        if (dateRange?.[1]) params.to_date = dateRange[1]?.toISOString()
        const res = await api.get('/users/location/history/', { params })
        setHistoryData(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch location history:', err)
      notification.error({
        message: 'Error',
        description: 'Failed to load location history',
        placement: 'topRight',
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  // Init load
  useEffect(() => {
    fetchCurrentLocation()
  }, [])

  // Reload history when filters or pagination change
  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, dateRange])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleYearChange = (value: number) => {
    setFormData({ ...formData, year: value })
  }

  const handlePrivacyLevelChange = (value: 'open' | 'friends_of_friends' | 'private') => {
    setFormData({ ...formData, privacy_level: value })
  }

  const handleLearningRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setFormData({ ...formData, learning_radius_km: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(formData)
      notification.success({
        message: 'Success',
        description: 'Profile updated successfully!',
        placement: 'topRight',
      })
      setIsEditing(false)
      // formData will be synced with user via useEffect
    } catch (error) {
      console.error('Failed to update profile:', error)
      notification.error({
        message: 'Error',
        description: 'Failed to update profile',
        placement: 'topRight',
      })
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U'
    const names = name.trim().split(' ')
    if (names.length === 1) return names[0][0].toUpperCase()
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  const formatCoordinate = (value: unknown) => {
    const num = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(num) ? num.toFixed(6) : '—'
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div>
        <Title level={2}>My Profile</Title>
        <Text type="secondary">Manage your study profile</Text>
      </div>

      <Card>
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
          <Avatar
            size={120}
            src={user?.avatar_url || undefined}
            className="flex-shrink-0"
            icon={!user?.avatar_url && !user?.full_name ? <UserOutlined /> : undefined}
          >
            {!user?.avatar_url && user?.full_name ? getUserInitials(user.full_name) : null}
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <Title level={3} className="mb-2">{user?.full_name || 'No name'}</Title>
            {user?.bio && (
              <Text className="text-base">{user.bio}</Text>
            )}
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              {user?.major && (
                <Tag color="blue">{user.major}</Tag>
              )}
              {user?.year && (
                <Tag color="cyan">Year {user.year}</Tag>
              )}
              {user?.privacy_level && (
                <Tag color={
                  user.privacy_level === 'open' ? 'green' :
                  user.privacy_level === 'friends_of_friends' ? 'blue' : 'orange'
                }>
                  {user.privacy_level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Tag>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Profile Information">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-medium">Full Name</label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input
                id="email"
                value={user?.email || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
              <Input
                id="phone"
                value={user?.phone || 'Not set'}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="school" className="block text-sm font-medium">School</label>
              <Input
                id="school"
                value={user?.school_name || (user?.school !== null && user?.school !== undefined ? `School ID: ${user.school}` : 'Not set')}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="major" className="block text-sm font-medium">Major</label>
              <Input
                id="major"
                name="major"
                value={formData.major}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="year" className="block text-sm font-medium">Year</label>
              <Select
                id="year"
                value={formData.year}
                onChange={handleYearChange}
                disabled={!isEditing || isLoading}
                className="w-full"
                options={[1, 2, 3, 4, 5].map((y) => ({
                  value: y,
                  label: `Year ${y}`,
                }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="learning_radius" className="block text-sm font-medium">Learning Radius (km)</label>
              <Input
                id="learning_radius"
                name="learning_radius_km"
                type="number"
                step="0.1"
                value={formData.learning_radius_km}
                onChange={handleLearningRadiusChange}
                disabled={!isEditing || isLoading}
              />
              <p className="text-sm text-gray-600">
                Maximum distance to show nearby learners
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="privacy_level" className="block text-sm font-medium">Privacy Level</label>
              <Select
                id="privacy_level"
                value={formData.privacy_level}
                onChange={handlePrivacyLevelChange}
                disabled={!isEditing || isLoading}
                className="w-full"
                options={[
                  { value: 'open', label: 'Open (Anyone can view your profile)' },
                  { value: 'friends_of_friends', label: 'Friends & Friends of Friends' },
                  { value: 'private', label: 'Private (Only you can view)' },
                ]}
              />
              <p className="text-sm text-gray-600">
                Controls who can see your profile when browsing
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">Status</label>
              <div className="pt-1">
                {user?.status ? (
                  <Tag color={
                    user.status === 'active' ? 'green' :
                    user.status === 'banned' ? 'red' : 'gray'
                  }>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Tag>
                ) : (
                  <Text type="secondary">Not set</Text>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="last_active" className="block text-sm font-medium">Last Active</label>
              <Input
                id="last_active"
                value={user?.last_active_at
                  ? new Date(user.last_active_at).toLocaleString()
                  : 'Never'}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="member_since" className="block text-sm font-medium">Member Since</label>
              <Input
                id="member_since"
                value={user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
            <TextArea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={!isEditing || isLoading}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                type="primary"
                htmlType="button"
                onClick={(e) => {
                  e.preventDefault()
                  setIsEditing(true)
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  htmlType="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>
      </Card>

      {/* Location controls */}
      <Card title="Location">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Current Location</Text>
              <div className="mt-1">
                {currentLocation ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag icon={<EnvironmentOutlined />} color="processing">
                      {formatCoordinate(currentLocation.latitude)}, {formatCoordinate(currentLocation.longitude)}
                    </Tag>
                    <Text type="secondary">
                      <ClockCircleOutlined className="mr-1" />
                      Updated {currentLocation.last_updated ? new Date(currentLocation.last_updated).toLocaleString() : '—'}
                    </Text>
                  </div>
                ) : (
                  <Text type="secondary">Not available</Text>
                )}
              </div>
            </div>
            <Space>
              <Button
                onClick={async () => {
                  const result = await getCurrentLocation()
                  if (result) {
                    fetchCurrentLocation()
                    fetchHistory()
                  }
                }}
              >
                Update Current Location
              </Button>
              <Button onClick={fetchCurrentLocation}>Refresh</Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Location History */}
      <Card title="Location History">
        <div className="flex items-center justify-between mb-3">
          <Space>
            <RangePicker
              allowClear
              value={dateRange as any}
              onChange={(val) => {
                setCurrentPage(1)
                setDateRange(val as any)
              }}
              showTime
            />
            <Button type="primary" onClick={() => setCurrentPage(1)} loading={historyLoading}>
              Apply Filters
            </Button>
            <Button onClick={() => { setDateRange(null); setCurrentPage(1) }} disabled={historyLoading}>
              Clear
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={historyLoading}
          dataSource={historyData?.results || []}
          pagination={{
            current: currentPage,
            pageSize,
            total: historyData?.count || 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          onChange={(pagination) => {
            const nextPage = pagination.current || 1
            const nextSize = pagination.pageSize || pageSize
            const sizeChanged = nextSize !== pageSize
            setPageSize(nextSize)
            setCurrentPage(sizeChanged ? 1 : nextPage)
          }}
          columns={[
            {
              title: 'Recorded At',
              dataIndex: 'recorded_at',
              render: (v: string) => new Date(v).toLocaleString(),
            },
            {
              title: 'Latitude',
              dataIndex: 'latitude',
              render: (v: number) => v?.toFixed(6),
            },
            {
              title: 'Longitude',
              dataIndex: 'longitude',
              render: (v: number) => v?.toFixed(6),
            },
            {
              title: 'Accuracy (m)',
              dataIndex: 'accuracy',
              render: (v?: number) => (v != null ? v : '—'),
            },
          ]}
        />
        <div className="mt-3">
          <Text type="secondary">
            {historyData ? `Showing ${historyData.results.length} of ${historyData.count}` : 'No data'}
          </Text>
        </div>
      </Card>
    </div>
  )
}
