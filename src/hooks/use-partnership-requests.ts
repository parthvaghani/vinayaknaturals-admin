import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'

export interface PartnershipRequest {
  _id?: string
  id?: string
  fullName: string
  emailAddress: string
  phoneNumber?: string
  additionalInformation?: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface GetPartnershipRequestsParams {
  page?: number
  limit?: number
  searchTerm?: string
}

interface PartnershipRequestsResponse {
  results: PartnershipRequest[]
  total?: number
  page?: number
  limit?: number
}

const getPartnershipRequestsApi = async (
  params: GetPartnershipRequestsParams = {}
): Promise<PartnershipRequestsResponse> => {
  const { page, limit, searchTerm } = params
  const queryParams: Record<string, unknown> = {}
  if (typeof page !== 'undefined') queryParams.page = page
  if (typeof limit !== 'undefined') queryParams.limit = limit
  if (typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
    queryParams.search = searchTerm
  }
  const response = await api.get('/partnership-requests/', {
    params: queryParams,
  })

  // Normalize common API envelope patterns
  const payload = response?.data?.data ?? response?.data ?? {}
  const results: PartnershipRequest[] = Array.isArray(payload)
    ? (payload as PartnershipRequest[])
    : (payload?.results ?? [])

  const total: number | undefined =
    payload?.total ??
    payload?.count ??
    payload?.totalResults ??
    (Array.isArray(payload) ? results.length : undefined)
  const currentPage: number | undefined = payload?.page ?? payload?.currentPage
  const currentLimit: number | undefined = payload?.limit ?? payload?.pageSize

  return {
    results,
    total,
    page: currentPage,
    limit: currentLimit,
  }
}

export function usePartnershipRequestsList(
  params: GetPartnershipRequestsParams
) {
  const { page = 1, limit = 10, searchTerm } = params
  return useQuery({
    queryKey: [
      'partnership-requests',
      { page, limit, searchTerm: searchTerm || undefined },
    ],
    queryFn: () =>
      getPartnershipRequestsApi({
        page,
        limit,
        searchTerm: searchTerm || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

// Mutations
export type UpdatePartnershipRequestPayload = Partial<
  Pick<
    PartnershipRequest,
    'fullName' | 'emailAddress' | 'phoneNumber' | 'additionalInformation'
  >
> &
  Record<string, unknown>

const updatePartnershipRequestApi = async (params: {
  id: string
  data: UpdatePartnershipRequestPayload
}) => {
  const { id, data } = params
  const response = await api.patch(`/partnership-requests/${id}`, data)
  return response.data
}

const deletePartnershipRequestApi = async (id: string) => {
  const response = await api.delete(`/partnership-requests/${id}`)
  return response.data
}

export function useUpdatePartnershipRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePartnershipRequestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership-requests'] })
    },
  })
}

export function useDeletePartnershipRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePartnershipRequestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership-requests'] })
    },
  })
}
