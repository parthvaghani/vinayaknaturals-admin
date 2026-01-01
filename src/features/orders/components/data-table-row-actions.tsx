import { useCallback, useEffect, useMemo, useState, memo } from 'react'
import { Row } from '@tanstack/react-table'
import {
  ShoppingCart,
  CheckCircle2,
  Package,
  XCircle,
  Hourglass,
  PackageCheck,
  Edit2,
  Save,
  X,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useIdByOrder,
  useUpdateOrderShippingCharge,
  useDownloadInvoice,
  type Order,
} from '@/hooks/use-orders'
import { RefundDialog } from './refund-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as UiTR,
} from '@/components/ui/table'
import { ContentLoader } from '@/components/content-loader'

// Types remain the same
export interface OrderRow {
  _id: string
  userId:
  | string
  | {
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
  totalAmount?: number
  originalTotal?: number
  shippingCharge?: number
  images?: string[]
  address?: {
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  productsDetails?: Array<{
    productId?: {
      _id?: string
      name?: string
      images?: string[]
    }
    weightVariant?: string
    weight?: string
    pricePerUnit?: number
    discount?: number
    totalUnit?: number
    _id?: string
  }>
  updatedAt?: string
  cancelDetails?: { reason?: string | null }
  paymentStatus: string
  applyCoupon: {
    couponId: string
    discountAmount: number
    discountPercentage: string
  }
  paymentMethod?: 'prepaid' | 'cod'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  prepaidDiscount?: number
  codFee?: number
  finalAmount?: number
}

type StatusHistoryEntry = {
  _id: string
  status: string
  note: string | null
  updatedBy: 'user' | 'admin'
  date: string
  trackingNumber?: number | null
  trackingLink?: string | null
  courierName?: string | null
  customMessage?: string | null
}

type NormalizedOrder = {
  _id: string
  userId: OrderRow['userId']
  phoneNumber: string
  status: string
  createdAt: string
  cancelDetails?: { reason?: string | null }
  address?: OrderRow['address']
  productsDetails?: OrderRow['productsDetails']
  totalAmount?: number
  originalTotal?: number
  shippingCharge?: number
  statusHistory?: StatusHistoryEntry[]
  paymentMethod?: 'prepaid' | 'cod'
  paymentStatus?: string
  razorpayPaymentId?: string
  finalAmount?: number
  refund?: {
    refundId: string | null
    refundAmount: number
    refundStatus: 'pending' | 'processed' | 'failed' | 'none'
    refundReason: string | null
    refundInitiatedAt: string | null
    refundProcessedAt: string | null
    refundInitiatedBy: string | null
    refundHistory: Array<{
      status: string
      razorpayRefundId?: string
      amount?: number
      timestamp: string
      error?: string
      note?: string
    }>
  }
}

// Constants moved outside component for better performance
const ORDER_STEPS = [
  {
    key: 'placed',
    label: 'Your order has been placed',
    text: 'Order received in kitchen',
    icon: ShoppingCart,
  },
  {
    key: 'accepted',
    label: 'Order confirmed and accepted',
    text: 'Chef has accepted your order',
    icon: CheckCircle2,
  },
  {
    key: 'inprogress',
    label: 'Your order is being prepared',
    text: "We're preparing your order with care",
    icon: Hourglass,
  },
  {
    key: 'completed',
    label: 'Order is ready for delivery',
    text: 'Your order is ready to go!',
    icon: Package,
  },
  {
    key: 'cancelled',
    label: 'Order has been cancelled',
    text: 'Oops! Order was cancelled',
    icon: XCircle,
  },
  {
    key: 'delivered',
    label: 'Order has been delivered',
    text: 'Order successfully delivered',
    icon: PackageCheck,
  },
] as const

const STATUS_VARIANTS = {
  placed: 'placed',
  accepted: 'reviewed',
  inprogress: 'inprogress',
  completed: 'enable',
  cancelled: 'destructive',
  delivered: 'delivered',
} as const

// Helper functions moved outside component
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

// Fixed normalizeOrderFromApi function - preserve actual values
const normalizeOrderFromApi = (o: Order): NormalizedOrder => ({
  _id: o._id,
  userId: o.userId as NormalizedOrder['userId'],
  phoneNumber: o.phoneNumber,
  status: o.status,
  createdAt: o.createdAt,
  cancelDetails: o.cancelDetails,
  address: o.address,
  productsDetails: o.productsDetails as NormalizedOrder['productsDetails'],
  totalAmount: o.totalAmount, // Keep the actual value instead of undefined
  originalTotal: o.originalTotal, // Keep the actual value instead of undefined
  shippingCharge: o.shippingCharge,
  statusHistory: (o as unknown as { statusHistory?: StatusHistoryEntry[] })
    .statusHistory,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  razorpayPaymentId: o.razorpayPaymentId,
  finalAmount: o.finalAmount,
  refund: o.refund,
})

// Add helper function to calculate product-level discount from line items
const calculateProductDiscount = (
  productsDetails?: OrderRow['productsDetails']
): number => {
  if (!productsDetails || productsDetails.length === 0) return 0

  return productsDetails.reduce((totalDiscount, product) => {
    const discount = Number(product.discount || 0)
    const quantity = Number(product.totalUnit || 1)
    return totalDiscount + discount * quantity
  }, 0)
}

const getImageUrl = (images: unknown): string => {
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? ''
  const raw = images as unknown
  const path =
    typeof raw === 'string'
      ? raw
      : raw && typeof (raw as { url?: unknown }).url === 'string'
        ? (raw as { url: string }).url
        : ''
  return path ? `${base}${path}` : ''
}

const getUserDisplayName = (userId: NormalizedOrder['userId']): string => {
  if (typeof userId === 'object' && userId !== null) {
    return (
      userId.user_details?.name ||
      userId.email ||
      userId._id ||
      userId.id ||
      '—'
    )
  }
  return String(userId)
}

const getUserEmail = (userId: NormalizedOrder['userId']): string => {
  return typeof userId === 'object' && userId?.email ? userId.email : '—'
}

// Sub-components for better organization
const ShippingChargeEditor = memo(
  ({
    isEditing,
    value,
    onValueChange,
    onSave,
    onCancel,
    onEdit,
    isLoading,
    currentStatus,
  }: {
    isEditing: boolean
    value: number
    onValueChange: (value: number) => void
    onSave: () => void
    onCancel: () => void
    onEdit: () => void
    isLoading: boolean
    currentStatus: string
  }) => {
    if (isEditing) {
      return (
        <>
          <Input
            type='number'
            value={value}
            onChange={(e) => onValueChange(Number(e.target.value))}
            className='h-8 w-20 text-sm'
            min='0'
            step='0.01'
          />
          <Button
            size='sm'
            variant='ghost'
            onClick={onSave}
            disabled={isLoading}
            className='h-8 w-8 p-0'
          >
            <Save className='h-4 w-4' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={onCancel}
            className='h-8 w-8 p-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </>
      )
    }

    return (
      <>
        <span className='font-medium'>{formatINR(value)}</span>
        {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
          <Button
            size='sm'
            variant='ghost'
            onClick={onEdit}
            className='h-8 w-8 p-0'
          >
            <Edit2 className='h-4 w-4' />
          </Button>
        )}
      </>
    )
  }
)

ShippingChargeEditor.displayName = 'ShippingChargeEditor'

const TrackingStep = memo(
  ({
    step,
    index,
    isLast,
    stepIndex,
    isCancelled,
    historyEntry,
  }: {
    step: (typeof ORDER_STEPS)[number]
    index: number
    isLast: boolean
    stepIndex: number
    isCancelled: boolean
    historyEntry?: StatusHistoryEntry
  }) => {
    const isCompleted = !isCancelled && index < stepIndex
    const isActive = !isCancelled && index === stepIndex
    const Icon = step.icon

    const classes = useMemo(() => {
      if (isCancelled && index === stepIndex) {
        return {
          circle:
            'bg-destructive border-destructive text-destructive-foreground',
          connector: 'bg-destructive',
          label: 'text-destructive',
        }
      }
      if (isCompleted) {
        return {
          circle: 'bg-muted border-muted text-primary',
          connector: 'bg-foreground',
          label: 'text-foreground',
        }
      }
      if (isActive) {
        return {
          circle: 'border-primary text-primary-foreground bg-primary',
          connector: 'bg-primary',
          label: 'text-foreground',
        }
      }
      return {
        circle: 'bg-white border-border text-muted',
        connector: 'bg-border',
        label: 'text-muted',
      }
    }, [isCancelled, isCompleted, isActive, index, stepIndex])

    const hasTrackingDetails =
      historyEntry &&
      (historyEntry?.trackingNumber ||
        historyEntry?.trackingLink ||
        historyEntry?.courierName)

    return (
      <div className='relative flex min-h-[120px] flex-1 flex-col items-center justify-start text-center'>
        <div
          className={`relative z-10 mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 ${classes.circle}`}
        >
          <Icon className='h-5 w-5' />
        </div>

        <div className='flex max-w-[140px] flex-col items-center space-y-1'>
          <span
            className={`text-xs leading-tight font-semibold ${classes.label}`}
          >
            {step.label}
          </span>

          {historyEntry?.date && (
            <span className='text-muted-foreground text-[10px]'>
              {new Date(historyEntry.date).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}

          {historyEntry?.note && (
            <span className='text-muted-foreground text-[10px] leading-tight italic'>
              {historyEntry.note}
            </span>
          )}

          {hasTrackingDetails && (
            <div className='text-muted-foreground mt-2 space-y-1 text-[10px]'>
              {historyEntry?.trackingNumber && (
                <div className='text-foreground font-medium'>
                  Tracking: {historyEntry.trackingNumber}
                </div>
              )}
              {historyEntry?.courierName && (
                <div>Courier: {historyEntry.courierName}</div>
              )}
              {historyEntry?.trackingLink && (
                <div>
                  <a
                    href={historyEntry.trackingLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 underline hover:text-blue-800'
                  >
                    Track Order
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {!isLast && (
          <div
            className={`absolute top-6 left-1/2 z-0 h-0.5 ${classes.connector}`}
            style={{
              width: 'calc(100% - 24px)',
              transform: 'translateX(12px)',
            }}
          />
        )}
      </div>
    )
  }
)

TrackingStep.displayName = 'TrackingStep'

const ProductTableRow = memo(
  ({
    product,
  }: {
    product: NonNullable<OrderRow['productsDetails']>[number]
  }) => {
    const unit = Number(product.pricePerUnit || 0)
    const off = Number(product.discount || 0)
    const qty = Number(product.totalUnit || 1)
    const line = (unit - off) * qty
    const thumb = useMemo(
      () => getImageUrl(product.productId?.images?.[0]),
      [product.productId?.images]
    )

    return (
      <UiTR>
        <TableCell>
          <div className='flex items-center gap-3'>
            {thumb && (
              <img
                src={thumb}
                alt={product.productId?.name || 'Product'}
                className='h-10 w-10 flex-shrink-0 rounded border object-cover'
              />
            )}
            <div className='flex min-w-0 flex-col'>
              <span className='truncate font-medium'>
                {product.productId?.name || '—'}
              </span>
              <span className='text-muted-foreground truncate text-xs'>
                {product.productId?._id || ''}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {product.weight
            ? `${product.weight}${product.weightVariant || ''}`
            : '—'}
        </TableCell>
        <TableCell className='text-right'>{formatINR(unit)}</TableCell>
        <TableCell className='text-right text-red-600'>
          {off ? `- ${formatINR(off)}` : `- ${formatINR(0)}`}
        </TableCell>
        <TableCell className='text-right'>{qty}</TableCell>
        <TableCell className='text-right font-medium'>
          {formatINR(line)}
        </TableCell>
      </UiTR>
    )
  }
)

ProductTableRow.displayName = 'ProductTableRow'

// Main component
export function DataTableRowActions({ row }: { row: Row<OrderRow> }) {
  const order = row.original
  const [open, setOpen] = useState(false)
  const [isEditingShipping, setIsEditingShipping] = useState(false)
  const [shippingChargeValue, setShippingChargeValue] = useState<number>(0)
  const [showRefundDialog, setShowRefundDialog] = useState(false)

  const {
    data: fetchedOrder,
    isLoading: isLoadingOrder,
    refetch,
  } = useIdByOrder(open ? order._id : undefined)
  const updateShippingChargeMutation = useUpdateOrderShippingCharge()
  const downloadInvoiceMutation = useDownloadInvoice()

  // Fixed: Removed duplicate useEffect
  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  const detail: NormalizedOrder = useMemo(
    () => (fetchedOrder ? normalizeOrderFromApi(fetchedOrder) : order),
    [fetchedOrder, order]
  )

  useEffect(() => {
    if (detail?.shippingCharge !== undefined) {
      setShippingChargeValue(detail.shippingCharge)
    }
  }, [detail?.shippingCharge])

  // Memoized computed values
  const currentStatus = useMemo(
    () => String(detail.status ?? order.status),
    [detail.status, order.status]
  )
  const status = useMemo(
    () =>
      STATUS_VARIANTS[currentStatus as keyof typeof STATUS_VARIANTS] ||
      'default',
    [currentStatus]
  )

  const displayName = useMemo(
    () => getUserDisplayName(detail?.userId),
    [detail?.userId]
  )
  const email = useMemo(() => getUserEmail(detail?.userId), [detail?.userId])

  const filteredSteps = useMemo(() => {
    const current = currentStatus.toLowerCase()
    if (current === 'delivered') {
      return ORDER_STEPS.filter((s) => s.key !== 'cancelled')
    }
    if (current === 'cancelled') {
      return ORDER_STEPS.filter((s) => s.key !== 'delivered')
    }
    return ORDER_STEPS.filter((s) => s.key !== 'cancelled')
  }, [currentStatus])

  const trackingInfo = useMemo(() => {
    return detail.statusHistory?.find(
      (h) =>
        h.trackingNumber || h.trackingLink || h.courierName || h.customMessage
    )
  }, [detail.statusHistory])

  const stepIndex = useMemo(() => {
    const current = currentStatus.toLowerCase()
    return filteredSteps.findIndex((s) => s.key === current)
  }, [currentStatus, filteredSteps])

  const isCancelled = useMemo(
    () => currentStatus.toLowerCase() === 'cancelled',
    [currentStatus]
  )

  // Inside the main component, update orderTotals calculation
  const orderTotals = useMemo(() => {
    // Calculate product-level discount from line items
    const productDiscount = calculateProductDiscount(detail.productsDetails)

    // Get subtotal (original price before any discounts)
    const subtotal = order.originalTotal ?? order.totalAmount ?? 0

    // Coupon discount
    const couponDiscount = order.applyCoupon?.discountAmount ?? 0

    // Payment method discounts/fees
    const prepaidDiscount = order.prepaidDiscount ?? 0
    const codFee = order.codFee ?? 0

    // Total after product discount
    const afterProductDiscount = detail.totalAmount ?? order.totalAmount ?? 0

    // Total savings (product discount + coupon discount + prepaid discount)
    const totalSavings = productDiscount + couponDiscount + prepaidDiscount

    // Final amount (what user actually paid) - use finalAmount from order if available, otherwise calculate
    const finalAmount =
      order.finalAmount ??
      afterProductDiscount - couponDiscount - prepaidDiscount + codFee

    // Final total including shipping
    const finalTotal = finalAmount + (detail?.shippingCharge ?? 0)

    return {
      subtotal,
      productDiscount,
      couponDiscount,
      prepaidDiscount,
      codFee,
      totalSavings,
      afterProductDiscount,
      finalAmount,
      finalTotal,
    }
  }, [
    order.originalTotal,
    order.totalAmount,
    order.finalAmount,
    order.prepaidDiscount,
    order.codFee,
    detail.totalAmount,
    detail.productsDetails,
    detail.shippingCharge,
    order.applyCoupon,
  ])

  // Calculate refund eligibility and max refundable amount
  // Allow refunds from any status (as per backend logic)
  // Only check: prepaid method, has payment ID, not already fully refunded
  const canRefund = useMemo(() => {
    return (
      detail.paymentMethod === 'prepaid' &&
      detail.razorpayPaymentId &&
      detail.paymentStatus !== 'refunded' // Can't refund if already fully refunded
    )
  }, [detail.paymentMethod, detail.paymentStatus, detail.razorpayPaymentId])

  const maxRefundable = useMemo(() => {
    const paidAmount = detail.finalAmount || 0
    const alreadyRefunded = detail.refund?.refundAmount || 0
    return Math.max(0, paidAmount - alreadyRefunded)
  }, [detail.finalAmount, detail.refund])

  // useCallback for event handlers
  const handleShippingChargeEdit = useCallback(() => {
    setIsEditingShipping(true)
  }, [])

  const handleShippingChargeSave = useCallback(async () => {
    try {
      await updateShippingChargeMutation.mutateAsync({
        id: detail._id,
        shippingCharge: shippingChargeValue,
      })
      setIsEditingShipping(false)
      toast.success('Shipping charge updated successfully')
      refetch()
    } catch (_error) {
      toast.error('Failed to update shipping charge')
    }
  }, [detail._id, shippingChargeValue, updateShippingChargeMutation, refetch])

  const handleShippingChargeCancel = useCallback(() => {
    setShippingChargeValue(detail?.shippingCharge ?? 0)
    setIsEditingShipping(false)
  }, [detail?.shippingCharge])

  const handleDownloadInvoice = useCallback(async () => {
    if (!detail._id) return
    try {
      const blob = await downloadInvoiceMutation.mutateAsync(detail._id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${fetchedOrder?.invoiceNumber || detail._id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Invoice downloaded successfully')
    } catch {
      toast.error('Failed to download invoice')
    }
  }, [detail._id, downloadInvoiceMutation, fetchedOrder])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          View
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-4xl'>
        {isLoadingOrder ? (
          <div className='relative min-h-[200px]'>
            <ContentLoader active />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className='flex items-center justify-between'>
                <DialogTitle className='flex items-center gap-2'>
                  <span>Order Details</span>
                  <Badge
                    variant={
                      order.paymentStatus === 'paid' ? 'enable' : 'destructive'
                    }
                    className='shadow-xl/15'
                  >
                    {order.paymentStatus}
                  </Badge>
                </DialogTitle>
                <div className='flex items-center gap-1.5 mr-3'>
                  {fetchedOrder?.invoiceNumber && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleDownloadInvoice}
                      disabled={downloadInvoiceMutation.isPending}
                      className='gap-2'
                    >
                      <Download className='h-4 w-4' />
                      {downloadInvoiceMutation.isPending
                        ? 'Downloading...'
                        : 'Download Invoice'}
                    </Button>
                  )}
                  {canRefund && maxRefundable > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setShowRefundDialog(true)}
                      className='gap-2'
                    >
                      Initiate Refund
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className='space-y-6 text-sm'>
              {/* Order Info Grid */}
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <div className='space-y-3'>
                  <h3 className='text-base font-semibold'>Order Information</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Order ID</span>
                      <span className='max-w-[280px] truncate font-medium'>
                        {detail?._id}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>User</span>
                      <span className='max-w-[280px] truncate font-medium'>
                        {displayName}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Email</span>
                      <span className='font-medium'>{email}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Phone</span>
                      <span className='font-medium'>{detail?.phoneNumber}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Created</span>
                      <span className='font-medium'>
                        {detail?.createdAt
                          ? new Date(detail.createdAt).toLocaleString('en-IN')
                          : ''}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>
                        Shipping Charge
                      </span>
                      <div className='flex items-center gap-2'>
                        <ShippingChargeEditor
                          isEditing={isEditingShipping}
                          value={shippingChargeValue}
                          onValueChange={setShippingChargeValue}
                          onSave={handleShippingChargeSave}
                          onCancel={handleShippingChargeCancel}
                          onEdit={handleShippingChargeEdit}
                          isLoading={updateShippingChargeMutation.isPending}
                          currentStatus={currentStatus}
                        />
                      </div>
                    </div>
                    {detail?.cancelDetails?.reason && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Cancel Reason
                        </span>
                        <span className='font-medium text-red-600'>
                          {detail.cancelDetails.reason}
                        </span>
                      </div>
                    )}
                    {detail?.refund && detail.refund.refundStatus !== 'none' && (
                      <>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Refund Status</span>
                          <Badge
                            variant={
                              detail.refund.refundStatus === 'processed'
                                ? 'enable'
                                : detail.refund.refundStatus === 'failed'
                                  ? 'destructive'
                                  : 'default'
                            }
                          >
                            {detail.refund.refundStatus}
                          </Badge>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Refund Amount</span>
                          <span className='font-medium'>{formatINR(detail.refund.refundAmount)}</span>
                        </div>
                        {detail.refund.refundId && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Refund ID</span>
                            <span className='font-medium text-xs break-all'>{detail.refund.refundId}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tracking Details Section */}
                {trackingInfo && (
                  <div className='space-y-3'>
                    <h3 className='text-base font-semibold'>
                      Tracking Information
                    </h3>
                    <div className='rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20'>
                      <div className='space-y-2'>
                        {trackingInfo.trackingNumber && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Tracking Number
                            </span>
                            <span className='font-medium'>
                              {trackingInfo.trackingNumber}
                            </span>
                          </div>
                        )}
                        {trackingInfo.courierName && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Courier
                            </span>
                            <span className='font-medium'>
                              {trackingInfo.courierName}
                            </span>
                          </div>
                        )}
                        {trackingInfo.trackingLink && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Tracking Link
                            </span>
                            <a
                              href={trackingInfo.trackingLink}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='font-medium text-blue-600 underline hover:text-blue-800'
                            >
                              Track Order
                            </a>
                          </div>
                        )}
                        {trackingInfo.customMessage && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Custom Message
                            </span>
                            <span className='font-medium'>
                              {trackingInfo.customMessage}
                            </span>
                          </div>
                        )}
                        {trackingInfo.date && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                              Updated
                            </span>
                            <span className='text-muted-foreground text-sm'>
                              {new Date(trackingInfo.date).toLocaleString(
                                'en-IN'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div className='space-y-3'>
                  <h3 className='text-base font-semibold'>Shipping Address</h3>
                  <div className='bg-muted/20 rounded-lg border p-4 break-words whitespace-pre-wrap'>
                    {detail?.address ? (
                      <>
                        <div>{detail.address.addressLine1},</div>
                        {detail.address.addressLine2 && (
                          <div>{detail.address.addressLine2},</div>
                        )}
                        <div>
                          {[
                            detail.address.city,
                            detail.address.state,
                            detail.address.zip,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                          ,
                        </div>
                        <div>{detail.address.country}.</div>
                      </>
                    ) : (
                      <div className='text-muted-foreground'>
                        No address provided
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div>
                <h3 className='mb-4 text-base font-semibold'>Items</h3>

                {/* Desktop Table View */}
                <div className='hidden overflow-hidden rounded-lg border lg:block'>
                  <div className='max-h-60 overflow-auto'>
                    <Table>
                      <TableHeader>
                        <UiTR>
                          <TableHead>Product</TableHead>
                          <TableHead className='w-[100px]'>Weight</TableHead>
                          <TableHead className='w-[120px] text-right'>
                            Unit Price
                          </TableHead>
                          <TableHead className='w-[110px] text-right'>
                            Discount
                          </TableHead>
                          <TableHead className='w-[80px] text-right'>
                            Qty
                          </TableHead>
                          <TableHead className='w-[120px] text-right'>
                            Line Total
                          </TableHead>
                        </UiTR>
                      </TableHeader>
                      <TableBody>
                        {(detail.productsDetails || []).map((p) => (
                          <ProductTableRow
                            key={String(
                              p._id || p.productId?._id || Math.random()
                            )}
                            product={p}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Tablet and Mobile views remain similar but should also be extracted to separate components */}

                {/* Order Summary */}
                <div className='mt-4 flex justify-end'>
                  <div className='bg-muted/20 w-full rounded-lg border p-4 sm:max-w-sm'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm sm:text-base'>
                        <span>Subtotal:</span>
                        <span>{formatINR(orderTotals.subtotal)}</span>
                      </div>

                      {/* Product-level Discount - Fixed */}
                      {orderTotals.productDiscount > 0 && (
                        <div className='flex justify-between text-sm text-orange-600 sm:text-base'>
                          <span>Product Discount:</span>
                          <span>
                            - {formatINR(orderTotals.productDiscount)}
                          </span>
                        </div>
                      )}

                      {/* Coupon Discount */}
                      {orderTotals.couponDiscount > 0 && (
                        <div className='flex justify-between text-sm text-green-600 sm:text-base'>
                          <span>Coupon Discount</span>
                          <span>- {formatINR(orderTotals.couponDiscount)}</span>
                        </div>
                      )}

                      {/* Additional 10% Discount for Prepaid - shown above Total Discount */}
                      {orderTotals.prepaidDiscount > 0 && (
                        <div className='flex justify-between text-sm text-orange-600 sm:text-base'>
                          <span>Additional 10% discount</span>
                          <span>
                            - {formatINR(orderTotals.prepaidDiscount)}
                          </span>
                        </div>
                      )}

                      {/* Total Discount - includes all discounts (product + coupon + prepaid) */}
                      {(orderTotals.productDiscount > 0 ||
                        orderTotals.couponDiscount > 0 ||
                        orderTotals.prepaidDiscount > 0) && (
                          <div className='flex justify-between text-sm font-medium sm:text-base'>
                            <span>Total Discount:</span>
                            <span className='text-green-600'>
                              {formatINR(
                                orderTotals.productDiscount +
                                orderTotals.couponDiscount +
                                orderTotals.prepaidDiscount
                              )}
                            </span>
                          </div>
                        )}

                      {/* COD Fee */}
                      {orderTotals.codFee > 0 && (
                        <div className='flex justify-between text-sm text-orange-600 sm:text-base'>
                          <span>COD Fee</span>
                          <span>+ {formatINR(orderTotals.codFee)}</span>
                        </div>
                      )}

                      <div className='flex justify-between text-sm sm:text-base'>
                        <span>Shipping:</span>
                        <span>{formatINR(detail?.shippingCharge ?? 0)}</span>
                      </div>

                      <Separator />

                      <div className='flex justify-between text-base font-bold sm:text-lg'>
                        <span>Total:</span>
                        <span>{formatINR(orderTotals.finalTotal)}</span>
                      </div>

                      {/* Total Savings Summary */}
                      {orderTotals.totalSavings > 0 && (
                        <div className='border-t border-dashed pt-2'>
                          <div className='flex justify-between text-sm font-semibold text-green-600'>
                            <span>Total Savings:</span>
                            <span>{formatINR(orderTotals.totalSavings)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Tracking */}
              <div className='space-y-4'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-base font-semibold'>Order Tracking</h3>
                  <Badge variant={status} className='shadow-xl/15'>
                    {currentStatus}
                  </Badge>
                </div>
                <div className='bg-muted/20 dark:bg-accent/15 flex flex-col items-center justify-center rounded-lg p-6'>
                  <div className='relative flex w-full items-start justify-between'>
                    {filteredSteps.map((step, index) => {
                      const historyEntry = detail.statusHistory?.find(
                        (h) => h.status.toLowerCase() === step.key.toLowerCase()
                      )

                      return (
                        <TrackingStep
                          key={step.key}
                          step={step}
                          index={index}
                          isLast={index === filteredSteps.length - 1}
                          stepIndex={stepIndex}
                          isCancelled={isCancelled}
                          historyEntry={historyEntry}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <RefundDialog
        open={showRefundDialog}
        onClose={() => setShowRefundDialog(false)}
        orderId={detail._id}
        maxRefundable={maxRefundable}
        onSuccess={() => refetch()}
      />
    </Dialog>
  )
}
