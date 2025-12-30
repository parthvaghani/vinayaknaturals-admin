import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const navigate = useNavigate()
  const fetchUser = useAuthStore((state) => state.auth.fetchUser)

  useEffect(() => {
    fetchUser()
  }, [fetchUser, navigate])

  return <>{children}</>
}
