import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { POSLayout } from '@/components/layout/pos-layout'
import POSScreen from '@/features/pos'

export const Route = createFileRoute('/pos')({
  beforeLoad: () => {
    const { accessToken } = useAuthStore.getState().auth

    if (!accessToken) {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: () => (
    <POSLayout>
      <POSScreen />
    </POSLayout>
  ),
})
