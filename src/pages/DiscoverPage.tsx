import { useState, useEffect } from 'react'
import { Card, Button, Input, Badge, Skeleton, Modal, InputNumber, Empty, Avatar, Tag } from 'antd'
import api from '@/utils/api'
import { useConnectionStore } from '@/stores/connectionStore'
import { useToast } from '@/stores/notificationStore'
import Pagination from '@/components/Pagination'
import { useGeolocation } from '@/hooks/useGeolocation'
import { LeafletMap } from '@/components/LeafletMap'
import { MapPin, MessageSquare, Map } from 'lucide-react'

const { TextArea } = Input

interface Learner {
  id: number
  email: string
  full_name: string
  avatar_url: string
  major: string
  year: number
  bio: string
  school_name: string
  distance_km: number
  latitude?: number
  longitude?: number
  privacy_level: 'open'
}

type ViewMode = 'grid' | 'map'

export default function DiscoverPage() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [radius, setRadius] = useState<number>(5)
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  const { sendRequest, clearError } = useConnectionStore()
  const toast = useToast()
  const { location: userLocation } = useGeolocation({ enableTracking: false })

  const fetchLearners = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/discover/nearby-learners/', {
        params: { radius, page: currentPage },
      })
      const data = response.data
      setLearners(data.results || [])
      setTotalCount(data.count || 0)
      setHasNext(!!data.next)
      setHasPrevious(!!data.previous)
    } catch (error) {
      console.error('Failed to fetch learners:', error)
      toast.error('Failed to load nearby learners')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLearners()
  }, [radius, currentPage]) // Fetch when radius or page changes

  // Reset to page 1 when radius changes
  useEffect(() => {
    setCurrentPage(1)
  }, [radius])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleRefresh = async () => {
    await fetchLearners()
  }

  const handleOpenDetail = (learner: Learner) => {
    setSelectedLearner(learner)
    setDetailModalOpen(true)
  }

  const handleOpenRequest = () => {
    setRequestModalOpen(true)
    setRequestMessage('')
    clearError()
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setSelectedLearner(null)
  }

  const handleCloseRequest = () => {
    setRequestModalOpen(false)
    setRequestMessage('')
  }

  const handleSendRequest = async () => {
    if (!selectedLearner) return

    if (!requestMessage.trim()) {
      toast.warning('Please enter a message')
      return
    }

    setIsSubmitting(true)
    clearError()

    try {
      await sendRequest(selectedLearner.id, requestMessage)
      toast.success(`Connection request sent to ${selectedLearner.full_name}!`)
      setRequestModalOpen(false)
      setDetailModalOpen(false)
      setRequestMessage('')
      setSelectedLearner(null)

      // Remove learner from list
      setLearners((prev) => prev.filter((l) => l.id !== selectedLearner.id))
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send connection request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    const names = name.trim().split(' ')
    if (names.length === 1) return names[0][0].toUpperCase()
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Discover Learners</h1>
          <p className="text-gray-600 mt-2">
            Find study buddies studying nearby
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <label htmlFor="radius" className="text-sm mb-2 block">
              Search Radius
            </label>
            <InputNumber
              id="radius"
              placeholder="5"
              value={radius}
              onChange={(value) => setRadius(value || 0)}
              min={0}
              step={1}
              suffix="km"
              className="w-full"
            />
          </div>
          <div className="flex gap-2 self-end">
            <Button
              type={viewMode === 'map' ? 'primary' : 'default'}
              onClick={() => setViewMode('map')}
              disabled={!userLocation}
              icon={<Map className="h-4 w-4" />}
            >
              Map
            </Button>
            <Button onClick={handleRefresh} loading={isLoading}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* View content */}
      {viewMode === 'map' && userLocation ? (
        // Map view
        <Card>
          <div className="p-0">
            <LeafletMap
              userLocation={{
                lat: userLocation.latitude,
                lng: userLocation.longitude,
              }}
              learners={learners.map((l) => ({
                id: l.id,
                name: l.full_name,
                latitude: l.latitude || 0,
                longitude: l.longitude || 0,
                distance: l.distance_km,
                avatar: l.avatar_url,
              }))}
              onMarkerClick={(learnerId) => {
                const learner = learners.find((l) => l.id === learnerId)
                if (learner) {
                  handleOpenDetail(learner)
                }
              }}
            />
          </div>
        </Card>
      ) : (
        // Grid view
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              ))}
            </div>
          ) : learners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {learners.map((learner) => (
                <Card
                  key={learner.id}
                  hoverable
                  className="flex flex-col cursor-pointer"
                  onClick={() => handleOpenDetail(learner)}
                >
                  <div className="space-y-3">
                    {/* Avatar */}
                    <div className="flex justify-center">
                      {learner.avatar_url ? (
                        <img
                          src={learner.avatar_url}
                          alt={learner.full_name}
                          className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <Avatar size={80} className="bg-gray-200">
                          {getUserInitials(learner.full_name)}
                        </Avatar>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-semibold line-clamp-1">{learner.full_name}</h3>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{learner.distance_km.toFixed(2)}km</span>
                      </div>
                    </div>

                    {/* Quick tags */}
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <Tag color="blue" className="text-xs">
                        {learner.major}
                      </Tag>
                      <Tag color="cyan" className="text-xs">
                        Y{learner.year}
                      </Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <Empty
                description={
                  <div>
                    <p className="text-gray-600">No learners found nearby</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Try increasing your search radius
                    </p>
                  </div>
                }
              />
            </Card>
          )}

          {learners.length > 0 && (
            <Pagination
              currentPage={currentPage}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {/* User Detail Modal */}
      <Modal
        title={null}
        open={detailModalOpen}
        onCancel={handleCloseDetail}
        footer={null}
        width={600}
      >
        {selectedLearner && (
          <div className="space-y-6">
            {/* Header with Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b">
              <Avatar
                size={100}
                src={selectedLearner.avatar_url || undefined}
                className="flex-shrink-0"
              >
                {!selectedLearner.avatar_url && getUserInitials(selectedLearner.full_name)}
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-2">{selectedLearner.full_name}</h2>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-3">
                  <Tag color="blue">{selectedLearner.major}</Tag>
                  <Tag color="cyan">Year {selectedLearner.year}</Tag>
                  <Badge color="blue">{selectedLearner.school_name}</Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedLearner.distance_km.toFixed(2)}km away</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {selectedLearner.bio && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                <p className="text-gray-600">{selectedLearner.bio}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Email</h3>
                <p className="text-gray-600 text-sm">{selectedLearner.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Major</h3>
                <p className="text-gray-600 text-sm">{selectedLearner.major}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Year</h3>
                <p className="text-gray-600 text-sm">Year {selectedLearner.year}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">School</h3>
                <p className="text-gray-600 text-sm">{selectedLearner.school_name}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t">
              <Button
                type="primary"
                size="large"
                className="w-full"
                onClick={handleOpenRequest}
                icon={<MessageSquare className="h-4 w-4" />}
              >
                Send Connection Request
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Connection Request Modal */}
      <Modal
        title="Send Connection Request"
        open={requestModalOpen}
        onCancel={handleCloseRequest}
        onOk={handleSendRequest}
        confirmLoading={isSubmitting}
        okButtonProps={{ disabled: !requestMessage.trim() }}
        okText={isSubmitting ? 'Sending...' : 'Send Request'}
      >
        <p className="text-gray-600 mb-4">
          Send a message to {selectedLearner?.full_name} to start studying together
        </p>

        <div className="space-y-4">
          {/* Learner Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {selectedLearner?.avatar_url ? (
              <img
                src={selectedLearner.avatar_url}
                alt={selectedLearner.full_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <Avatar size={48} className="bg-gray-200">
                {selectedLearner && getUserInitials(selectedLearner.full_name)}
              </Avatar>
            )}
            <div className="flex-1">
              <p className="font-semibold">{selectedLearner?.full_name}</p>
              <p className="text-sm text-gray-600">
                {selectedLearner?.major} • Year {selectedLearner?.year}
              </p>
            </div>
          </div>

          {/* Message field */}
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">Message</label>
            <TextArea
              id="message"
              placeholder="Hi! I'd love to study together. What subjects are you focusing on?"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Keep it friendly and specific about study topics
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
