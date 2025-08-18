import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface OrderProductDetail {
  productId: {
    _id: string
    name: string
    images: string[]
  }
  weightVariant: string
  weight: string
  pricePerUnit: number
  discount: number
  totalUnit: number
  _id: string
}

export interface Order {
  _id: string
  userId: string | {
    _id?: string
    id?: string
    email?: string
    phoneNumber?: string
    role?: string
    user_details?: {
      name?: string
      country?: string
    }
  }
  phoneNumber: string
  status: string
  createdAt: string
  updatedAt?: string
  cancelDetails?: { reason?: string | null }
  address?: {
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  productsDetails: OrderProductDetail[]
}

export interface GetOrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string // e.g. 'createdAt:desc'
}

interface OrdersResponse {
  results: Order[]
  total?: number
  page?: number
  limit?: number
}

const getOrdersApi = async (params: GetOrdersParams = {}): Promise<OrdersResponse> => {
  const { page, limit, search, status, sortBy } = params
  const response = await api.get('/orders/all', {
    params: {
      page,
      limit,
      search,
      status,
      sortBy,
    },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: Order[] = Array.isArray(payload)
    ? (payload as Order[])
    : (payload?.results ?? [])

  const total: number | undefined =
    payload?.total ?? payload?.count ?? payload?.totalResults ?? (Array.isArray(payload) ? results.length : undefined)
  const currentPage: number | undefined = payload?.page ?? payload?.currentPage
  const currentLimit: number | undefined = payload?.limit ?? payload?.pageSize

  return {
    results,
    total,
    page: currentPage,
    limit: currentLimit,
  }
}

export function useOrdersList(params: GetOrdersParams) {
  const { page = 1, limit = 10, search = '', status, sortBy } = params
  return useQuery({
    queryKey: ['orders', { page, limit, search, status, sortBy }],
    queryFn: () => getOrdersApi({ page, limit, search, status, sortBy }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}


