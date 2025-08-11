import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'

export interface ProductCategory {
  id: string
  _id: string
  name: string
  description?: string
  pricingEnabled?: boolean
  createdAt?: string
  updatedAt?: string
  heroImage?: string
}

interface GetProductCategoriesParams {
  page?: number
  limit?: number
  search?: string
  pricingEnabled?: boolean
}

interface PaginatedCategoriesResponse {
  results: ProductCategory[]
  total?: number
  page?: number
  limit?: number
}

// Fetch categories (supports pagination/search/pricingEnabled)
const getProductCategoriesApi = async (
  params: GetProductCategoriesParams = {}
): Promise<PaginatedCategoriesResponse> => {
  const { page, limit, search, pricingEnabled } = params
  const response = await api.get('/categories/product-category', {
    params: { page, limit, search, pricingEnabled },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: ProductCategory[] = payload?.results ?? payload ?? []
  const total: number | undefined =
    payload?.total ?? payload?.count ?? payload?.totalResults ?? undefined
  const currentPage: number | undefined = payload?.page ?? payload?.currentPage
  const currentLimit: number | undefined = payload?.limit ?? payload?.pageSize

  return {
    results,
    total,
    page: currentPage,
    limit: currentLimit,
  }
}

const searchProductCategoriesApi = async (
  search: string
): Promise<ProductCategory[]> => {
  const { results } = await getProductCategoriesApi({ search })
  return results
}
// Create new category
const createProductCategoryApi = async (payload: {category: string, name: string, description: string, pricingEnabled: boolean}): Promise<ProductCategory> => {
  const response = await api.post('/categories/product-category', payload)
  return response.data
}

// Update category
export const updateProductCategoryApi = async (payload: { id: string, category:string, name:string, description:string, pricingEnabled:boolean } ) => {
    const upadatedPayload = {
        category: payload.category,
        name: payload.name,
        description: payload.description,
        pricingEnabled:payload.pricingEnabled
    }
    const response = await api.put(`/categories/product-category/${payload.id}`, upadatedPayload)
    return response.data
  }

// Delete category
const deleteProductCategoryApi = async (id: string): Promise<void> => {
    await api.delete(`/categories/product-category/${id}`)
  }


// Hooks
export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    // Backwards-compatible: return only results array
    queryFn: async () => {
      const { results } = await getProductCategoriesApi()
      return results
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useCreateProductCategory() {
  return useMutation({
    mutationFn: createProductCategoryApi,
  })
}

export function useUpdateProductCategory() {
    return useMutation({
      mutationFn: (params: { id: string, category:string, name:string, description:string, pricingEnabled:boolean }) => updateProductCategoryApi(params),
    })
  }

export function useDeleteProductCategory() {
    return useMutation<void, Error, string>({
      mutationFn: deleteProductCategoryApi,
    })
  }

  export function useSearchProductCategories(search: string) {
    return useQuery({
      queryKey: ['product-categories-search', search],
      queryFn: () => searchProductCategoriesApi(search),
      enabled: !!search, // Only run when search is non-empty
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
    })
  }

// Paginated list hook
export function useProductCategoriesList(params: GetProductCategoriesParams) {
  const { page = 1, limit = 10, search = '', pricingEnabled } = params
  return useQuery({
    queryKey: ['product-categories', { page, limit, search, pricingEnabled }],
    queryFn: () => getProductCategoriesApi({ page, limit, search, pricingEnabled }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}