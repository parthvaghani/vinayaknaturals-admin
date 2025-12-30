import { useState } from 'react'
import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { Trash2, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import {
  useDeleteBulkOrder,
  useDownloadBulkOrderSummary,
} from '@/hooks/use-bulk-orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export interface BulkOrderRow {
  _id: string
  fullName: string
  emailAddress: string
  phoneNumber?: string
  deliveryAddress?: string
  products: Array<{
    _id: string
    name: string
    description: string
    images: Array<{
      url: string
      _id: string
    }>
    variants: {
      gm?: Array<{
        weight: string
        price: number
        discount: number
        _id: string
      }>
      kg?: Array<{
        weight: string
        price: number
        discount: number
        _id: string
      }>
    }
  }>
  createdAt?: string
  updatedAt?: string
}

function OrderDetailsDialog({ order }: { order: BulkOrderRow }) {
  const [open, setOpen] = useState(false)
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
          <span className='sr-only'>View order details</span>
          <Eye className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent
        className='max-w-auto max-h-[80vh] overflow-y-auto sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw]'
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Complete details for order from {order.fullName}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6'>
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Full Name
                  </p>
                  <p className='text-sm'>{order.fullName}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Email
                  </p>
                  <p className='text-sm'>{order.emailAddress}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Phone
                  </p>
                  <p className='text-sm'>
                    {order.phoneNumber || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Order Date
                  </p>
                  <p className='text-sm'>
                    {order.createdAt
                      ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')
                      : 'Not available'}
                  </p>
                </div>
              </div>
              {order.deliveryAddress && (
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Delivery Address
                  </p>
                  <p className='text-sm'>{order.deliveryAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({order.products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {order.products.map((product) => (
                  <div
                    key={product._id}
                    className='flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 sm:space-x-4'
                  >
                    {product.images && product.images.length > 0 && (
                      <div className='h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow-sm sm:h-16 sm:w-16'>
                        <img
                          src={`${base}${product.images[0].url}`}
                          alt={product.name}
                          className='h-full w-full object-cover'
                        />
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <h4 className='truncate text-sm font-medium'>
                        {product.name}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActionsCell({ bulkOrder }: { bulkOrder: BulkOrderRow }) {
  const deleteBulkOrder = useDeleteBulkOrder()
  const downloadSummary = useDownloadBulkOrderSummary()

  const handleDelete = async () => {
    try {
      await deleteBulkOrder.mutateAsync(bulkOrder._id)
      toast.success('Bulk order deleted successfully')
    } catch (_error) {
      toast.error('Failed to delete bulk order')
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await downloadSummary.mutateAsync(bulkOrder._id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bulk-order-${bulkOrder._id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Summary downloaded successfully')
    } catch (_error) {
      toast.error('Failed to download summary')
    }
  }

  return (
    <div className='flex items-center space-x-2'>
      <OrderDetailsDialog order={bulkOrder} />
      <Button
        variant='ghost'
        size='sm'
        onClick={handleDownload}
        disabled={downloadSummary.isPending}
        className='h-8 w-8 p-0'
      >
        <span className='sr-only'>Download summary</span>
        <Download className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleDelete}
        disabled={deleteBulkOrder.isPending}
        className='h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700'
      >
        <span className='sr-only'>Delete bulk order</span>
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  )
}

export const columns: ColumnDef<BulkOrderRow>[] = [
  {
    accessorKey: 'fullName',
    header: 'Customer Name',
    cell: ({ row }) => {
      const fullName = row.getValue('fullName') as string
      return <div className='font-medium'>{fullName}</div>
    },
  },
  {
    accessorKey: 'emailAddress',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('emailAddress') as string
      return <div className='text-muted-foreground text-sm'>{email}</div>
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    cell: ({ row }) => {
      const phoneNumber = row.getValue('phoneNumber') as string
      return <div className='text-sm'>{phoneNumber || '-'}</div>
    },
  },
  {
    accessorKey: 'products',
    header: 'Products',
    cell: ({ row }) => {
      const products = row.getValue('products') as BulkOrderRow['products']
      return (
        <div className='text-sm'>
          <Badge variant='secondary'>{products.length} items</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'deliveryAddress',
    header: 'Delivery Address',
    cell: ({ row }) => {
      const address = row.getValue('deliveryAddress') as string
      return (
        <div className='max-w-[200px] truncate text-sm' title={address}>
          {address || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Order Date',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      return (
        <div className='text-sm'>
          {createdAt ? format(new Date(createdAt), 'MMM dd, yyyy') : '-'}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const bulkOrder = row.original
      return <ActionsCell bulkOrder={bulkOrder} />
    },
  },
]
