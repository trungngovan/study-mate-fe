import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Tabs, Input, Select, TabsProps, Modal, Popconfirm, DatePicker, QRCode, message, Empty } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useSessionStore } from '@/stores/sessionStore'
import { useToast } from '@/stores/notificationStore'
import Pagination from '@/components/Pagination'
import { Clock, MapPin, Users, Edit, Share2, Copy, Download } from 'lucide-react'

export default function StudySessionsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    sessions,
    isLoading,
    fetchSessions,
    goToPage,
    currentPage,
    totalCount,
    pageSize,
    hasNext,
    hasPrevious,
    joinSession,
    leaveSession,
    createSession,
    updateSession,
  } = useSessionStore()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [leavingId, setLeavingId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    session_type: 'in_person' | 'virtual' | 'hybrid'
    start_time: Dayjs | null
    duration_minutes: number
    location_name?: string
    meeting_link?: string
  }>({
    title: '',
    description: '',
    session_type: 'virtual',
    start_time: null,
    duration_minutes: 60,
    location_name: '',
    meeting_link: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [editingSession, setEditingSession] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharingSession, setSharingSession] = useState<any>(null)
  const qrCodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handlePageChange = async (newPage: number) => {
    await goToPage(newPage, activeTab)
  }

  const handleJoin = async (sessionId: number) => {
    setJoiningId(sessionId)
    try {
      await joinSession(sessionId)
      toast.success('Joined session!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to join session')
    } finally {
      setJoiningId(null)
    }
  }

  const handleLeave = async (sessionId: number) => {
    setLeavingId(sessionId)
    try {
      await leaveSession(sessionId)
      toast.success('Left session!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to leave session')
    } finally {
      setLeavingId(null)
    }
  }

  const handleViewDetails = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`)
  }

  const handleShare = (session: any) => {
    setSharingSession(session)
    setShowShareModal(true)
  }

  const getShareUrl = (sessionId: number) => {
    return `${window.location.origin}/sessions/${sessionId}`
  }

  const handleCopyLink = async () => {
    if (!sharingSession) return
    try {
      const shareUrl = getShareUrl(sharingSession.id)
      await navigator.clipboard.writeText(shareUrl)
      message.success('Link copied to clipboard!')
    } catch (error) {
      message.error('Failed to copy link')
    }
  }

  const handleDownloadQR = () => {
    if (!sharingSession) return
    try {
      if (qrCodeRef.current) {
        const canvas = qrCodeRef.current.querySelector<HTMLCanvasElement>('canvas')
        if (canvas) {
          const url = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `session-${sharingSession.id}-qrcode.png`
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          message.success('QR code downloaded!')
        } else {
          message.error('QR code not ready yet')
        }
      }
    } catch (error) {
      console.error('Failed to download QR code:', error)
      message.error('Failed to download QR code')
    }
  }

  const handleOpenEdit = (session: any) => {
    // Pre-fill form with current session data
    const startTime = dayjs(session.start_time)
    
    setFormData({
      title: session.title || '',
      description: session.description || '',
      session_type: session.session_type || 'virtual',
      start_time: startTime,
      duration_minutes: session.duration_minutes || 60,
      location_name: session.location_name || '',
      meeting_link: session.meeting_link || '',
    })
    setEditingSession(session)
    setShowEditForm(true)
  }

  const handleUpdate = async () => {
    if (!editingSession) return
    
    if (!formData.title || !formData.start_time) {
      toast.error('Please fill in required fields (title, start time)')
      return
    }

    // Validate location for in-person or hybrid sessions
    if ((formData.session_type === 'in_person' || formData.session_type === 'hybrid') && !formData.location_name?.trim()) {
      toast.error('Location is required for in-person or hybrid sessions')
      return
    }

    // Format start_time to ISO 8601
    const startTime = formData.start_time.toISOString()

    setIsUpdating(true)
    try {
      // Prepare data to send - only include fields that are provided
      const sessionData: any = {
        title: formData.title,
        description: formData.description || undefined,
        session_type: formData.session_type,
        start_time: startTime,
        duration_minutes: formData.duration_minutes,
      }

      // Only include location_name if it's provided and not empty
      if (formData.location_name?.trim()) {
        sessionData.location_name = formData.location_name.trim()
      }

      // Only include meeting_link if it's provided and not empty, and session type is not in_person only
      if (
        formData.meeting_link?.trim() &&
        formData.session_type !== 'in_person'
      ) {
        sessionData.meeting_link = formData.meeting_link.trim()
      }

      await updateSession(editingSession.id, sessionData)
      toast.success('Session updated successfully!')
      setShowEditForm(false)
      setEditingSession(null)
      // Refresh sessions list
      await fetchSessions(activeTab)
    } catch (err: any) {
      // Extract error message from API response
      const errorResponse = err?.response?.data
      let errorMessage = 'Failed to update session'
      
      if (errorResponse?.non_field_errors) {
        errorMessage = errorResponse.non_field_errors[0]
      } else if (errorResponse?.detail) {
        errorMessage = errorResponse.detail
      } else if (typeof errorResponse === 'object') {
        // Try to get first error message from any field
        const firstError = Object.values(errorResponse)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0]
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.start_time) {
      toast.error('Please fill in required fields (title, start time)')
      return
    }

    // Validate location for in-person or hybrid sessions
    if ((formData.session_type === 'in_person' || formData.session_type === 'hybrid') && !formData.location_name?.trim()) {
      toast.error('Location is required for in-person or hybrid sessions')
      return
    }

    // Format start_time to ISO 8601
    const startTime = formData.start_time.toISOString()

    setIsCreating(true)
    try {
      // Prepare data to send - only include fields that are provided
      const sessionData: any = {
        title: formData.title,
        description: formData.description || undefined,
        session_type: formData.session_type,
        start_time: startTime,
        duration_minutes: formData.duration_minutes,
      }

      // Only include location_name if it's provided and not empty
      if (formData.location_name?.trim()) {
        sessionData.location_name = formData.location_name.trim()
      }

      // Only include meeting_link if it's provided and not empty, and session type is not in_person only
      if (
        formData.meeting_link?.trim() &&
        formData.session_type !== 'in_person'
      ) {
        sessionData.meeting_link = formData.meeting_link.trim()
      }

      await createSession(sessionData)
      toast.success('Session created successfully!')
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        session_type: 'virtual',
        start_time: null,
        duration_minutes: 60,
        location_name: '',
        meeting_link: '',
      })
      // Refresh sessions list
      await fetchSessions(activeTab)
    } catch (err: any) {
      // Extract error message from API response
      const errorResponse = err?.response?.data
      let errorMessage = 'Failed to create session'
      
      if (errorResponse?.non_field_errors) {
        errorMessage = errorResponse.non_field_errors[0]
      } else if (errorResponse?.detail) {
        errorMessage = errorResponse.detail
      } else if (typeof errorResponse === 'object') {
        // Try to get first error message from any field
        const firstError = Object.values(errorResponse)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0]
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Sessions</h1>
          <p className="text-gray-600 mt-2">Find and join study sessions</p>
        </div>
        <Button type="primary" onClick={() => setShowCreateForm(true)}>Create Session</Button>
      </div>

      {/* Create Session Modal */}
      <Modal
        title="Create New Session"
        open={showCreateForm}
        onCancel={() => setShowCreateForm(false)}
        onOk={handleCreate}
        confirmLoading={isCreating}
        okText={isCreating ? 'Creating...' : 'Create Session'}
        cancelText="Cancel"
        width={600}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Calculus Study Group"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Session Type *</label>
              <Select
                value={formData.session_type}
                onChange={(value) => {
                  const newSessionType = value as 'in_person' | 'virtual' | 'hybrid'
                  // Clear fields that are not relevant for the new session type
                  setFormData({
                    ...formData,
                    session_type: newSessionType,
                    // Clear meeting_link if switching to in_person only
                    meeting_link: newSessionType === 'in_person' ? '' : formData.meeting_link,
                    // Clear location_name if switching to virtual only
                    location_name: newSessionType === 'virtual' ? '' : formData.location_name,
                  })
                }}
                className="w-full"
                options={[
                  { value: 'virtual', label: 'Virtual' },
                  { value: 'in_person', label: 'In-person' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                }
                min="15"
                max="480"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Time *</label>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              value={formData.start_time}
              onChange={(date) => setFormData({ ...formData, start_time: date })}
              className="w-full"
              placeholder="Select date and time"
            />
          </div>

          {(formData.session_type === 'in_person' || formData.session_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <Input
                value={formData.location_name || ''}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="e.g., Library Room 101"
                required
              />
            </div>
          )}

          {(formData.session_type === 'virtual' || formData.session_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Link</label>
              <Input
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="e.g., https://zoom.us/j/..."
              />
            </div>
          )}
        </div>
      </Modal>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            label: 'Upcoming',
            key: 'upcoming',
            children: (
              <div className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow" hoverable>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{session.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              color={session.session_type === 'in_person' ? 'blue' : 'green'}
                              text={
                                session.session_type === 'in_person'
                                  ? 'In-person'
                                  : session.session_type === 'virtual'
                                  ? 'Virtual'
                                  : 'Hybrid'
                              }
                            />
                            <Badge
                              color={
                                session.status === 'upcoming'
                                  ? 'orange'
                                  : session.status === 'in_progress'
                                  ? 'green'
                                  : 'gray'
                              }
                              text={
                                session.status === 'in_progress'
                                  ? 'In Progress'
                                  : session.status.charAt(0).toUpperCase() + session.status.slice(1)
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(session.start_time).toLocaleString()}
                            </span>
                          </div>
                          {session.location_name && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{session.participant_count ?? 0} participants</span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            icon={<Share2 className="h-4 w-4" />}
                            onClick={() => handleShare(session)}
                          >
                            Share
                          </Button>
                          {activeTab === 'upcoming' && (
                            <>
                              {session.is_host ? (
                                <Button
                                  icon={<Edit className="h-4 w-4" />}
                                  onClick={() => handleOpenEdit(session)}
                                >
                                  Edit Session
                                </Button>
                              ) : session.is_participant ? (
                                <Popconfirm
                                  title="Leave Session"
                                  description="Are you sure you want to leave this session?"
                                  onConfirm={() => handleLeave(session.id)}
                                  okText="Yes, Leave"
                                  cancelText="Cancel"
                                  okButtonProps={{ loading: leavingId === session.id }}
                                >
                                  <Button
                                    className="flex-1"
                                    loading={leavingId === session.id}
                                  >
                                    {leavingId === session.id ? 'Leaving...' : 'Leave Session'}
                                  </Button>
                                </Popconfirm>
                              ) : (
                                <Button
                                  type="primary"
                                  className="flex-1"
                                  onClick={() => handleJoin(session.id)}
                                  loading={joiningId === session.id}
                                >
                                  {joiningId === session.id ? 'Joining...' : 'Join Session'}
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            className="flex-1"
                            onClick={() => handleViewDetails(session.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <Empty description="No sessions found" />
                  </Card>
                )}

                {sessions.length > 0 && (
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
              </div>
            ),
          },
          {
            label: 'Past',
            key: 'past',
            children: (
              <div className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow" hoverable>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{session.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              color={session.session_type === 'in_person' ? 'blue' : 'green'}
                              text={
                                session.session_type === 'in_person'
                                  ? 'In-person'
                                  : session.session_type === 'virtual'
                                  ? 'Virtual'
                                  : 'Hybrid'
                              }
                            />
                            <Badge color="gray" text="Completed" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(session.start_time).toLocaleString()}
                            </span>
                          </div>
                          {session.location_name && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{session.participant_count ?? 0} participants</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleViewDetails(session.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <Empty description="No sessions found" />
                  </Card>
                )}

                {sessions.length > 0 && (
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
              </div>
            ),
          },
        ] as TabsProps['items']}
      />

      {/* Share Session Modal */}
      <Modal
        title="Share Session"
        open={showShareModal}
        onCancel={() => {
          setShowShareModal(false)
          setSharingSession(null)
        }}
        footer={null}
        width={500}
      >
        {sharingSession && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div ref={qrCodeRef} className="bg-white p-4 rounded-lg border">
                <QRCode
                  value={getShareUrl(sharingSession.id)}
                  size={200}
                  errorLevel="M"
                  type="canvas"
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Scan this QR code to view and join the session
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={getShareUrl(sharingSession.id)}
                  readOnly
                  className="flex-1"
                />
                <Button
                  icon={<Copy className="h-4 w-4" />}
                  onClick={handleCopyLink}
                >
                  Copy
                </Button>
              </div>
              <Button
                icon={<Download className="h-4 w-4" />}
                onClick={handleDownloadQR}
                block
              >
                Download QR Code
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                Share this link or QR code with others to allow them to view and join this session.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        title="Edit Session"
        open={showEditForm}
        onCancel={() => {
          setShowEditForm(false)
          setEditingSession(null)
        }}
        onOk={handleUpdate}
        confirmLoading={isUpdating}
        okText={isUpdating ? 'Updating...' : 'Update Session'}
        cancelText="Cancel"
        width={600}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Calculus Study Group"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Session Type *</label>
              <Select
                value={formData.session_type}
                onChange={(value) => {
                  const newSessionType = value as 'in_person' | 'virtual' | 'hybrid'
                  setFormData({
                    ...formData,
                    session_type: newSessionType,
                    meeting_link: newSessionType === 'in_person' ? '' : formData.meeting_link,
                    location_name: newSessionType === 'virtual' ? '' : formData.location_name,
                  })
                }}
                className="w-full"
                options={[
                  { value: 'virtual', label: 'Virtual' },
                  { value: 'in_person', label: 'In-person' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                }
                min="15"
                max="480"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Time *</label>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              value={formData.start_time}
              onChange={(date) => setFormData({ ...formData, start_time: date })}
              className="w-full"
              placeholder="Select date and time"
            />
          </div>

          {(formData.session_type === 'in_person' || formData.session_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <Input
                value={formData.location_name || ''}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="e.g., Library Room 101"
                required
              />
            </div>
          )}

          {(formData.session_type === 'virtual' || formData.session_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Link</label>
              <Input
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="e.g., https://zoom.us/j/..."
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
