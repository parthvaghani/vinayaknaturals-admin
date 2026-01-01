import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useInitiateRefund } from '@/hooks/use-orders'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RefundDialogProps {
  open: boolean
  onClose: () => void
  orderId: string
  maxRefundable: number
  onSuccess?: () => void
}

export function RefundDialog({
  open,
  onClose,
  orderId,
  maxRefundable,
  onSuccess,
}: RefundDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [isFullRefund, setIsFullRefund] = useState<boolean>(false)

  const { mutate: initiateRefund, isPending } = useInitiateRefund()

  const handleSubmit = () => {
    const refundAmount = isFullRefund ? maxRefundable : Number(amount)

    // Validation
    if (!refundAmount || refundAmount <= 0) {
      toast.error('Please enter a valid refund amount')
      return
    }

    if (refundAmount > maxRefundable) {
      toast.error(`Refund amount cannot exceed ₹${maxRefundable}`)
      return
    }

    initiateRefund(
      {
        id: orderId,
        amount: refundAmount,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Refund initiated successfully')
          handleClose()
          onSuccess?.()
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to initiate refund'
          toast.error(message)
        },
      }
    )
  }

  const handleClose = () => {
    setAmount('')
    setReason('')
    setIsFullRefund(false)
    onClose()
  }

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Initiate Refund</DialogTitle>
          <DialogDescription>
            Process a refund for this order. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Max Refundable Amount Info */}
          <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-4 w-4 text-blue-600' />
              <div className='text-sm text-blue-900'>
                <strong>Maximum Refundable:</strong>{' '}
                {formatCurrency(maxRefundable)}
              </div>
            </div>
          </div>

          {/* Full Refund Toggle */}
          {/* <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fullRefund"
              checked={isFullRefund}
              onChange={(e) => {
                setIsFullRefund(e.target.checked)
                if (e.target.checked) {
                  setAmount(maxRefundable.toString())
                } else {
                  setAmount('')
                }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="fullRefund" className="text-sm font-medium">
              Full Refund ({formatCurrency(maxRefundable)})
            </Label>
          </div> */}

          {/* Refund Amount */}
          {!isFullRefund && (
            <div className='space-y-2'>
              <Label htmlFor='amount'>Refund Amount (₹)</Label>
              <Input
                id='amount'
                type='number'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='Enter amount'
                min='1'
                max={maxRefundable}
                step='1'
              />
            </div>
          )}

          {/* Refund Reason */}
          <div className='space-y-2'>
            <Label htmlFor='reason'>Refund Reason (Optional)</Label>
            <Textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Enter detailed reason for refund (optional)'
              rows={3}
              maxLength={500}
            />
            <p className='text-muted-foreground text-xs'>
              {reason.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Processing...' : 'Initiate Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
