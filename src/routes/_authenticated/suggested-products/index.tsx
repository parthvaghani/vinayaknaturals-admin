import SuggestedProducts from '@/features/suggested-products'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/suggested-products/')({
  component: SuggestedProducts,
})
