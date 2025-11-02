import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Skeleton, Popconfirm, Modal, Input, Select, Pagination, Spin, QRCode, message, Empty } from 'antd'
import { useSessionStore } from '@/stores/sessionStore'
import { useToast } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { Clock, MapPin, Users, ArrowLeft, Edit, Share2, Copy, Download, Trash2 } from 'lucide-react'
import api from '@/utils/api'

interface Participant {
  id: number
  user: {
    id: number
    email: string
    full_name: string
    avatar_url?: string | null
    school?: string | null
    major?: string | null
    year?: number | null
  }
  status: string
  check_in_time?: string | null
  check_out_time?: string | null
  duration_minutes?: number | null
  notes?: string
  joined_at: string
  updated_at: string
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const { getSessionDetails, joinSession, leaveSession, updateSession } = useSessionStore()
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsPagination, setParticipantsPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  })
  const [formData, setFormData] = useState<{
    title: string
    description: string
    session_type: 'in_person' | 'virtual' | 'hybrid'
    start_time: string
    duration_minutes: number
    location_name?: string
    meeting_link?: string
  }>({
    title: '',
    description: '',
    session_type: 'virtual',
    start_time: '',
    duration_minutes: 60,
    location_name: '',
    meeting_link: '',
  })
  const [showShareModal, setShowShareModal] = useState(false)
  const qrCodeRef = useRef<HTMLDivElement>(null)

  const fetchParticipants = async (sessionId: number, page: number = 1, pageSize: number = 12) => {
    setParticipantsLoading(true)
    try {
      const response = await api.get(`/sessions/${sessionId}/participants/`, {
        params: { page, page_size: pageSize },
      })
      const data = response.data
      console.log('Participants API response:', data) // Debug log
      setParticipants(data.results || [])
      setParticipantsPagination({
        current: page,
        pageSize,
        total: data.count || 0,
      })
    } catch (error: any) {
      console.error('Failed to load participants:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to load participants'
      toast.error(errorMsg)
      setParticipants([])
      setParticipantsPagination({
        current: 1,
        pageSize: 12,
        total: 0,
      })
    } finally {
      setParticipantsLoading(false)
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      if (!id) return
      setIsLoading(true)
      setParticipants([])
      setParticipantsPagination({ current: 1, pageSize: 12, total: 0 })
      
      try {
        // Fetch session details
        const data = await getSessionDetails(parseInt(id))
        setSession(data)
      } catch (error) {
        console.error('Failed to load session:', error)
        toast.error('Failed to load session details')
      } finally {
        setIsLoading(false)
      }

      // Fetch participants separately (don't block on errors)
      try {
        await fetchParticipants(parseInt(id), 1, 12)
      } catch (error) {
        // Error already handled in fetchParticipants
        console.error('Failed to load participants:', error)
      }
    }

    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleParticipantsPageChange = (page: number, pageSize?: number) => {
    if (!id) return
    const newPageSize = pageSize || participantsPagination.pageSize
    fetchParticipants(parseInt(id), page, newPageSize)
  }

  const handleOpenEdit = () => {
    if (!session) return
    // Pre-fill form with current session data
    const startTime = new Date(session.start_time)
    const formattedTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    
    setFormData({
      title: session.title || '',
      description: session.description || '',
      session_type: session.session_type || 'virtual',
      start_time: formattedTime,
      duration_minutes: session.duration_minutes || 60,
      location_name: session.location_name || '',
      meeting_link: session.meeting_link || '',
    })
    setShowEditForm(true)
  }

  const handleUpdate = async () => {
    if (!session) return
    
    if (!formData.title || !formData.start_time) {
      toast.error('Please fill in required fields (title, start time)')
      return
    }

    // Validate location for in-person or hybrid sessions
    if ((formData.session_type === 'in_person' || formData.session_type === 'hybrid') && !formData.location_name?.trim()) {
      toast.error('Location is required for in-person or hybrid sessions')
      return
    }

    // Format start_time to ISO 8601 if needed
    let startTime = formData.start_time
    if (startTime && !startTime.includes('T')) {
      startTime = new Date(startTime).toISOString()
    }

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

      const updatedSession = await updateSession(session.id, sessionData)
      setSession(updatedSession)
      toast.success('Session updated successfully!')
      setShowEditForm(false)
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

  const handleJoin = async () => {
    if (!session) return
    setIsActioning(true)
    try {
      await joinSession(session.id)
      setSession({ ...session, is_participant: true })
      // Refresh participants list
      await fetchParticipants(session.id, participantsPagination.current, participantsPagination.pageSize)
      toast.success('Joined session!')
    } catch (error) {
      toast.error('Failed to join session')
    } finally {
      setIsActioning(false)
    }
  }

  const handleLeave = async () => {
    if (!session) return
    setIsActioning(true)
    try {
      await leaveSession(session.id)
      setSession({ ...session, is_participant: false })
      // Refresh participants list
      await fetchParticipants(session.id, participantsPagination.current, participantsPagination.pageSize)
      toast.success('Left session!')
    } catch (error) {
      toast.error('Failed to leave session')
    } finally {
      setIsActioning(false)
    }
  }

  const handleDelete = async () => {
    if (!session) return
    setIsDeleting(true)
    try {
      await api.delete(`/sessions/${session.id}/`)
      toast.success('Session deleted successfully!')
      // Navigate back to sessions list
      navigate('/sessions')
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete session'
      toast.error(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  const getShareUrl = () => {
    if (!session) return ''
    return `${window.location.origin}/sessions/${session.id}`
  }

  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl()
      await navigator.clipboard.writeText(shareUrl)
      message.success('Link copied to clipboard!')
    } catch (error) {
      message.error('Failed to copy link')
    }
  }

  const handleDownloadQR = () => {
    try {
      if (qrCodeRef.current) {
        const canvas = qrCodeRef.current.querySelector<HTMLCanvasElement>('canvas')
        if (canvas) {
          const url = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `session-${session?.id}-qrcode.png`
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

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/sessions')}>
          Back
        </Button>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/sessions')}>
          Back
        </Button>
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p>Session not found</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/sessions')}>
        Back
      </Button>

      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{session.title}</h1>
            {session.description && (
              <p className="text-gray-600 mt-2">{session.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Start Time</p>
                <p className="font-semibold">
                  {new Date(session.start_time).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{session.duration_minutes} minutes</p>
              </div>
            </div>

            {session.location_name && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{session.location_name}</p>
                </div>
              </div>
            )}

            {session.participant_count !== undefined && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-semibold">
                    {session.participant_count ?? 0}
                  </p>
                </div>
              </div>
            )}
          </div>

          {((session?.participant_count !== undefined && session.participant_count > 0) ||
            participants.length > 0 || 
            participantsPagination.total > 0) && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 font-medium">
                  Participants List{' '}
                  {(participantsPagination.total > 0 
                    ? `(${participantsPagination.total})`
                    : session?.participant_count !== undefined 
                      ? `(${session.participant_count})`
                      : '')}
                </p>
              </div>
              {participantsLoading ? (
                <div className="flex justify-center py-4">
                  <Spin size="small" />
                </div>
              ) : participants.length > 0 ? (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {participants.map((participant: Participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {participant.user.avatar_url ? (
                            <img
                              src={participant.user.avatar_url}
                              alt={participant.user.full_name}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-gray-600 font-semibold">
                                {participant.user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {participant.user.full_name}
                              {session?.host?.id === participant.user.id && (
                                <Badge
                                  color="blue"
                                  text="Host"
                                  style={{ marginLeft: 8 }}
                                />
                              )}
                            </p>
                            {participant.user.major && (
                              <p className="text-xs text-gray-500 truncate">
                                {participant.user.major}
                                {participant.user.year && ` • Year ${participant.user.year}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          status={
                            participant.status === 'registered'
                              ? 'default'
                              : participant.status === 'attended'
                              ? 'processing'
                              : participant.status === 'cancelled'
                              ? 'error'
                              : 'success'
                          }
                          text={
                            participant.status === 'registered'
                              ? 'Registered'
                              : participant.status === 'attended'
                              ? 'Attended'
                              : participant.status === 'cancelled'
                              ? 'Cancelled'
                              : 'No Show'
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {participantsPagination.total > participantsPagination.pageSize && (
                    <div className="flex justify-center pt-2">
                      <Pagination
                        current={participantsPagination.current}
                        pageSize={participantsPagination.pageSize}
                        total={participantsPagination.total}
                        onChange={handleParticipantsPageChange}
                        onShowSizeChange={handleParticipantsPageChange}
                        showSizeChanger
                        showQuickJumper
                        pageSizeOptions={['12', '24', '48', '96']}
                        showTotal={(total, range) =>
                          `${range[0]}-${range[1]} of ${total} participants`
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  description={<span className="text-gray-500 text-sm">No participants yet</span>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          )}

          {session.meeting_link && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-2">Meeting Link</p>
              <a
                href={session.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {session.meeting_link}
              </a>
            </div>
          )}

          <div className="border-t pt-6 flex gap-2 flex-wrap">
            <Button
              icon={<Share2 className="h-4 w-4" />}
              onClick={() => setShowShareModal(true)}
            >
              Share Session
            </Button>
            {(session.status === 'upcoming' || session.status === 'in_progress') && (
              <>
                {session.is_host || (session.host && user && session.host.id === user.id) ? (
                  <>
                    <Button
                      icon={<Edit className="h-4 w-4" />}
                      onClick={handleOpenEdit}
                    >
                      Edit Session
                    </Button>
                    {/* Show delete button only if user is host and has only 1 participant */}
                    {participantsPagination.total === 1 && (
                      <Popconfirm
                        title="Delete Session"
                        description="Are you sure you want to delete this session? This action cannot be undone."
                        onConfirm={handleDelete}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ loading: isDeleting, danger: true }}
                      >
                        <Button
                          danger
                          loading={isDeleting}
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Session'}
                        </Button>
                      </Popconfirm>
                    )}
                  </>
                ) : session.is_participant ? (
                  <Popconfirm
                    title="Leave Session"
                    description="Are you sure you want to leave this session?"
                    onConfirm={handleLeave}
                    okText="Yes, Leave"
                    cancelText="Cancel"
                    okButtonProps={{ loading: isActioning }}
                  >
                    <Button
                      loading={isActioning}
                      className="flex-1"
                    >
                      {isActioning ? 'Leaving...' : 'Leave Session'}
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleJoin}
                    loading={isActioning}
                    className="flex-1"
                  >
                    {isActioning ? 'Joining...' : 'Join Session'}
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Share Session Modal */}
          <Modal
            title="Share Session"
            open={showShareModal}
            onCancel={() => setShowShareModal(false)}
            footer={null}
            width={500}
          >
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div ref={qrCodeRef} className="bg-white p-4 rounded-lg border">
                  <QRCode
                    value={getShareUrl()}
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
                    value={getShareUrl()}
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
          </Modal>

          {/* Edit Session Modal */}
          <Modal
            title="Edit Session"
            open={showEditForm}
            onCancel={() => setShowEditForm(false)}
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
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
      </Card>
    </div>
  )
}
