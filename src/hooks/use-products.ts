import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'

interface Variant {
  weight: string;
  price: number;
  discount?: number;
}

interface Variants {
  gm?: Variant[];
  kg?: Variant[];
}

interface Product {
  id?: string;
  _id?: string;
  category?: { _id?: string; id?: string; name?: string } | string;
  name?: string;
  description?: string;
  isPremium?: boolean;
  isPopular?: boolean;
  variants?: Variants;
  images?: string[];
  ingredients?: string[];
  benefits?: string[];
}

interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  isPremium?: boolean
  isPopular?: boolean
}

interface PaginatedProductsResponse {
  results: Product[]
  total?: number
  page?: number
  limit?: number
}

//  Fetch products with pagination/search/filters
const getProductsApi = async (
  params: GetProductsParams = {}
): Promise<PaginatedProductsResponse> => {
  const { page, limit, search, isPremium, isPopular } = params
  const response = await api.get('/products/product', {
    params: {
      page,
      limit,
      search,
      isPremium,
      isPopular,
    },
  })

  const payload = response?.data?.data ?? response?.data ?? {}
  const results: Product[] = payload?.results ?? []

  // Try common meta fields for total/page/limit with graceful fallback
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

//  Get product by ID
const getProductByIdApi = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/product/${id}`)
  return response.data
}

//  Create new product
const createProductApi = async (payload: {
  category: string; // category ID
  name: string;
  description?: string;
  isPremium?: boolean;
  isPopular?: boolean;
  variants?: Variants;
  images?: string[];
  ingredients?: string[];
  benefits?: string[];
}): Promise<Product> => {
  const response = await api.post('/products/product', payload)
  return response.data
}

//  Update product
const updateProductApi = async (payload: {
  id: string;
  category: string;
  name: string;
  description?: string;
  isPremium?: boolean;
  isPopular?: boolean;
  variants?: Variants;
  images?: string[];
  ingredients?: string[];
  benefits?: string[];
}): Promise<Product> => {
  const updatedPayload = {
    category: payload.category,
    name: payload.name,
    description: payload.description,
    isPremium: payload.isPremium,
    isPopular: payload.isPopular,
    variants: payload.variants,
    images: payload.images || [],
    ingredients: payload.ingredients || [],
    benefits: payload.benefits || [],
  }

  const response = await api.put(`/products/product/${payload.id}`, updatedPayload)
  return response.data.data
}

//  Delete product
const deleteProductApi = async (id: string): Promise<void> => {
  await api.delete(`/products/product/${id}`)
}

// hooks

export function useProducts() {
  // Keep a backwards-compatible signature that fetches without params
  return useQuery({
    queryKey: ['products', { page: 1, limit: 10 }],
    queryFn: () => getProductsApi({ page: 1, limit: 10 }),
    staleTime: 1000 * 60 * 5,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useProductsList(params: GetProductsParams) {
  const { page = 1, limit = 10, search = '', isPremium, isPopular } = params
  return useQuery({
    queryKey: ['products', { page, limit, search, isPremium, isPopular }],
    queryFn: () => getProductsApi({ page, limit, search, isPremium, isPopular }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 3,
    refetchOnWindowFocus: false,
  })
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductByIdApi(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: createProductApi,
  })
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: updateProductApi,
  })
}

export function useDeleteProduct() {
  return useMutation<void, Error, string>({
    mutationFn: deleteProductApi,
  })
}
