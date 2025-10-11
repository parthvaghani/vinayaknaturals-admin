import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/api';

// Coupon interface
export interface Coupon {
    _id: string;
    couponCode: string;
    description?: string;
    termsAndConditions?: string;
    startDate?: string;
    expiryDate?: string;
    level?: string; // 'order' or 'product'
    minOrderQuantity?: number;
    minCartValue?: number;
    maxDiscountValue?: number;
    type?: string; // 'unique' | 'generic'
    userType?: {
        user_details: { name: string; };
        _id: string;
        email: string;
        id: string;
    };
    maxUsage?: number;
    usageCount?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCoupon {
    _id: string;
    couponCode: string;
    description?: string;
    termsAndConditions?: string;
    startDate?: string;
    expiryDate?: string;
    level?: string; // 'order' or 'product'
    minOrderQuantity?: number;
    minCartValue?: number;
    maxDiscountValue?: number;
    type?: string; // 'unique' | 'generic'
    userType?: string;
    maxUsage?: number;
    usageCount?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// Pagination interface
interface GetCouponsParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

interface PaginatedCouponsResponse {
    results: Coupon[];
    total?: number;
    page?: number;
    limit?: number;
}

// ✅ GET all coupons (with pagination / search)
const getCouponsApi = async (
    params: GetCouponsParams = {}
): Promise<PaginatedCouponsResponse> => {
    const { page, limit, search, isActive } = params;
    const response = await api.get('/coupons', {
        params: { page, limit, search, isActive },
    });

    const payload = response?.data?.data ?? response?.data ?? {};
    const results: Coupon[] = payload?.results ?? payload ?? [];
    const total = payload?.total ?? payload?.count ?? payload?.totalResults ?? undefined;
    const currentPage = payload?.page ?? payload?.currentPage;
    const currentLimit = payload?.limit ?? payload?.pageSize;

    return {
        results,
        total,
        page: currentPage,
        limit: currentLimit,
    };
};

// ✅ CREATE coupon
const createCouponApi = async (data: Partial<CreateCoupon>): Promise<Coupon> => {
    const response = await api.post('/coupons', data);
    return response.data;
};

// ✅ UPDATE coupon
const updateCouponApi = async (data: Partial<Coupon> & { id: string; }): Promise<Coupon> => {
    const { id, ...payload } = data;
    const response = await api.put(`/coupons/${id}`, payload);
    return response.data;
};

// ✅ DELETE coupon
const deleteCouponApi = async (id: string): Promise<void> => {
    await api.delete(`/coupons/${id}`);
};

// ✅ GET single coupon by ID
const getCouponApi = async (id: string): Promise<Coupon> => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
};

// ✅ APPLY coupon
const applyCouponApi = async (data: {
    couponCode: string;
    userId: string;
    orderQuantity: number;
    cartValue: number;
    level: string;
}) => {
    const response = await api.post('/coupons/apply', data);
    return response.data;
};

// ⚡ React Query Hooks

export function useCoupons(params: GetCouponsParams = {}) {
    const { page = 1, limit = 10, search = '', isActive } = params;
    return useQuery({
        queryKey: ['coupons', { page, limit, search, isActive }],
        queryFn: () => getCouponsApi({ page, limit, search, isActive }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
}

export function useCoupon(id: string) {
    return useQuery({
        queryKey: ['coupon', id],
        queryFn: () => getCouponApi(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

export function useCreateCoupon() {
    return useMutation({
        mutationFn: createCouponApi,
    });
}

export function useUpdateCoupon() {
    return useMutation({
        mutationFn: updateCouponApi,
    });
}

export function useDeleteCoupon() {
    return useMutation({
        mutationFn: deleteCouponApi,
    });
}

export function useApplyCoupon() {
    return useMutation({
        mutationFn: applyCouponApi,
    });
}
