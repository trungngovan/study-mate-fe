import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useToast } from '@/stores/notificationStore'
import { Card, Spin, Calendar, Badge, Modal, Button, Skeleton, Popconfirm, Input, Select, Pagination, Statistic, Empty } from 'antd'
import type { CalendarProps, BadgeProps } from 'antd'
import CountUp from 'react-countup'
import { Users, MessageSquare, BookOpen, Clock, MapPin, ExternalLink, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
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

interface Session {
  id: number
  title: string
  description?: string
  start_time: string
  end_time: string
  status: string
  session_type: string
  is_host: boolean
  is_participant: boolean
  location_name?: string
  meeting_link?: string
  duration_minutes?: number
  participant_count?: number
  host?: {
    id: number
    full_name: string
    avatar_url?: string
  }
  subject?: {
    id: number
    code: string
    name_en: string
    name_vi: string
  }
}

export default function DashboardPage() {
  const { user, fetchProfile } = useAuthStore()
  const { getSessionDetails, joinSession, leaveSession, updateSession } = useSessionStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, Session[]>>({})
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs())
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isActioning, setIsActioning] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsPagination, setParticipantsPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  })
  const [showEditForm, setShowEditForm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
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
  const [dashboardStats, setDashboardStats] = useState({
    sessions: {
      sessions_hosted_total: 0,
      sessions_hosted_upcoming: 0,
      sessions_hosted_in_progress: 0,
      sessions_hosted_completed: 0,
      sessions_hosted_cancelled: 0,
      sessions_attending_total: 0,
      sessions_attending_upcoming: 0,
      sessions_attending_in_progress: 0,
      sessions_attending_completed: 0,
      total_participations: 0,
      participations_attended: 0,
      participations_registered: 0,
      participations_no_show: 0,
      participations_cancelled: 0,
      sessions_by_type: {
        in_person: 0,
        virtual: 0,
        hybrid: 0,
      },
      total_participants_in_hosted_sessions: 0,
    },
    connections: {
      sent_pending: 0,
      received_pending: 0,
      accepted_connections: 0,
      total_requests: 0,
    },
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile()
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && !user.full_name) {
      loadProfile()
    } else {
      setIsLoading(false)
    }
  }, [user, fetchProfile])

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoadingStats(true)
      try {
        const response = await api.get('/dashboard/statistics/')
        setDashboardStats(response.data)
      } catch (error) {
        console.error('Failed to fetch dashboard statistics:', error)
        // Keep default values on error
      } finally {
        setIsLoadingStats(false)
      }
    }

    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  // Fetch sessions for the current month
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true)
      try {
        const month = calendarValue.month() + 1 // dayjs months are 0-indexed
        const year = calendarValue.year()
        
        const response = await api.get('/sessions/monthly_sessions/', {
          params: { month, year }
        })
        
        const fetchedSessions: Session[] = response.data
        
        // Organize sessions by date
        const byDate: Record<string, Session[]> = {}
        fetchedSessions.forEach((session) => {
          const dateKey = dayjs(session.start_time).format('YYYY-MM-DD')
          if (!byDate[dateKey]) {
            byDate[dateKey] = []
          }
          byDate[dateKey].push(session)
        })
        setSessionsByDate(byDate)
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
        setSessionsByDate({})
      } finally {
        setIsLoadingSessions(false)
      }
    }

    fetchSessions()
  }, [calendarValue])

  const getListData = (value: Dayjs): Array<{ type: string; content: string; session?: Session }> => {
    const dateKey = value.format('YYYY-MM-DD')
    const daySessions = sessionsByDate[dateKey] || []
    
    return daySessions.map((session) => {
      // Determine badge type based on status
      let type: BadgeProps['status'] = 'default'
      if (session.status === 'upcoming') {
        type = 'success'
      } else if (session.status === 'in_progress') {
        type = 'processing'
      } else if (session.status === 'completed') {
        type = 'default'
      } else if (session.status === 'cancelled') {
        type = 'error'
      }
      
      // Add host indicator
      const hostLabel = session.is_host ? ' (Host)' : ''
      const timeLabel = dayjs(session.start_time).format('HH:mm')
      
      return {
        type: type as string,
        content: `${timeLabel} - ${session.title}${hostLabel}`,
        session
      }
    })
  }

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

  const handleSessionClick = async (session: Session) => {
    setSelectedSession(session)
    setIsModalOpen(true)
    setIsLoadingDetails(true)
    setParticipants([])
    setParticipantsPagination({ current: 1, pageSize: 12, total: 0 })
    
    try {
      // Fetch session details
      const details = await getSessionDetails(session.id)
      setSessionDetails(details)
    } catch (error) {
      console.error('Failed to load session details:', error)
      toast.error('Failed to load session details')
      // Use the session data we already have
      setSessionDetails(session)
    } finally {
      setIsLoadingDetails(false)
    }

    // Fetch participants separately (don't block on errors)
    try {
      await fetchParticipants(session.id, 1, 12)
    } catch (error) {
      // Error already handled in fetchParticipants
      console.error('Failed to load participants:', error)
    }
  }

  const handleParticipantsPageChange = (page: number, pageSize?: number) => {
    if (!selectedSession) return
    const newPageSize = pageSize || participantsPagination.pageSize
    fetchParticipants(selectedSession.id, page, newPageSize)
  }

  const handleJoin = async () => {
    if (!selectedSession) return
    setIsActioning(true)
    try {
      await joinSession(selectedSession.id)
      // Update session details
      if (sessionDetails) {
        setSessionDetails({ ...sessionDetails, is_participant: true })
      }
      // Refresh participants list
      await fetchParticipants(selectedSession.id, participantsPagination.current, participantsPagination.pageSize)
      // Refresh calendar sessions
      const month = calendarValue.month() + 1
      const year = calendarValue.year()
      const response = await api.get('/sessions/monthly_sessions/', {
        params: { month, year }
      })
      const fetchedSessions: Session[] = response.data
      const byDate: Record<string, Session[]> = {}
      fetchedSessions.forEach((session) => {
        const dateKey = dayjs(session.start_time).format('YYYY-MM-DD')
        if (!byDate[dateKey]) {
          byDate[dateKey] = []
        }
        byDate[dateKey].push(session)
      })
      setSessionsByDate(byDate)
      toast.success('Joined session!')
    } catch (error) {
      toast.error('Failed to join session')
    } finally {
      setIsActioning(false)
    }
  }

  const handleLeave = async () => {
    if (!selectedSession) return
    setIsActioning(true)
    try {
      await leaveSession(selectedSession.id)
      // Update session details
      if (sessionDetails) {
        setSessionDetails({ ...sessionDetails, is_participant: false })
      }
      // Refresh participants list
      await fetchParticipants(selectedSession.id, participantsPagination.current, participantsPagination.pageSize)
      // Refresh calendar sessions
      const month = calendarValue.month() + 1
      const year = calendarValue.year()
      const response = await api.get('/sessions/monthly_sessions/', {
        params: { month, year }
      })
      const fetchedSessions: Session[] = response.data
      const byDate: Record<string, Session[]> = {}
      fetchedSessions.forEach((session) => {
        const dateKey = dayjs(session.start_time).format('YYYY-MM-DD')
        if (!byDate[dateKey]) {
          byDate[dateKey] = []
        }
        byDate[dateKey].push(session)
      })
      setSessionsByDate(byDate)
      toast.success('Left session!')
    } catch (error) {
      toast.error('Failed to leave session')
    } finally {
      setIsActioning(false)
    }
  }

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li 
            key={`${value.format('YYYY-MM-DD')}-${index}`}
            onClick={(e) => {
              e.stopPropagation()
              if (item.session) {
                handleSessionClick(item.session)
              }
            }}
            className="cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
          >
            <Badge status={item.type as BadgeProps['status']} text={item.content} />
          </li>
        ))}
      </ul>
    )
  }

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      return dateCellRender(current)
    }
    return info.originNode
  }

  const onPanelChange = (value: Dayjs) => {
    setCalendarValue(value)
  }

  const handleOpenEdit = () => {
    if (!sessionDetails) return
    // Pre-fill form with current session data
    const startTime = dayjs(sessionDetails.start_time)
    const formattedTime = startTime.format('YYYY-MM-DDTHH:mm')
    
    setFormData({
      title: sessionDetails.title || '',
      description: sessionDetails.description || '',
      session_type: sessionDetails.session_type || 'virtual',
      start_time: formattedTime,
      duration_minutes: sessionDetails.duration_minutes || 60,
      location_name: sessionDetails.location_name || '',
      meeting_link: sessionDetails.meeting_link || '',
    })
    setShowEditForm(true)
  }

  const handleUpdate = async () => {
    if (!sessionDetails) return
    
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
    const startTime = dayjs(formData.start_time).toISOString()

    setIsUpdating(true)
    try {
      // Prepare data to send
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

      const updatedSession = await updateSession(sessionDetails.id, sessionData)
      setSessionDetails(updatedSession)
      
      // Update session in calendar if it exists
      if (selectedSession) {
        const dateKey = dayjs(updatedSession.start_time).format('YYYY-MM-DD')
        setSessionsByDate((prev) => {
          const newByDate = { ...prev }
          if (newByDate[dateKey]) {
            newByDate[dateKey] = newByDate[dateKey].map((s) => {
              if (s.id === updatedSession.id) {
                // Merge updated session data with existing session to preserve all fields
                return { ...s, ...updatedSession } as Session
              }
              return s
            })
          }
          return newByDate
        })
      }
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.full_name}!</h1>
          <p className="text-gray-600 mt-2">
            {user?.school_name} • {user?.major} • Year {user?.year}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Hosted Upcoming</span>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <Statistic
            value={dashboardStats.sessions.sessions_hosted_upcoming}
            formatter={(value) => (
              <CountUp start={0} end={value as number} duration={2.5} separator="," />
            )}
            loading={isLoadingStats}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Attending Upcoming</span>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <Statistic
            value={dashboardStats.sessions.sessions_attending_upcoming}
            formatter={(value) => (
              <CountUp start={0} end={value as number} duration={2.5} separator="," />
            )}
            loading={isLoadingStats}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Sent Pending</span>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </div>
          <Statistic
            value={dashboardStats.connections.sent_pending}
            formatter={(value) => (
              <CountUp start={0} end={value as number} duration={2.5} separator="," />
            )}
            loading={isLoadingStats}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Received Pending</span>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <Statistic
            value={dashboardStats.connections.received_pending}
            formatter={(value) => (
              <CountUp start={0} end={value as number} duration={2.5} separator="," />
            )}
            loading={isLoadingStats}
          />
        </Card>
      </div>
  
      {/* Calendar */}
      <Card title="Calendar">
        {isLoadingSessions && (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        )}
        <Calendar 
          value={calendarValue}
          cellRender={cellRender}
          onPanelChange={onPanelChange}
        />
      </Card>

      {/* Session Detail Modal */}
      <Modal
        title={selectedSession?.title || 'Session Details'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setSelectedSession(null)
          setSessionDetails(null)
          setParticipants([])
          setParticipantsPagination({ current: 1, pageSize: 12, total: 0 })
        }}
        footer={null}
        width={600}
      >
        {isLoadingDetails ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : sessionDetails ? (
          <div className="space-y-6">
            <div>
              {sessionDetails.description && (
                <p className="text-gray-600 mt-2">{sessionDetails.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                color={sessionDetails.session_type === 'in_person' ? 'blue' : 'green'}
                text={
                  sessionDetails.session_type === 'in_person'
                    ? 'In-person'
                    : sessionDetails.session_type === 'virtual'
                    ? 'Virtual'
                    : 'Hybrid'
                }
              />
              <Badge
                color={
                  sessionDetails.status === 'upcoming'
                    ? 'orange'
                    : sessionDetails.status === 'in_progress'
                    ? 'green'
                    : 'gray'
                }
                text={
                  sessionDetails.status === 'in_progress'
                    ? 'In Progress'
                    : sessionDetails.status.charAt(0).toUpperCase() + sessionDetails.status.slice(1)
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-semibold">
                    {dayjs(sessionDetails.start_time).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              </div>

              {sessionDetails.duration_minutes && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{sessionDetails.duration_minutes} minutes</p>
                  </div>
                </div>
              )}

              {sessionDetails.location_name && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{sessionDetails.location_name}</p>
                  </div>
                </div>
              )}

              {sessionDetails.participant_count !== undefined && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Participants</p>
                    <p className="font-semibold">
                      {sessionDetails.participant_count ?? 0}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {((sessionDetails?.participant_count !== undefined && sessionDetails.participant_count > 0) ||
              participants.length > 0 || 
              participantsPagination.total > 0) && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium">
                    Participants List{' '}
                    {(participantsPagination.total > 0 
                      ? `(${participantsPagination.total})`
                      : sessionDetails?.participant_count !== undefined 
                        ? `(${sessionDetails.participant_count})`
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
                                {sessionDetails?.host?.id === participant.user.id && (
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

            {sessionDetails.host && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Host</p>
                <p className="font-semibold">{sessionDetails.host.full_name}</p>
              </div>
            )}

            {sessionDetails.subject && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Subject</p>
                <p className="font-semibold">
                  {sessionDetails.subject.code} - {sessionDetails.subject.name_en}
                </p>
              </div>
            )}

            {sessionDetails.meeting_link && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Meeting Link</p>
                <a
                  href={sessionDetails.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all flex items-center gap-1"
                >
                  {sessionDetails.meeting_link}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {(sessionDetails.status === 'upcoming' || sessionDetails.status === 'in_progress') && (
              <div className="border-t pt-4 flex gap-2">
                {sessionDetails.is_host || (sessionDetails.host && user && sessionDetails.host.id === user.id) ? (
                  <Button
                    icon={<Edit className="h-4 w-4" />}
                    onClick={handleOpenEdit}
                  >
                    Edit Session
                  </Button>
                ) : sessionDetails.is_participant ? (
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
                <Button
                  onClick={() => {
                    navigate(`/sessions/${sessionDetails.id}`)
                    setIsModalOpen(false)
                  }}
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  View Full Details
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Failed to load session details</p>
          </div>
        )}
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
  )
}
