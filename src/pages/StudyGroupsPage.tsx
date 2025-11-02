import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Input, Select, Modal, Popconfirm, Empty } from 'antd'
import { useGroupStore } from '@/stores/groupStore'
import { useToast } from '@/stores/notificationStore'
import Pagination from '@/components/Pagination'
import { Users, Lock, Globe, Edit, Trash2 } from 'lucide-react'

export default function StudyGroupsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    groups,
    isLoading,
    fetchGroups,
    goToPage,
    currentPage,
    totalCount,
    pageSize,
    hasNext,
    hasPrevious,
    joinGroup,
    leaveGroup,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useGroupStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [leavingId, setLeavingId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as const,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handlePageChange = async (newPage: number) => {
    await goToPage(newPage, searchQuery)
  }

  const handleJoin = async (groupId: number) => {
    setJoiningId(groupId)
    try {
      await joinGroup(groupId)
      toast.success('Joined group!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to join group')
    } finally {
      setJoiningId(null)
    }
  }

  const handleLeave = async (groupId: number) => {
    setLeavingId(groupId)
    try {
      await leaveGroup(groupId)
      toast.success('Left group!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to leave group')
    } finally {
      setLeavingId(null)
    }
  }

  const handleViewDetails = (groupId: number) => {
    navigate(`/groups/${groupId}`)
  }

  const handleOpenEdit = (group: any) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      privacy: group.privacy,
    })
    setShowEditForm(true)
  }

  const handleUpdate = async () => {
    if (!editingGroup || !formData.name || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsUpdating(true)
    try {
      await updateGroup(editingGroup.id, formData)
      // Group is already updated in store by updateGroup, no need to refetch
      // Only refetch if we need to get updated member_count or other server-side computed fields
      // But to avoid full page reload, we'll just update the local state if needed
      toast.success('Group updated successfully!')
      setShowEditForm(false)
      setEditingGroup(null)
      setFormData({
        name: '',
        description: '',
        privacy: 'public',
      })
      // Optionally refresh to get any server-side computed fields, but without reloading page
      // The groups list in store is already updated by updateGroup
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update group')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!editingGroup) return

    setIsDeleting(true)
    try {
      await deleteGroup(editingGroup.id)
      toast.success('Group deleted successfully!')
      setShowEditForm(false)
      setEditingGroup(null)
      setFormData({
        name: '',
        description: '',
        privacy: 'public',
      })
      // Refresh groups list
      await fetchGroups(searchQuery, currentPage)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete group')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      await createGroup(formData)
      toast.success('Group created successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        privacy: 'public',
      })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create group')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-gray-600 mt-2">Join or create study groups</p>
        </div>
        <Button type="primary" onClick={() => setShowCreateForm(true)}>Create Group</Button>
      </div>

      {/* Create Group Modal */}
      <Modal
        title="Create New Group"
        open={showCreateForm}
        onCancel={() => {
          setShowCreateForm(false)
          setFormData({
            name: '',
            description: '',
            privacy: 'public',
          })
        }}
        onOk={handleCreate}
        confirmLoading={isCreating}
        okText={isCreating ? 'Creating...' : 'Create Group'}
        cancelText="Cancel"
        width={500}
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
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        title="Edit Group"
        open={showEditForm}
        onCancel={() => {
          setShowEditForm(false)
          setEditingGroup(null)
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
          editingGroup?.member_count === 1 ? (
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

          {editingGroup?.member_count === 1 && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-2">
                This group has only 1 member. You can delete it if you no longer need it.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Search */}
      <Input
        placeholder="Search groups..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="large"
      />

      {/* Groups grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow" hoverable>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{group.name}</h3>
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
                <p className="text-sm text-gray-600 line-clamp-2">
                  {group.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{group.member_count} members</span>
                </div>
                <p className="text-sm text-gray-500">
                  Created by {group.created_by.full_name}
                </p>
                <div className="flex gap-2">
                  {group.is_member ? (
                    (group.is_admin || group.user_role === 'admin') ? (
                      <Button
                        icon={<Edit className="h-4 w-4" />}
                        className="flex-1"
                        onClick={() => handleOpenEdit(group)}
                      >
                        Edit Group
                      </Button>
                    ) : (
                      <Popconfirm
                        title="Leave Group"
                        description="Are you sure you want to leave this group?"
                        onConfirm={() => handleLeave(group.id)}
                        okText="Yes, Leave"
                        cancelText="Cancel"
                        okButtonProps={{ loading: leavingId === group.id }}
                      >
                        <Button
                          className="flex-1"
                          loading={leavingId === group.id}
                        >
                          {leavingId === group.id ? 'Leaving...' : 'Leave Group'}
                        </Button>
                      </Popconfirm>
                    )
                  ) : (
                    <Button
                      type="primary"
                      className="flex-1"
                      onClick={() => handleJoin(group.id)}
                      loading={joiningId === group.id}
                    >
                      {joiningId === group.id ? 'Joining...' : 'Join Group'}
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    onClick={() => handleViewDetails(group.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty description="No groups found" />
        </Card>
      )}

      {groups.length > 0 && (
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
  )
}
