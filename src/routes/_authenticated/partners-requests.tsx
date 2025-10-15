import { createFileRoute } from '@tanstack/react-router'
import PartnershipRequests from '@/features/partners-requests'

export const Route = createFileRoute('/_authenticated/partners-requests')({
  component: PartnershipRequests,
})