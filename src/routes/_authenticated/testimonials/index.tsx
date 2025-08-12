import Testimonials from '@/features/testimonials';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/testimonials/')({
  component: Testimonials,
})
