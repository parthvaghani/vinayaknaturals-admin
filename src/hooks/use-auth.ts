import Cookies from 'js-cookie'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
// Import js-cookie
import api from '@/lib/api'

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
}

// API functions
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

// Custom hooks
export function useLogin() {
  const queryClient = useQueryClient()
  const setAccessToken = useAuthStore((state) => state.auth.setAccessToken)
  const setUser = useAuthStore((state) => state.auth.setUser)
  const navigate = useNavigate({ from: '/sign-in' })

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      const accessToken = String(data.tokens.access.token) // Correctly access the access token

      // Store in cookie with proper configuration
      const isProduction = process.env.NODE_ENV === 'production'
      const cookieOptions = {
        path: '/',
        expires: 7, // 7 days
        sameSite: 'lax' as const,
        secure: isProduction,
        domain: undefined,
      }

      // Set the cookie
      Cookies.set('session', accessToken, cookieOptions)

      // Verify cookie was set
      const storedCookie = Cookies.get('session')
      if (!storedCookie) {
        toast.error('Failed to store session. Please try again.')
        return
      }

      const decodedUser = jwtDecode<AuthUser>(accessToken) // Use the correctly accessed accessToken

      // Removed console logs to inspect the token and decoded user
      // console.log('accessToken before decode:', accessToken)
      // console.log('decodedUser:', decodedUser)

      if (!decodedUser?.role || decodedUser.role.length === 0) {
        toast.error('Invalid account. No role assigned.')
        return
      }

      if (decodedUser.role.includes('admin')) {
        setAccessToken(accessToken) // Use the correctly accessed accessToken
        setUser(decodedUser)
        toast.success('Admin logged in successfully')
        navigate({ to: '/' })
      } else if (decodedUser.role.includes('user')) {
        setAccessToken(accessToken) // Use the correctly accessed accessToken
        setUser(decodedUser)
        toast.success('User logged in successfully')
        navigate({ to: '/' })
      } else {
        toast.error('Unauthorized role!')
      }

      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: () => {
      // Error handling is done by the mutation's error state
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
  const reset = useAuthStore((state) => state.auth.reset)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      // If you have a logout API endpoint, call it here
      // await api.post('/logout')
      return Promise.resolve()
    },
    onSuccess: () => {
      reset()
      queryClient.clear() // Clear all queries
      navigate({ to: '/sign-in' })
      toast.success('Logged out successfully')
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error)
      // Even if logout API fails, clear local state
      reset()
      queryClient.clear()
      navigate({ to: '/sign-in' })
    },
  })
}
