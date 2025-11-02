import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Tabs, Badge, Skeleton, TabsProps, Popconfirm, Empty } from 'antd'
import { useConnectionStore } from '@/stores/connectionStore'
import { useToast } from '@/stores/notificationStore'
import Pagination from '@/components/Pagination'
import { MessageSquare, Check, X, Shield } from 'lucide-react'

export default function ConnectionsPage() {
  const navigate = useNavigate()
  const {
    sentRequests,
    receivedRequests,
    connections,
    isLoading,
    fetchAllData,
    fetchSentRequests,
    fetchReceivedRequests,
    fetchConnections,
    sentCurrentPage,
    sentTotalCount,
    sentPageSize,
    sentHasNext,
    sentHasPrevious,
    receivedCurrentPage,
    receivedTotalCount,
    receivedPageSize,
    receivedHasNext,
    receivedHasPrevious,
    connCurrentPage,
    connTotalCount,
    connPageSize,
    connHasNext,
    connHasPrevious,
    acceptRequest,
    rejectRequest,
    blockRequest,
    cancelRequest,
  } = useConnectionStore()

  const toast = useToast()
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  useEffect(() => {
    fetchAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Fetch all data on mount

  const handleSentPageChange = async (newPage: number) => {
    await fetchSentRequests(newPage)
  }

  const handleReceivedPageChange = async (newPage: number) => {
    await fetchReceivedRequests(newPage)
  }

  const handleConnectionsPageChange = async (newPage: number) => {
    await fetchConnections(newPage)
  }

  const handleAccept = async (requestId: number) => {
    setAcceptingId(requestId)
    try {
      await acceptRequest(requestId)
      toast.success('Connection request accepted!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to accept request')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    setRejectingId(requestId)
    try {
      await rejectRequest(requestId)
      toast.success('Connection request rejected')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reject request')
    } finally {
      setRejectingId(null)
    }
  }

  const handleBlock = async (requestId: number) => {
    try {
      await blockRequest(requestId)
      toast.success('User blocked')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to block user')
    }
  }

  const handleCancel = async (requestId: number) => {
    setCancelingId(requestId)
    try {
      await cancelRequest(requestId)
      toast.success('Connection request cancelled')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to cancel request')
    } finally {
      setCancelingId(null)
    }
  }

  // Filter requests to show only pending ones
  const pendingSentRequests = sentRequests.filter((r) => r.state === 'pending')
  const pendingReceivedRequests = receivedRequests.filter((r) => r.state === 'pending')

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-gray-600 mt-2">Manage your study buddy connections</p>
        </div>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-gray-600 mt-2">Manage your study buddy connections</p>
      </div>

      <Tabs
        defaultActiveKey="connected"
        items={[
          {
            label: `Connected (${connections.length})`,
            key: 'connected',
            children: (
              <div className="space-y-4 mt-4">
                {connections.length > 0 ? (
                  connections.map((conn) => (
                    <Card key={conn.id}>
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {conn.user.avatar_url ? (
                          <img
                            src={conn.user.avatar_url}
                            alt={conn.user.full_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                            {conn.user.full_name.charAt(0)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{conn.user.full_name}</h3>
                          <p className="text-sm text-gray-600">
                            {conn.user.major} • Year {conn.user.year}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Connected since{' '}
                            {new Date(conn.accepted_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {conn.can_message && (
                            <Button
                              onClick={() => navigate(`/chat?conversation=${conn.conversation_id}`)}
                              icon={<MessageSquare className="h-4 w-4" />}
                            >
                              Message
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <Empty
                      description={
                        <div>
                          <p className="text-gray-600">No connections yet</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Start by discovering nearby learners
                          </p>
                        </div>
                      }
                    />
                  </Card>
                )}

                {connections.length > 0 && (
                  <Pagination
                    currentPage={connCurrentPage}
                    hasNext={connHasNext}
                    hasPrevious={connHasPrevious}
                    totalCount={connTotalCount}
                    pageSize={connPageSize}
                    onPageChange={handleConnectionsPageChange}
                    isLoading={isLoading}
                  />
                )}
              </div>
            ),
          },
          {
            label: `Requests Received (${pendingReceivedRequests.length})`,
            key: 'received',
            children: (
              <div className="space-y-4 mt-4">
                {pendingReceivedRequests.length > 0 ? (
                  pendingReceivedRequests.map((req) => {
                    // Handle both API response formats
                    const senderName = req.sender?.full_name || req.sender_name || 'Unknown'
                    const senderAvatar = req.sender?.avatar_url || req.sender_avatar
                    const senderMajor = req.sender?.major || 'N/A'
                    const senderYear = req.sender?.year || 'N/A'

                    return (
                      <Card key={req.id}>
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          {senderAvatar ? (
                            <img
                              src={senderAvatar}
                              alt={senderName}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                              {senderName.charAt(0)}
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{senderName}</h3>
                            <p className="text-sm text-gray-600">
                              {senderMajor} • Year {senderYear}
                            </p>
                            {req.message && (
                              <p className="text-sm text-gray-700 mt-2 italic">
                                "{req.message}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Requested {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Actions */}
                          {req.can_accept && (
                            <div className="flex gap-2">
                              <Button
                                type="primary"
                                onClick={() => handleAccept(req.id)}
                                loading={acceptingId === req.id}
                                icon={<Check className="h-4 w-4" />}
                              />
                              <Popconfirm
                                title="Reject Request"
                                description="Are you sure you want to reject this connection request?"
                                onConfirm={() => handleReject(req.id)}
                                okText="Yes, Reject"
                                cancelText="Cancel"
                                okButtonProps={{ loading: rejectingId === req.id }}
                              >
                                <Button
                                  loading={rejectingId === req.id}
                                  icon={<X className="h-4 w-4" />}
                                />
                              </Popconfirm>
                              <Popconfirm
                                title="Block User"
                                description="Are you sure you want to block this user? You won't be able to see or message them."
                                onConfirm={() => handleBlock(req.id)}
                                okText="Yes, Block"
                                cancelText="Cancel"
                                okType="danger"
                              >
                                <Button
                                  type="text"
                                  title="Block this user"
                                  icon={<Shield className="h-4 w-4 text-red-600" />}
                                />
                              </Popconfirm>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <Card>
                    <Empty description="No pending requests" />
                  </Card>
                )}

                {receivedRequests.length > 0 && (
                  <Pagination
                    currentPage={receivedCurrentPage}
                    hasNext={receivedHasNext}
                    hasPrevious={receivedHasPrevious}
                    totalCount={receivedTotalCount}
                    pageSize={receivedPageSize}
                    onPageChange={handleReceivedPageChange}
                    isLoading={isLoading}
                  />
                )}
              </div>
            ),
          },
          {
            label: `Requests Sent (${pendingSentRequests.length})`,
            key: 'sent',
            children: (
              <div className="space-y-4 mt-4">
                {pendingSentRequests.length > 0 ? (
                  pendingSentRequests.map((req) => {
                    // Handle both API response formats
                    const receiverName = req.receiver?.full_name || req.receiver_name || 'Unknown'
                    const receiverAvatar = req.receiver?.avatar_url || req.receiver_avatar
                    const receiverMajor = req.receiver?.major || 'N/A'
                    const receiverYear = req.receiver?.year || 'N/A'

                    return (
                      <Card key={req.id}>
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          {receiverAvatar ? (
                            <img
                              src={receiverAvatar}
                              alt={receiverName}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                              {receiverName.charAt(0)}
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{receiverName}</h3>
                            <p className="text-sm text-gray-600">
                              {receiverMajor} • Year {receiverYear}
                            </p>
                            {req.message && (
                              <p className="text-sm text-gray-700 mt-2 italic">
                                "{req.message}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              <Badge color="orange">Pending</Badge>
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Popconfirm
                              title="Cancel Request"
                              description="Are you sure you want to cancel this connection request?"
                              onConfirm={() => handleCancel(req.id)}
                              okText="Yes, Cancel"
                              cancelText="Keep It"
                              okButtonProps={{ loading: cancelingId === req.id }}
                            >
                              <Button
                                loading={cancelingId === req.id}
                                icon={<X className="h-4 w-4" />}
                              />
                            </Popconfirm>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <Card>
                    <Empty description="No pending requests" />
                  </Card>
                )}

                {sentRequests.length > 0 && (
                  <Pagination
                    currentPage={sentCurrentPage}
                    hasNext={sentHasNext}
                    hasPrevious={sentHasPrevious}
                    totalCount={sentTotalCount}
                    pageSize={sentPageSize}
                    onPageChange={handleSentPageChange}
                    isLoading={isLoading}
                  />
                )}
              </div>
            ),
          },
        ] as TabsProps['items']}
      />
    </div>
  )
}
