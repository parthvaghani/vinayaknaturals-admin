import { useState, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SquarePen, Trash, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
  useUpdateCoupon,
  useDeleteCoupon,
  Coupon,
  CreateCoupon,
} from '@/hooks/use-coupons'
import { useUsersList } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { UserDropdown } from './user-dropDown'

// Types
interface ValidationErrors {
  couponCode?: string
  description?: string
  type?: string
  userType?: string
  startDate?: string
  expiryDate?: string
}

interface DataTableRowActionsProps {
  row: { original: Coupon }
}

// Constants
const MAX_DESCRIPTION_LENGTH = 200
const USERS_FETCH_LIMIT = 10000000000

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const queryClient = useQueryClient()
  const coupon = row.original

  // State management
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formData, setFormData] = useState<Coupon>(coupon)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [dateErrors, setDateErrors] = useState<{ [key: string]: boolean }>({})

  // Mutations
  const { mutate: updateCoupon, isPending: isUpdating } = useUpdateCoupon()
  const { mutate: deleteCoupon, isPending: isDeleting } = useDeleteCoupon()

  // Fetch users
  const { data: usersData } = useUsersList({ limit: USERS_FETCH_LIMIT })
  const users = useMemo(() => usersData?.results || [], [usersData])

  // Memoized user lookup
  const userMap = useMemo(
    () => new Map(users.map((u) => [u._id || u.id, u])),
    [users]
  )

  // Date validation helper functions
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime())
  }

  const validateDateInput = (dateString: string): boolean => {
    if (!dateString.trim()) return true // Empty is valid (optional field)

    const date = new Date(dateString)
    return isValidDate(date)
  }

  const formatDate = (date: string | undefined): string => {
    if (!date || typeof date !== 'string') return ''

    const dateObj = new Date(date)
    if (!isValidDate(dateObj)) {
      return ''
    }

    return dateObj.toISOString().split('T')[0]
  }

  const formatDateTime = (date: string | undefined): string => {
    if (!date || typeof date !== 'string') return '—'

    const dateObj = new Date(date)
    if (!isValidDate(dateObj)) {
      return '—'
    }

    return dateObj.toLocaleString()
  }

  const formatDateOnly = (date: string | undefined): string => {
    if (!date || typeof date !== 'string') return '—'

    const dateObj = new Date(date)
    if (!isValidDate(dateObj)) {
      return '—'
    }

    return dateObj.toLocaleDateString()
  }

  // Validation
  const validateForm = useCallback((data: Coupon): boolean => {
    const nextErrors: ValidationErrors = {}
    const codeValue = (data.couponCode || '').trim()
    const descValue = (data.description || '').trim()
    const typeValue = (data.type || '').trim()
    const userTypeValue = data.userType?._id?.trim() || ''

    if (!codeValue) nextErrors.couponCode = 'Coupon code is required'
    if (!descValue) nextErrors.description = 'Description is required'
    else if (descValue.length > MAX_DESCRIPTION_LENGTH) {
      nextErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`
    }
    if (typeValue === 'unique' && !userTypeValue) {
      nextErrors.userType = 'User Type is required for unique coupons'
    }

    // Add date validation
    if (data.startDate && !validateDateInput(data.startDate)) {
      nextErrors.startDate = 'Invalid start date format'
    }
    if (data.expiryDate && !validateDateInput(data.expiryDate)) {
      nextErrors.expiryDate = 'Invalid expiry date format'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [])

  // Handlers
  const handleEditSubmit = useCallback(() => {
    const trimmed: Coupon = {
      ...formData,
      couponCode: (formData.couponCode || '').trim(),
      description: (formData.description || '').trim(),
    }

    if (!validateForm(trimmed)) return

    const payload: Partial<CreateCoupon> & { id: string } = {
      id: trimmed._id,
      description: trimmed.description,
      termsAndConditions: trimmed.termsAndConditions,
      startDate: trimmed.startDate,
      expiryDate: trimmed.expiryDate,
      minOrderQuantity: trimmed.minOrderQuantity,
      minCartValue: trimmed.minCartValue,
      maxDiscountValue: trimmed.maxDiscountValue,
      maxUsage: trimmed.maxUsage,
      maxUsagePerUser: trimmed.maxUsagePerUser,
      firstOrderOnly: trimmed.firstOrderOnly,
      type: trimmed.type,
      level: trimmed.level,
      isActive: trimmed.isActive,
      couponType: trimmed.couponType,
      isPromoCode: trimmed.isPromoCode,
    }

    if (trimmed.couponCode !== coupon.couponCode) {
      payload.couponCode = trimmed.couponCode
    }
    if (trimmed.type === 'unique') {
      payload.userType = trimmed.userType?._id
    }

    updateCoupon(payload as unknown as Partial<Coupon> & { id: string }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['coupons'] })
        toast.success('Coupon updated successfully!')
        setEditOpen(false)
      },
      onError: () => toast.error('Failed to update coupon'),
    })
  }, [formData, validateForm, coupon.couponCode, updateCoupon, queryClient])

  const handleDelete = useCallback(() => {
    deleteCoupon(coupon._id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['coupons'] })
        toast.success('Coupon deleted successfully!')
        setDeleteConfirm(false)
      },
      onError: () => toast.error('Failed to delete coupon'),
    })
  }, [coupon._id, deleteCoupon, queryClient])

  const handleEditOpen = useCallback(() => {
    setFormData({
      ...coupon,
      maxUsagePerUser: coupon.maxUsagePerUser || 1,
      firstOrderOnly: coupon.firstOrderOnly || false,
      isPromoCode: coupon.isPromoCode || false,
    })
    setErrors({})
    setDateErrors({})
    setEditOpen(true)
  }, [coupon])

  const handleUserChange = useCallback(
    (val: string) => {
      const selectedUser = userMap.get(val)
      setFormData((prev) => ({
        ...prev,
        userType: selectedUser
          ? {
              _id: selectedUser._id || selectedUser.id || '',
              id: selectedUser.id || selectedUser._id || '',
              email: selectedUser.email || '',
              user_details: {
                name:
                  selectedUser.user_details?.name ||
                  selectedUser.email ||
                  'Unknown',
              },
            }
          : { _id: '', email: '', id: '', user_details: { name: '' } },
      }))
    },
    [userMap]
  )

  // Update handlers for form fields
  const updateField = useCallback(
    <K extends keyof Coupon>(field: K, value: Coupon[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Enhanced date input handler with error handling
  const handleDateChange = useCallback(
    (field: keyof Coupon, value: string) => {
      // Clear any previous error for this field
      setDateErrors((prev) => ({ ...prev, [field]: false }))

      try {
        if (value && !validateDateInput(value)) {
          setDateErrors((prev) => ({ ...prev, [field]: true }))
          return
        }
        updateField(field, value)
      } catch {
        setDateErrors((prev) => ({ ...prev, [field]: true }))
      }
    },
    [updateField]
  )

  // Enhanced date input rendering component
  const renderDateInput = (
    label: string,
    value: string | undefined,
    field: keyof Coupon
  ) => (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Input
        type='date'
        value={formatDate(value)}
        onChange={(e) => handleDateChange(field, e.target.value)}
        className={dateErrors[field] ? 'border-red-500' : ''}
      />
      {dateErrors[field] && (
        <p className='text-destructive mt-1 text-xs'>Invalid date format</p>
      )}
      {errors[field as keyof ValidationErrors] && (
        <p className='text-destructive mt-1 text-xs'>
          {errors[field as keyof ValidationErrors]}
        </p>
      )}
    </div>
  )

  return (
    <div className='flex items-center justify-center gap-2'>
      {/* Action Buttons */}
      <Button
        variant='ghost'
        size='icon'
        onClick={handleEditOpen}
        className='h-8 w-8'
      >
        <SquarePen className='h-4 w-4 text-blue-600' />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        onClick={() => setDeleteConfirm(true)}
        className='h-8 w-8'
      >
        <Trash className='h-4 w-4 text-red-600' />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        onClick={() => setDetailsOpen(true)}
        className='h-8 w-8'
      >
        <Eye className='h-4 w-4 text-gray-700' />
      </Button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>

          <div className='max-h-[500px] space-y-4 overflow-y-auto pr-2'>
            <div className='space-y-2'>
              <Label>Coupon Code</Label>
              <Input
                required
                value={formData.couponCode}
                onChange={(e) => updateField('couponCode', e.target.value)}
                placeholder='e.g. SAVE20'
              />
              {errors.couponCode && (
                <p className='text-destructive mt-1 text-xs'>
                  {errors.couponCode}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Description</Label>
              <Input
                required
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder='Short description of the coupon'
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              {errors.description && (
                <p className='text-destructive mt-1 text-xs'>
                  {errors.description}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Terms & Conditions</Label>
              <Input
                value={formData.termsAndConditions || ''}
                onChange={(e) =>
                  updateField('termsAndConditions', e.target.value)
                }
                placeholder='e.g. Applicable on first order only'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {renderDateInput('Start Date', formData.startDate, 'startDate')}
              {renderDateInput(
                'Expiry Date',
                formData.expiryDate,
                'expiryDate'
              )}
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Minimum Order Quantity</Label>
                <Input
                  type='number'
                  value={formData.minOrderQuantity || 1}
                  onChange={(e) =>
                    updateField('minOrderQuantity', Number(e.target.value))
                  }
                  min={1}
                />
              </div>

              <div className='space-y-2'>
                <Label>Minimum Cart Value</Label>
                <Input
                  type='number'
                  value={formData.minCartValue}
                  onChange={(e) =>
                    updateField('minCartValue', Number(e.target.value))
                  }
                  min={0}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Discount Percentage</Label>
                <Input
                  type='number'
                  value={formData.maxDiscountValue}
                  onChange={(e) =>
                    updateField('maxDiscountValue', Number(e.target.value))
                  }
                  min={0}
                  max={100}
                />
              </div>

              <div className='space-y-2'>
                <Label>Max Usage</Label>
                <Input
                  type='number'
                  value={formData.maxUsage || 1}
                  onChange={(e) =>
                    updateField('maxUsage', Number(e.target.value))
                  }
                  min={1}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Max Usage Per User</Label>
              <Input
                type='number'
                value={formData.maxUsagePerUser || 1}
                onChange={(e) =>
                  updateField('maxUsagePerUser', Number(e.target.value))
                }
                min={1}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateField('type', value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='generic'>Generic</SelectItem>
                    <SelectItem value='unique'>Unique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => updateField('level', value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select level' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='order'>Order</SelectItem>
                    <SelectItem value='product'>Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'unique' && (
              <UserDropdown
                value={formData.userType?._id || ''}
                onChange={handleUserChange}
                error={errors.userType}
              />
            )}

            <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
              <div>
                <Label htmlFor='firstOrderOnly' className='text-sm font-medium'>
                  First Order Only
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Coupon is only valid for first-time orders.
                </p>
              </div>
              <Switch
                id='firstOrderOnly'
                checked={formData.firstOrderOnly || false}
                onCheckedChange={(val) => updateField('firstOrderOnly', val)}
              />
            </div>

            <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
              <div>
                <Label htmlFor='isPromoCode' className='text-sm font-medium'>
                  Promotional Code
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Hide from available coupons list (for creator/influencer codes).
                </p>
              </div>
              <Switch
                id='isPromoCode'
                checked={formData.isPromoCode || false}
                onCheckedChange={(val) => updateField('isPromoCode', val)}
              />
            </div>

            <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
              <div>
                <Label htmlFor='isActive' className='text-sm font-medium'>
                  Active Status
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Toggle to enable or disable the coupon.
                </p>
              </div>
              <Switch
                id='isActive'
                checked={formData.isActive}
                onCheckedChange={(val) => updateField('isActive', val)}
              />
            </div>
            <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
              <div>
                <Label className='text-sm font-medium'>POS Only</Label>
                <p className='text-muted-foreground text-xs'>
                  Toggle to enable or disable the POS only coupon.
                </p>
              </div>
              <Switch
                checked={formData.couponType === 'pos'}
                onCheckedChange={(val: boolean) =>
                  updateField('couponType', val ? 'pos' : 'normal')
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{coupon.couponCode}</strong>
            ?
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-w-lg rounded-2xl border p-6 shadow-lg'>
          <DialogHeader>
            <DialogTitle className='mb-6 border-b pb-3 text-3xl font-bold'>
              {coupon.couponCode}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            <div>
              <p className='text-sm font-semibold text-gray-600'>Description</p>
              <p className='mt-1 text-gray-700'>{coupon.description || '—'}</p>
            </div>

            <div>
              <p className='text-sm font-semibold text-gray-600'>
                Terms & Conditions
              </p>
              <p className='mt-1 text-gray-700'>
                {coupon.termsAndConditions || '—'}
              </p>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-xs text-gray-400 uppercase'>
                  Min Cart Value
                </p>
                <p className='mt-1 font-medium text-gray-800'>
                  ₹{coupon.minCartValue}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>
                  Max Discount (%)
                </p>
                <p className='mt-1 font-medium text-gray-800'>
                  {coupon.maxDiscountValue}%
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>
                  Min Order Quantity
                </p>
                <p className='mt-1 font-medium text-gray-800'>
                  {coupon.minOrderQuantity}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>Level</p>
                <p className='mt-1 font-medium text-gray-800 capitalize'>
                  {coupon.level}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>Type</p>
                <p className='mt-1 font-medium text-gray-800 capitalize'>
                  {coupon.type}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>User</p>
                <p className='mt-1 font-medium text-gray-800'>
                  {coupon.userType?.user_details?.name || '—'} <br />
                  <span className='text-xs text-gray-500'>
                    {coupon.userType?.email || '—'}
                  </span>
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>Max Usage</p>
                <p className='mt-1 font-medium text-gray-800'>
                  {coupon.maxUsage}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>
                  Max Usage Per User
                </p>
                <p className='mt-1 font-medium text-gray-800'>
                  {coupon.maxUsagePerUser || 1}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>Usage Count</p>
                <p className='mt-1 font-medium text-gray-800'>
                  {coupon.usageCount}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-400 uppercase'>
                  First Order Only
                </p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    coupon.firstOrderOnly
                      ? 'border border-blue-300 bg-blue-100 text-blue-700'
                      : 'border border-gray-300 bg-gray-100 text-gray-700'
                  }`}
                >
                  {coupon.firstOrderOnly ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
              <div>
                <p className='mb-1 text-xs text-gray-400 uppercase'>Status</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    coupon.isActive
                      ? 'border border-green-300 bg-green-100 text-green-700'
                      : 'border border-red-300 bg-red-100 text-red-700'
                  }`}
                >
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className='grid flex-1 grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-gray-400 uppercase'>Start Date</p>
                  <p className='mt-1 font-medium text-gray-800'>
                    {formatDateOnly(coupon.startDate)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-400 uppercase'>Expiry Date</p>
                  <p className='mt-1 font-medium text-gray-800'>
                    {formatDateOnly(coupon.expiryDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-xs text-gray-400 uppercase'>Created At</p>
                <p className='mt-1 font-medium text-gray-800'>
                  {formatDateTime(coupon.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
