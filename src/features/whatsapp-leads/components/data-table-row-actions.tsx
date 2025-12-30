import { useState } from 'react'
import type { VariantProps } from 'class-variance-authority'
import {
  Eye,
  Phone,
  MessageSquare,
  Calendar,
  Globe,
  User,
  Monitor,
} from 'lucide-react'
import { useWhatsappLeadById } from '@/hooks/use-whatsapp-leads'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface WhatsappLeadRow {
  _id?: string
}

export function DataTableRowActions({
  row,
}: {
  row: { original: WhatsappLeadRow }
}) {
  const [open, setOpen] = useState(false)
  const id = row.original._id || ''
  const { data } = useWhatsappLeadById(id)

  const lead = data

  return (
    <div className='flex items-center justify-center gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setOpen(true)}
        className='h-8 w-8'
      >
        <Eye className='h-4 w-4' />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <MessageSquare className='h-5 w-5' />
              WhatsApp Lead Details
            </DialogTitle>
          </DialogHeader>
          {!lead ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Loading...</div>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Lead Information */}
              <div className='space-y-4'>
                <div className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                  <MessageSquare className='h-4 w-4' />
                  Lead Information
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Page
                    </Label>
                    <div className='mt-1 text-sm font-medium'>{lead.page}</div>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Button
                    </Label>
                    <div className='mt-1 text-sm'>{lead.button}</div>
                  </div>
                </div>

                <div>
                  <Label className='text-muted-foreground text-xs'>
                    Message
                  </Label>
                  <div className='bg-muted/50 mt-1 rounded-md border p-3 text-sm'>
                    {lead.message}
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <Phone className='h-3 w-3' />
                      Phone Number
                    </Label>
                    <div className='mt-1 font-mono text-sm'>
                      {lead.phoneNumber}
                    </div>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Status
                    </Label>
                    <div className='mt-1'>
                      {(() => {
                        const status = String(
                          lead.status ?? 'new'
                        ).toLowerCase()
                        let variant: VariantProps<
                          typeof badgeVariants
                        >['variant'] = 'default'
                        switch (status) {
                          case 'new':
                            variant = 'pending'
                            break
                          case 'contacted':
                            variant = 'reviewed'
                            break
                          case 'closed':
                            variant = 'enable'
                            break
                          case 'spam':
                            variant = 'destructive'
                            break
                          default:
                            variant = 'default'
                        }
                        return <Badge variant={variant}>{status}</Badge>
                      })()}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      WhatsApp Intent
                    </Label>
                    <div className='mt-1'>
                      <Badge
                        variant={lead.whatsappIntent ? 'enable' : 'destructive'}
                      >
                        {lead.whatsappIntent ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      WhatsApp Sent
                    </Label>
                    <div className='mt-1'>
                      <Badge
                        variant={lead.whatsappSent ? 'enable' : 'destructive'}
                      >
                        {lead.whatsappSent ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Information */}
              <div className='space-y-4'>
                <div className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                  <Globe className='h-4 w-4' />
                  Product Information
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Product ID
                    </Label>
                    <div className='mt-1 font-mono text-sm text-xs'>
                      {lead.metadata?.productId || '—'}
                    </div>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Product Name
                    </Label>
                    <div className='mt-1 text-sm font-medium'>
                      {lead.metadata?.productName || '—'}
                    </div>
                  </div>
                </div>
                {lead.metadata?.variant && (
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Variant
                    </Label>
                    <div className='mt-1 text-sm'>{lead.metadata.variant}</div>
                  </div>
                )}
                {lead.metadata?.discountApplied !== undefined && (
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      Discount Applied
                    </Label>
                    <div className='mt-1 text-sm'>
                      <Badge
                        variant={
                          lead.metadata.discountApplied
                            ? 'enable'
                            : 'destructive'
                        }
                      >
                        {lead.metadata.discountApplied ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Source Information */}
              <div className='space-y-4'>
                <div className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                  <Globe className='h-4 w-4' />
                  Source Information
                </div>

                <div>
                  <Label className='text-muted-foreground text-xs'>
                    Source URL
                  </Label>
                  {lead.sourceUrl ? (
                    <a
                      href={lead.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary hover:text-primary/80 mt-1 block truncate text-sm underline underline-offset-4'
                    >
                      {lead.sourceUrl}
                    </a>
                  ) : (
                    <div className='text-muted-foreground mt-1 text-sm'>—</div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Technical Information */}
              <div className='space-y-4'>
                <div className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                  <Monitor className='h-4 w-4' />
                  Technical Information
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <User className='h-3 w-3' />
                      IP Address
                    </Label>
                    <div className='mt-1 font-mono text-sm'>
                      {lead.ipAddress || '—'}
                    </div>
                  </div>
                  <div>
                    <Label className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <Calendar className='h-3 w-3' />
                      Created
                    </Label>
                    <div className='mt-1 text-sm'>
                      {lead.createdAt
                        ? new Intl.DateTimeFormat('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(lead.createdAt))
                        : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className='text-muted-foreground text-xs'>
                    Updated
                  </Label>
                  <div className='mt-1 text-sm'>
                    {lead.updatedAt
                      ? new Intl.DateTimeFormat('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(lead.updatedAt))
                      : '—'}
                  </div>
                </div>

                {lead.userAgent && (
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      User Agent
                    </Label>
                    <div className='text-muted-foreground bg-muted/50 mt-1 rounded border p-2 font-mono text-xs'>
                      {lead.userAgent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
