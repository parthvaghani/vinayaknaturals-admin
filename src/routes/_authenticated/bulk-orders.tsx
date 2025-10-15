import { createFileRoute } from '@tanstack/react-router'
import BulkOrders from '@/features/bulk-orders'

export const Route = createFileRoute('/_authenticated/bulk-orders')({
  component: BulkOrders,
})
