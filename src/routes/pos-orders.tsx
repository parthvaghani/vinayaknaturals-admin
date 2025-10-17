import { createFileRoute, redirect } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/pos-layout'
import { useAuthStore } from '@/stores/authStore'
import POSOrders from '@/features/pos-orders'

export const Route = createFileRoute('/pos-orders')({
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
      <POSOrders />
    </POSLayout>
  ),
})