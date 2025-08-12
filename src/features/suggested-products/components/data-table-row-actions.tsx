import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, SquarePen, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useDeleteSuggestedProduct,
  useSuggestedProductById,
  useUpdateSuggestedProduct,
} from '@/hooks/use-suggested-products'
import type { SuggestedProduct } from '@/hooks/use-suggested-products'

interface SuggestedProductRow {
  _id?: string
  id?: string
  name?: string
  ingredients?: string[]
  description?: string
  status?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export function DataTableRowActions({ row }: { row: { original: SuggestedProductRow } }) {
  const queryClient = useQueryClient()
  const product = row.original
  const productId = product._id || product.id || ''

  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const [formData, setFormData] = useState<SuggestedProductRow>({ ...product })
  const [ingredientsText, setIngredientsText] = useState('')

  useEffect(() => {
    setFormData({ ...product })
    setIngredientsText((product.ingredients || []).join(', '))
  }, [product])

  const { data: fetched } = useSuggestedProductById(productId)
  const { mutate: updateSuggested, isPending: isUpdating } = useUpdateSuggestedProduct()
  const { mutate: deleteSuggested, isPending: isDeleting } = useDeleteSuggestedProduct()

  const handleEditSubmit = () => {
    if (!productId) {
      toast.error('ID is missing!')
      return
    }
    type UpdatePayload = Omit<SuggestedProduct, 'createdAt' | 'updatedAt'> & { id: string }
    const payload: UpdatePayload = {
      id: productId,
      name: formData.name || '',
      description: formData.description || '',
      ingredients: ingredientsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: (formData.status as SuggestedProduct['status']) || 'pending',
    }
    updateSuggested(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suggested-products'] })
        toast.success('Suggested product updated successfully!')
        setEditOpen(false)
      },
      onError: (e: unknown) =>
        toast.error(e instanceof Error ? e.message : 'Failed to update'),
    })
  }

  const handleDelete = () => {
    if (!productId) {
      toast.error('ID is missing!')
      return
    }
    deleteSuggested(productId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suggested-products'] })
        toast.success('Suggested product deleted successfully!')
        setDeleteConfirm(false)
      },
      onError: (e: unknown) =>
        toast.error(e instanceof Error ? e.message : 'Failed to delete'),
    })
  }

  return (
    <div className='flex items-center justify-center gap-2'>
      <Button variant='ghost' size='icon' onClick={() => setEditOpen(true)} className='h-8 w-8'>
        <SquarePen className='h-4 w-4 text-blue-600' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => setDeleteConfirm(true)} className='h-8 w-8'>
        <Trash className='h-4 w-4 text-red-600' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => setDetailsOpen(true)} className='h-8 w-8'>
        <Eye className='h-4 w-4' />
      </Button>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Suggested Product</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='sp-name'>Name</Label>
              <Input
                id='sp-name'
                className='mt-2'
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor='sp-ingredients'>Ingredients (comma separated)</Label>
              <Input
                id='sp-ingredients'
                className='mt-2'
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='sp-description'>Description</Label>
              <Textarea
                id='sp-description'
                className='mt-2'
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor='sp-status'>Status</Label>
              <div className='mt-2'>
                <Select
                  value={(formData.status as string) || 'pending'}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id='sp-status' className='w-full'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='reviewed'>Reviewed</SelectItem>
                    <SelectItem value='approved'>Approved</SelectItem>
                    <SelectItem value='rejected'>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{product.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>
              {fetched?.name || product.name}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <Label className='text-xs text-muted-foreground'>Status</Label>
              <div>{fetched?.status ?? product.status ?? '—'}</div>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Ingredients</Label>
              <div className='text-sm text-muted-foreground'>
                {(fetched?.ingredients ?? product.ingredients ?? []).join(', ') || '—'}
              </div>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Description</Label>
              <p className='mt-1 text-sm text-muted-foreground'>
                {fetched?.description ?? product.description ?? '—'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


