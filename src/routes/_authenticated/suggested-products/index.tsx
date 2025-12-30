import { createFileRoute } from '@tanstack/react-router'
import SuggestedProducts from '@/features/suggested-products'

export const Route = createFileRoute('/_authenticated/suggested-products/')({
  component: SuggestedProducts,
})
