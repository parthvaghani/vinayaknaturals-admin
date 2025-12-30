import type { AxiosRequestHeaders } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
// Import js-cookie
import api from '@/lib/api'
import { setCookie, removeCookie } from './use-cookie'

// Types
interface LoginData {
  emailOrUsername: string // This can be either email or username from the form
  password: string
}

interface RegisterData {
  email: string
  phoneNumber: string
  password: string
  user_details: {
    name: string
    country: string
    gender: 'Male' | 'Female' | 'Other'
  }
  acceptedTerms: boolean
  role?: 'user' | 'admin'
}

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
  user_details: {
    country: string
    gender: string
    name: string
  }
}

interface AccessToken {
  token: string
  expires: string
}

interface AuthResponse {
  tokens: {
    access: AccessToken
    refresh: string
  }
  user?: AuthUser
  success?: boolean
}

// API functions
interface ForgotPasswordData {
  email: string
}

interface ResetPasswordData {
  token: string
  password: string
}

const loginApi = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data)
  return response.data
}

const registerApi = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data)
  return response.data
}

const getUsersApi = async () => {
  const response = await api.get('/auth/getUsers')
  return response.data
}

const forgotPasswordApi = async (data: ForgotPasswordData) => {
  const response = await api.post('/auth/forgot-password', data)
  return response.data as { success?: boolean; message?: string }
}

const resetPasswordApi = async (data: ResetPasswordData) => {
  const response = await api.post(
    `/auth/reset-password?token=${encodeURIComponent(data.token)}`,
    {
      password: data.password,
    }
  )
  return response.data as { success?: boolean; message?: string }
}

// Custom hooks
export function useLogin() {
  const setAccessToken = useAuthStore((state) => state.auth.setAccessToken)
  const navigate = useNavigate({ from: '/sign-in' })
  const fetchUser = useAuthStore((state) => state.auth.fetchUser)

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      const { access } = data.tokens

      if (!data.success || !access.token) {
        const message = 'Login failed. Please try again.'
        toast.error(message)
        return
      }

      setCookie('admin_session', access.token, {
        expires: new Date(access.expires),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: false,
      })

      setAccessToken(access.token)
      if (access.token) {
        fetchUser()
        navigate({ to: '/' })
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: (data) => {
      const message = data?.message || 'Password has been reset successfully.'
      toast.success(message)
    },
  })
}

export function useRegister() {
  const navigate = useNavigate({ from: '/sign-up' })

  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      toast.success('Account created successfully!')

      navigate({ to: '/sign-in' })
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Register error:', error)
      // Error handling is done by the mutation's error state
    },
  })
}
export function useGetUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsersApi,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}
export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.auth.clearAuth)

  return useMutation({
    mutationFn: async () => {
      // If you have a logout API endpoint, call it here
      // await api.post('/logout')
      return Promise.resolve()
    },
    onSuccess: () => {
      // Fully clear auth state and storage
      clearAuth()
      queryClient.clear() // Clear all queries
      removeCookie('admin_session')
      // Ensure axios stops sending any stale Authorization header
      const commonHeaders = (
        api.defaults.headers as unknown as { common: AxiosRequestHeaders }
      ).common
      if (commonHeaders && 'Authorization' in commonHeaders) {
        delete commonHeaders.Authorization
      }
      // Navigate to sign-in (no hard reload to avoid bouncing back)
      navigate({ to: '/sign-in', replace: true })
      toast.success('Logged out successfully')
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error)
      // Even if logout API fails, clear local state
      clearAuth()
      queryClient.clear()
      const errorCommonHeaders = (
        api.defaults.headers as unknown as { common: AxiosRequestHeaders }
      ).common
      if (errorCommonHeaders && 'Authorization' in errorCommonHeaders) {
        delete errorCommonHeaders.Authorization
      }
      navigate({ to: '/sign-in', replace: true })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (data) => {
      const message =
        data?.message || 'If that email exists, a reset link was sent.'
      toast.success(message)
    },
    onError: (error: unknown) => {
      let message = 'Failed to send reset email'
      if (typeof error === 'object' && error !== null) {
        const maybeAxiosError = error as {
          response?: { data?: { message?: string } }
          message?: string
        }
        message =
          maybeAxiosError.response?.data?.message ||
          maybeAxiosError.message ||
          message
      }
      toast.error(message)
    },
  })
}
