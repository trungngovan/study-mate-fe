import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, Card } from 'antd'
import { notification } from 'antd'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      notification.error({
        message: 'Validation Error',
        description: 'Please fill in all fields',
        placement: 'topRight',
      })
      return
    }

    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login failed'
      notification.error({
        message: 'Login Failed',
        description: errorMessage,
        placement: 'topRight',
      })
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="border border-gray-300">
          <div className="space-y-2 mb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black">StudyMate</h1>
              <p className="text-sm text-gray-600 mt-1">
                Find your study buddy nearby
              </p>
            </div>
            <h2 className="text-center text-xl font-semibold">Login</h2>
            <p className="text-center text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <div className="space-y-6">
            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium block">
                  Email
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
                  size="large"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium block">
                  Password
                </label>
                <Input.Password
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  size="large"
                />
              </div>

              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={isLoading}
                size="large"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Signup link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                to="/register"
                className="font-semibold text-black hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
