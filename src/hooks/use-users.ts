import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'

export interface UserDetails {
  name?: string
  country?: string
  city?: string
  zip?: string
  address?: string
  avatar?: string
}

export interface User {
  _id?: string
  id?: string
  email: string
  phoneNumber?: string
  role?: string
  isActive?: boolean
  profileCompleted?: boolean
  acceptedTerms?: boolean
  createdAt?: string
  updatedAt?: string
  user_details?: UserDetails
}

export interface GetUsersParams {
  page?: number
  limit?: number
  searchTerm?: string
}

interface UsersResponse {
  results: User[]
  total?: number
  page?: number
  limit?: number
}

const getUsersApi = async (
  params: GetUsersParams = {}
): Promise<UsersResponse> => {
  const { page, limit, searchTerm } = params
  const queryParams: Record<string, unknown> = {}
  if (typeof page !== 'undefined') queryParams.page = page
  if (typeof limit !== 'undefined') queryParams.limit = limit
  if (typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
    queryParams.searchTerm = searchTerm
  }
  const response = await api.get('/users/', {
    params: queryParams,
  })

  // Normalize common API envelope patterns
  const payload = response?.data?.data ?? response?.data ?? {}
  const results: User[] = Array.isArray(payload)
    ? (payload as User[])
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

export function useUsersList(params: GetUsersParams) {
  const { page = 1, limit = 10, searchTerm } = params
  return useQuery({
    queryKey: ['users', { page, limit, searchTerm: searchTerm || undefined }],
    queryFn: () =>
      getUsersApi({ page, limit, searchTerm: searchTerm || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

// Mutations
export type UpdateUserPayload = Partial<
  Pick<User, 'role' | 'isActive' | 'phoneNumber' | 'user_details'>
> &
  Record<string, unknown>

const updateUserApi = async (params: {
  id: string
  data: UpdateUserPayload
}) => {
  const { id, data } = params
  const response = await api.patch(`/users/${id}`, data)
  return response.data
}

const deleteUserApi = async (id: string) => {
  const response = await api.delete(`/users/${id}`)
  return response.data
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
