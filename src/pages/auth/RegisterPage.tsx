import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, Card, Select } from 'antd'
import { notification } from 'antd'

const { TextArea } = Input

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    full_name: '',
    phone: '',
    school: '1',
    major: '',
    year: '1',
    bio: '',
    learning_radius_km: '5.0',
    privacy_level: 'open',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.full_name) {
      notification.error({
        message: 'Validation Error',
        description: 'Please fill in all required fields',
        placement: 'topRight',
      })
      return false
    }

    if (formData.password !== formData.password_confirm) {
      notification.error({
        message: 'Validation Error',
        description: 'Passwords do not match',
        placement: 'topRight',
      })
      return false
    }

    if (formData.password.length < 8) {
      notification.error({
        message: 'Validation Error',
        description: 'Password must be at least 8 characters',
        placement: 'topRight',
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      notification.error({
        message: 'Validation Error',
        description: 'Please enter a valid email address',
        placement: 'topRight',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const data = {
        ...formData,
        school: parseInt(formData.school),
        year: parseInt(formData.year),
        learning_radius_km: parseFloat(formData.learning_radius_km),
      }
      await register(data)
      navigate('/')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Registration failed'
      notification.error({
        message: 'Registration Failed',
        description: errorMessage,
        placement: 'topRight',
      })
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-300">
          <div className="space-y-2 mb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black">StudyMate</h1>
              <p className="text-sm text-gray-600 mt-1">
                Join thousands of students finding study buddies
              </p>
            </div>
            <h2 className="text-center text-xl font-semibold">Create Account</h2>
            <p className="text-center text-gray-600">
              Fill in your details to get started
            </p>
          </div>

          <div className="space-y-6">
            {/* Register form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-medium block">
                    Full Name *
                  </label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium block">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium block">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="major" className="text-sm font-medium block">
                    Major
                  </label>
                  <Input
                    id="major"
                    name="major"
                    placeholder="Computer Science"
                    value={formData.major}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="year" className="text-sm font-medium block">
                    Year
                  </label>
                  <Select
                    id="year"
                    value={formData.year}
                    onChange={handleSelectChange('year')}
                    disabled={isLoading}
                    className="w-full"
                    options={[
                      { value: '1', label: '1st Year' },
                      { value: '2', label: '2nd Year' },
                      { value: '3', label: '3rd Year' },
                      { value: '4', label: '4th Year' },
                      { value: '5', label: '5th Year' },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="learning_radius_km" className="text-sm font-medium block">
                    Study Radius (km)
                  </label>
                  <Input
                    id="learning_radius_km"
                    name="learning_radius_km"
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={formData.learning_radius_km}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium block">
                  Bio
                </label>
                <TextArea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              {/* Privacy */}
              <div className="space-y-2">
                <label htmlFor="privacy_level" className="text-sm font-medium block">
                  Privacy Level
                </label>
                <Select
                  id="privacy_level"
                  value={formData.privacy_level}
                  onChange={handleSelectChange('privacy_level')}
                  disabled={isLoading}
                  className="w-full"
                  options={[
                    { value: 'open', label: 'Open (Anyone can view)' },
                    { value: 'friends_of_friends', label: 'Friends & Friends of Friends' },
                    { value: 'private', label: 'Private (Only me)' },
                  ]}
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium block">
                    Password *
                  </label>
                  <Input.Password
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password_confirm" className="text-sm font-medium block">
                    Confirm Password *
                  </label>
                  <Input.Password
                    id="password_confirm"
                    name="password_confirm"
                    placeholder="••••••••"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={isLoading}
                size="large"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            {/* Login link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="font-semibold text-black hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
