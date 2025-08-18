import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UiTR } from '@/components/ui/table'

export interface OrderRow {
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
  totalAmount?: number
  originalTotal?: number
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
}

export function DataTableRowActions({ row }: { row: Row<OrderRow> }) {
  const order = row.original
  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-max">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Order Details</span>
            <Badge variant={order.status === 'placed' ? 'enable' : 'pending'}>{order.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-medium truncate max-w-[280px] text-right">{order._id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium text-right truncate max-w-[280px]">
                  {typeof order.userId === 'object' && order.userId !== null
                    ? (order.userId.user_details?.name || order.userId.email || order.userId._id || order.userId.id || '—')
                    : String(order.userId)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium bg">
                  {typeof order.userId === 'object' && order.userId?.email
                    ? order.userId.email
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{order.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              {order.cancelDetails?.reason ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cancel Reason</span>
                  <span className="font-medium text-red-600">{order.cancelDetails.reason}</span>
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground font-semibold">Shipping Address</div>
              <div className="rounded-md border p-3 text-sm leading-5">
                <div>{order.address?.addressLine1}</div>
                {order.address?.addressLine2 ? <div>{order.address.addressLine2}</div> : null}
                <div>
                  {[order.address?.city, order.address?.state, order.address?.zip].filter(Boolean).join(', ')}
                </div>
                <div>{order.address?.country}</div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 text-sm font-semibold">Items</div>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <UiTR>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[100px]">Weight</TableHead>
                    <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                    <TableHead className="w-[110px] text-right">Discount</TableHead>
                    <TableHead className="w-[80px] text-right">Qty</TableHead>
                    <TableHead className="w-[120px] text-right">Line Total</TableHead>
                  </UiTR>
                </TableHeader>
                <TableBody>
                  {(order.productsDetails || []).map((p) => {
                    const unit = Number(p.pricePerUnit || 0)
                    const off = Number(p.discount || 0)
                    const qty = Number(p.totalUnit || 1)
                    const line = (unit - off) * qty
                    const thumb = (p.productId?.images && p.productId.images[0]) || undefined
                    return (
                      <UiTR key={String(p._id || p.productId?._id || Math.random())}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {thumb ? (
                              <img src={thumb} alt={p.productId?.name || 'Product'} className="h-10 w-10 rounded object-cover border" />
                            ) : null}
                            <div className="flex flex-col">
                              <span className="font-medium">{p.productId?.name || '—'}</span>
                              <span className="text-xs text-muted-foreground">{p.productId?._id || ''}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{p.weight ? `${p.weight}${p.weightVariant || ''}` : '—'}</TableCell>
                        <TableCell className="text-right">{formatINR(unit)}</TableCell>
                        <TableCell className="text-right text-red-600">{off ? `- ${formatINR(off)}` :  `- ${formatINR(0)}`}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(line)}</TableCell>
                      </UiTR>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 text-sm">
            {typeof order.originalTotal === 'number' && order.originalTotal > (order.totalAmount ?? 0) ? (
              <div className="line-through text-muted-foreground">{formatINR(order.originalTotal)}</div>
            ) : null}
            {typeof order.totalAmount === 'number' ? (
              <div className="text-base font-semibold">{formatINR(order.totalAmount)}</div>
            ) : null}
          </div>


        </div>
      </DialogContent>
    </Dialog>
  )
}


