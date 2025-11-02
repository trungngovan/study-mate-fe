import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Skeleton, Popconfirm, Pagination, Spin, Modal, Input, Select, Empty } from 'antd'
import { useGroupStore } from '@/stores/groupStore'
import { useToast } from '@/stores/notificationStore'
import { Users, Globe, Lock, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import api from '@/utils/api'

interface Membership {
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
  role: 'admin' | 'moderator' | 'member'
  status: 'active' | 'pending' | 'invited' | 'left'
  invited_by?: number | null
  joined_at: string
  updated_at: string
  left_at?: string | null
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getGroupDetails, joinGroup, leaveGroup, updateGroup, deleteGroup } = useGroupStore()
  const [group, setGroup] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)
  const [members, setMembers] = useState<Membership[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersPagination, setMembersPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  })
  const [showEditForm, setShowEditForm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as const,
  })

  const fetchMembers = async (groupId: number, page: number = 1, pageSize: number = 12) => {
    setMembersLoading(true)
    try {
      const response = await api.get(`/groups/${groupId}/members/`, {
        params: { page, page_size: pageSize },
      })
      const data = response.data
      console.log('Members API response:', data) // Debug log
      setMembers(data.results || [])
      setMembersPagination({
        current: page,
        pageSize,
        total: data.count || 0,
      })
    } catch (error: any) {
      console.error('Failed to load members:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to load members'
      toast.error(errorMsg)
      setMembers([])
      setMembersPagination({
        current: 1,
        pageSize: 12,
        total: 0,
      })
    } finally {
      setMembersLoading(false)
    }
  }

  useEffect(() => {
    const loadGroup = async () => {
      if (!id) return
      setIsLoading(true)
      setMembers([])
      setMembersPagination({ current: 1, pageSize: 12, total: 0 })
      
      try {
        // Fetch group details
        const data = await getGroupDetails(parseInt(id))
        setGroup(data)
      } catch (error) {
        console.error('Failed to load group:', error)
        toast.error('Failed to load group details')
      } finally {
        setIsLoading(false)
      }

      // Fetch members separately (don't block on errors)
      try {
        await fetchMembers(parseInt(id), 1, 12)
      } catch (error) {
        // Error already handled in fetchMembers
        console.error('Failed to load members:', error)
      }
    }

    loadGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleMembersPageChange = (page: number, pageSize?: number) => {
    if (!id) return
    const newPageSize = pageSize || membersPagination.pageSize
    fetchMembers(parseInt(id), page, newPageSize)
  }

  const handleJoin = async () => {
    if (!group) return
    setIsActioning(true)
    try {
      await joinGroup(group.id)
      setGroup({ ...group, is_member: true })
      // Refresh members list
      await fetchMembers(group.id, membersPagination.current, membersPagination.pageSize)
      toast.success('Joined group!')
    } catch (error) {
      toast.error('Failed to join group')
    } finally {
      setIsActioning(false)
    }
  }

  const handleLeave = async () => {
    if (!group) return
    setIsActioning(true)
    try {
      await leaveGroup(group.id)
      setGroup({ ...group, is_member: false })
      // Refresh members list
      await fetchMembers(group.id, membersPagination.current, membersPagination.pageSize)
      toast.success('Left group!')
    } catch (error) {
      toast.error('Failed to leave group')
    } finally {
      setIsActioning(false)
    }
  }

  const handleOpenEdit = () => {
    if (!group) return
    setFormData({
      name: group.name || '',
      description: group.description || '',
      privacy: group.privacy || 'public',
    })
    setShowEditForm(true)
  }

  const handleUpdate = async () => {
    if (!group || !formData.name || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsUpdating(true)
    try {
      await updateGroup(group.id, formData)
      // Refresh group details from API to get complete updated data
      const refreshedGroup = await getGroupDetails(group.id)
      if (refreshedGroup) {
        setGroup(refreshedGroup)
      }
      toast.success('Group updated successfully!')
      setShowEditForm(false)
      // Refresh members list to get updated member count
      await fetchMembers(group.id, membersPagination.current, membersPagination.pageSize)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update group')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!group) return

    setIsDeleting(true)
    try {
      await deleteGroup(group.id)
      toast.success('Group deleted successfully!')
      navigate('/groups')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete group')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/groups')}>
          Back
        </Button>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/groups')}>
          Back
        </Button>
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p>Group not found</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/groups')}>
        Back
      </Button>

      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-gray-600 mt-2">{group.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge color={group.privacy === 'public' ? 'green' : 'red'}>
              {group.privacy === 'public' ? (
                <>
                  <Globe className="h-3 w-3 mr-1 inline" />
                  Public
                </>
              ) : group.privacy === 'private' ? (
                <>
                  <Lock className="h-3 w-3 mr-1 inline" />
                  Private
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1 inline" />
                  Invite Only
                </>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Members</p>
                <p className="font-semibold">{group.member_count || 0}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Created by</p>
              <p className="font-semibold">{group.created_by.full_name}</p>
            </div>
          </div>

          {((group?.member_count !== undefined && group.member_count > 0) ||
            members.length > 0 || 
            membersPagination.total > 0) && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 font-medium">
                  Members List{' '}
                  {(membersPagination.total > 0 
                    ? `(${membersPagination.total})`
                    : group?.member_count !== undefined
                      ? `(${group.member_count})`
                      : '')}
                </p>
              </div>
              {membersLoading ? (
                <div className="flex justify-center py-4">
                  <Spin size="small" />
                </div>
              ) : members.length > 0 ? (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {members.map((membership: Membership) => (
                      <div
                        key={membership.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {membership.user.avatar_url ? (
                            <img
                              src={membership.user.avatar_url}
                              alt={membership.user.full_name}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-gray-600 font-semibold">
                                {membership.user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">
                                {membership.user.full_name}
                              </p>
                              <Badge
                                color={
                                  membership.role === 'admin'
                                    ? 'red'
                                    : membership.role === 'moderator'
                                    ? 'blue'
                                    : 'default'
                                }
                                text={
                                  membership.role === 'admin'
                                    ? 'Admin'
                                    : membership.role === 'moderator'
                                    ? 'Moderator'
                                    : 'Member'
                                }
                              />
                            </div>
                            {membership.user.major && (
                              <p className="text-xs text-gray-500 truncate">
                                {membership.user.major}
                                {membership.user.year && ` • Year ${membership.user.year}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          status={
                            membership.status === 'active'
                              ? 'success'
                              : membership.status === 'pending'
                              ? 'processing'
                              : membership.status === 'invited'
                              ? 'warning'
                              : 'default'
                          }
                          text={
                            membership.status === 'active'
                              ? 'Active'
                              : membership.status === 'pending'
                              ? 'Pending'
                              : membership.status === 'invited'
                              ? 'Invited'
                              : 'Left'
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {membersPagination.total > membersPagination.pageSize && (
                    <div className="flex justify-center pt-2">
                      <Pagination
                        current={membersPagination.current}
                        pageSize={membersPagination.pageSize}
                        total={membersPagination.total}
                        onChange={handleMembersPageChange}
                        onShowSizeChange={handleMembersPageChange}
                        showSizeChanger
                        showQuickJumper
                        pageSizeOptions={['12', '24', '48', '96']}
                        showTotal={(total, range) =>
                          `${range[0]}-${range[1]} of ${total} members`
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  description={<span className="text-gray-500 text-sm">No members yet</span>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          )}

          <div className="border-t pt-6 flex gap-2">
            {group.is_member ? (
              (group.is_admin || group.user_role === 'admin') ? (
                <Button
                  icon={<Edit className="h-4 w-4" />}
                  onClick={handleOpenEdit}
                  className="flex-1"
                >
                  Edit Group
                </Button>
              ) : (
                <Popconfirm
                  title="Leave Group"
                  description="Are you sure you want to leave this group?"
                  onConfirm={handleLeave}
                  okText="Yes, Leave"
                  cancelText="Cancel"
                  okButtonProps={{ loading: isActioning }}
                >
                  <Button
                    loading={isActioning}
                    className="flex-1"
                  >
                    {isActioning ? 'Leaving...' : 'Leave Group'}
                  </Button>
                </Popconfirm>
              )
            ) : (
              <Button
                type="primary"
                onClick={handleJoin}
                loading={isActioning}
                className="flex-1"
              >
                {isActioning ? 'Joining...' : 'Join Group'}
              </Button>
            )}
          </div>

          {/* Edit Group Modal */}
          <Modal
            title="Edit Group"
            open={showEditForm}
            onCancel={() => {
              setShowEditForm(false)
              setFormData({
                name: '',
                description: '',
                privacy: 'public',
              })
            }}
            onOk={handleUpdate}
            confirmLoading={isUpdating}
            okText={isUpdating ? 'Updating...' : 'Update Group'}
            cancelText="Cancel"
            width={500}
            footer={[
              group?.member_count === 1 ? (
                <Popconfirm
                  key="delete"
                  title="Delete Group"
                  description="Are you sure you want to delete this group? This action cannot be undone."
                  onConfirm={handleDelete}
                  okText="Yes, Delete"
                  cancelText="Cancel"
                  okButtonProps={{ loading: isDeleting, danger: true }}
                >
                  <Button
                    danger
                    icon={<Trash2 className="h-4 w-4" />}
                    loading={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Group'}
                  </Button>
                </Popconfirm>
              ) : null,
              <Button
                key="submit"
                type="primary"
                onClick={handleUpdate}
                loading={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Group'}
              </Button>,
            ].filter(Boolean)}
          >
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Advanced Calculus Study Group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this group about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Privacy Level</label>
                <Select
                  value={formData.privacy}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      privacy: value as any,
                    })
                  }
                  className="w-full"
                  options={[
                    { value: 'public', label: 'Public - Anyone can join' },
                    { value: 'private', label: 'Private - Only invited members' },
                    { value: 'invite_only', label: 'Invite Only - Request to join' },
                  ]}
                />
              </div>

              {group?.member_count === 1 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    This group has only 1 member. You can delete it if you no longer need it.
                  </p>
                </div>
              )}
            </div>
          </Modal>
        </div>
      </Card>
    </div>
  )
}
