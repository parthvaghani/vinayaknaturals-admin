import { useState } from 'react'
import { getInitials } from '@/lib/utils'
import { useOrdersList } from '@/hooks/use-orders'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

// Resolve a country input to ISO alpha-2 code
function getCountryCode(
  countryInput: string | undefined | null
): string | null {
  if (!countryInput) return null
  const input = countryInput.trim()
  const nameToCode: Record<string, string> = {
    india: 'IN',
    'united states': 'US',
    usa: 'US',
    'united kingdom': 'GB',
    uk: 'GB',
    canada: 'CA',
    australia: 'AU',
    germany: 'DE',
    france: 'FR',
    spain: 'ES',
    italy: 'IT',
    china: 'CN',
    japan: 'JP',
    brazil: 'BR',
    mexico: 'MX',
    singapore: 'SG',
    uae: 'AE',
    'united arab emirates': 'AE',
  }
  const tentativeCode =
    input.length === 2 ? input.toUpperCase() : nameToCode[input.toLowerCase()]
  if (!tentativeCode || tentativeCode.length !== 2) return null
  return tentativeCode
}

// Build a circular SVG flag URL from ISO code using circle-flags
function getCountryFlagUrl(isoAlpha2: string | null): string | null {
  if (!isoAlpha2) return null
  return `https://hatscripts.github.io/circle-flags/flags/${isoAlpha2.toLowerCase()}.svg`
}

// Emoji fallback if images are blocked
function getEmojiFlagFromCode(isoAlpha2: string | null): string {
  if (!isoAlpha2) return ''
  const code = isoAlpha2.toUpperCase()
  const A = 0x41
  const regionalIndicatorOffset = 0x1f1e6
  const first = code.charCodeAt(0) - A + regionalIndicatorOffset
  const second = code.charCodeAt(1) - A + regionalIndicatorOffset
  return String.fromCodePoint(first, second)
}

export function RecentSales() {
  const { data, isLoading } = useOrdersList({
    page: 1,
    limit: 5,
    status: 'placed',
    sortBy: 'createdAt:desc',
  })
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className='text-muted-foreground space-y-2 text-sm'>
        Loading recent sales…
      </div>
    )
  }

  const orders = data?.results ?? []

  if (!orders.length) {
    return (
      <div className='text-muted-foreground text-sm'>
        No recent placed orders.
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {orders.map((order) => {
        const name =
          typeof order.userId === 'object' && order.userId !== null
            ? order.userId.user_details?.name ||
              order.userId.email ||
              order.phoneNumber ||
              'Customer'
            : order.phoneNumber || 'Customer'
        const email =
          typeof order.userId === 'object' && order.userId !== null
            ? order.userId.email || ''
            : ''

        const products = order.productsDetails || []
        const base = import.meta.env.VITE_IMAGE_BASE_URL ?? ''
        const firstImage = products[0]?.productId?.images?.[0] as unknown as
          | string
          | { url: string }
          | undefined
        const avatarImageUrlRaw =
          typeof firstImage === 'string' ? firstImage : firstImage?.url || ''
        const avatarImageUrl =
          /^https?:\/\//i.test(avatarImageUrlRaw) || !base
            ? avatarImageUrlRaw
            : `${base}${avatarImageUrlRaw}`

        // Calculate subtotal (after individual product discounts)
        const subtotal = products.reduce((sum, item) => {
          const effectiveUnitPrice =
            typeof item.discount === 'number'
              ? item.pricePerUnit - item.discount
              : item.pricePerUnit
          const lineTotal =
            Math.max(0, effectiveUnitPrice) * (item.totalUnit ?? 1)
          return sum + lineTotal
        }, 0)

        // Get coupon discount amount
        const couponDiscount = order.applyCoupon?.discountAmount ?? 0
        const couponPercentage = order.applyCoupon?.discountPercentage ?? null

        // Calculate final total: subtotal - coupon discount + shipping
        const total = subtotal - couponDiscount + (order.shippingCharge ?? 0)

        let createdAt = order.createdAt
        try {
          createdAt = new Date(order.createdAt).toLocaleString()
        } catch {
          createdAt = order.createdAt
        }

        const addressLine = [
          order.address?.city,
          order.address?.state,
          order.address?.zip,
        ]
          .filter(Boolean)
          .join(', ')
        const country = order.address?.country
        const countryCode = getCountryCode(country)
        const countryFlagUrl = getCountryFlagUrl(countryCode)
        const countryFlagEmoji = getEmojiFlagFromCode(countryCode)

        return (
          <Popover key={order._id} open={hoveredOrderId === order._id}>
            <PopoverTrigger asChild>
              <div
                className='hover:bg-muted bg-muted/40 mb-1 flex items-center gap-4 rounded-md p-2 transition-colors'
                onMouseEnter={() => setHoveredOrderId(order._id)}
                onMouseLeave={() =>
                  setHoveredOrderId((prev) =>
                    prev === order._id ? null : prev
                  )
                }
              >
                <Avatar className='h-9 w-9'>
                  <AvatarImage src={avatarImageUrl} alt='Product image' />
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-1 flex-wrap items-center justify-between'>
                  <div className='space-y-1'>
                    <p className='text-sm leading-none font-medium'>{name}</p>
                    {email ? (
                      <p className='text-muted-foreground text-sm'>{email}</p>
                    ) : null}
                    {addressLine || country ? (
                      <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                        {addressLine}
                        {country ? (
                          <span className='inline-flex items-center gap-1'>
                            {addressLine ? '•' : null}
                            {countryFlagUrl ? (
                              <img
                                src={countryFlagUrl}
                                alt={countryCode || country}
                                className='h-4 w-4 rounded-full object-cover'
                              />
                            ) : (
                              <span>{countryFlagEmoji || '🌐'}</span>
                            )}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <div className='font-medium'>+{formatCurrency(total)}</div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent align='end' sideOffset={8} className='w-96 p-3'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>
                    Order #{order._id.slice(-6)}
                  </p>
                  <p className='text-muted-foreground text-xs'>{createdAt}</p>
                </div>
                <div className='max-h-60 space-y-2 overflow-auto pr-1'>
                  {products.map((p) => {
                    const effectiveUnitPrice =
                      typeof p.discount === 'number'
                        ? p.pricePerUnit - p.discount
                        : p.pricePerUnit
                    const lineTotal =
                      Math.max(0, effectiveUnitPrice) * (p.totalUnit ?? 1)
                    const raw = p.productId?.images?.[0] as unknown as
                      | string
                      | { url: string }
                      | undefined
                    const img = typeof raw === 'string' ? raw : raw?.url || ''
                    const imageUrl =
                      /^https?:\/\//i.test(img) || !base ? img : `${base}${img}`
                    return (
                      <div
                        key={p._id}
                        className='flex items-start justify-between gap-3'
                      >
                        <div className='flex min-w-0 items-start gap-2'>
                          <Avatar className='h-8 w-8 rounded-md'>
                            <AvatarImage
                              src={imageUrl}
                              alt={p.productId?.name || 'Product'}
                            />
                            <AvatarFallback className='text-[10px]'>
                              Img
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium'>
                              {p.productId?.name ?? 'Product'}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              Qty: {p.totalUnit ?? 1} • Unit:{' '}
                              {formatCurrency(effectiveUnitPrice)}
                            </p>
                          </div>
                        </div>
                        <p className='shrink-0 text-sm font-medium'>
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div className='border-t pt-2'>
                  <div className='flex items-center justify-between'>
                    <p className='text-muted-foreground text-sm'>Subtotal</p>
                    <p className='text-sm font-medium'>
                      {formatCurrency(subtotal)}
                    </p>
                  </div>
                  {order.shippingCharge ? (
                    <div className='flex items-center justify-between'>
                      <p className='text-muted-foreground text-sm'>Shipping</p>
                      <p className='text-sm font-medium'>
                        {formatCurrency(order.shippingCharge)}
                      </p>
                    </div>
                  ) : null}
                  {couponDiscount > 0 && order.applyCoupon?.couponId ? (
                    <div className='flex items-center justify-between text-green-600 dark:text-green-500'>
                      <p className='flex items-center gap-1 text-sm'>
                        <span>Coupon Discount</span>
                        {couponPercentage ? (
                          <span className='rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs dark:bg-green-950'>
                            {couponPercentage}
                          </span>
                        ) : null}
                      </p>
                      <p className='text-sm font-medium'>
                        -{formatCurrency(couponDiscount)}
                      </p>
                    </div>
                  ) : null}
                  <div className='mt-2 flex items-center justify-between border-t pt-2'>
                    <p className='text-sm font-semibold'>Total</p>
                    <p className='text-sm font-semibold'>
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
                {order.address ? (
                  <div className='border-t pt-2'>
                    <p className='text-muted-foreground text-xs'>
                      {[
                        order.address.addressLine1,
                        order.address.addressLine2,
                        order.address.city,
                        order.address.state,
                        order.address.zip,
                        order.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        )
      })}
    </div>
  )
}
