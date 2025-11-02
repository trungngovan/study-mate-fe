import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, Button, Input } from 'antd'
import { notification } from 'antd'

export default function SettingsPage() {
  const { changePassword } = useAuthStore()
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      notification.error({
        message: 'Validation Error',
        description: 'Please fill in all fields',
        placement: 'topRight',
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notification.error({
        message: 'Validation Error',
        description: 'New passwords do not match',
        placement: 'topRight',
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      notification.error({
        message: 'Validation Error',
        description: 'Password must be at least 8 characters',
        placement: 'topRight',
      })
      return
    }

    setIsLoading(true)
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      notification.success({
        message: 'Success',
        description: 'Password changed successfully',
        placement: 'topRight',
      })
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.detail || 'Failed to change password',
        placement: 'topRight',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>

      <Card title="Change Password">
          <p className="text-gray-600 mb-4">
            Update your password to keep your account secure
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="oldPassword" className="block text-sm font-medium">Current Password</label>
              <Input.Password
                id="oldPassword"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium">New Password</label>
              <Input.Password
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm Password</label>
              <Input.Password
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>

            <Button type="primary" htmlType="submit" loading={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>
    </div>
  )
}
