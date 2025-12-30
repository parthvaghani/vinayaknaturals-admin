import { createFileRoute } from '@tanstack/react-router'
import Testimonials from '@/features/testimonials'

export const Route = createFileRoute('/_authenticated/testimonials/')({
  component: Testimonials,
})
