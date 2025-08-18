import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Trash, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { UserRow } from './columns'
import { useDeleteUser } from '@/hooks/use-users'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export function DataTableRowActions({ row }: { row: { original: UserRow } }) {
  const queryClient = useQueryClient()
  const user = row.original

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()

  const handleDelete = () => {
    const id = user._id
    if (!id) {
      toast.error('User ID is missing!')
      return
    }

    deleteUser(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        toast.success('User deleted successfully!')
        setDeleteConfirm(false)
      },
      onError: () => toast.error('Failed to delete user'),
    })
  }

  return (
    <div className='flex items-center justify-center gap-2'>
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
        <Eye className='h-4 w-4' />
      </Button>



      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{user.user_details?.name || user.email}</strong>?
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[680px]'>
          <DialogHeader>
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={user.user_details?.avatar || ''} alt={user.user_details?.name || user.email} />
                <AvatarFallback>
                  {(user.user_details?.name || user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <DialogTitle className='truncate'>{user.user_details?.name || user.email}</DialogTitle>
                <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
              </div>
            </div>
          </DialogHeader>

          <div className='mt-4 space-y-6 text-sm'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <span className='text-muted-foreground'>Role</span>
                <p className='mt-1 rounded-md border p-2'>{user.role || '—'}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>Status</span>
                <p className='mt-1 rounded-md border p-2'>
                  {user.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div>
              <span className='text-muted-foreground'>Phone</span>
              <p className='mt-1 rounded-md border p-2'>{user.phoneNumber || '—'}</p>
            </div>
            <Separator />
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <span className='text-muted-foreground'>Country</span>
                <p className='mt-1 rounded-md border p-2'>{user.user_details?.country || '—'}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>City</span>
                <p className='mt-1 rounded-md border p-2'>{user.user_details?.city || '—'}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>ZIP</span>
                <p className='mt-1 rounded-md border p-2'>{user.user_details?.zip || '—'}</p>
              </div>
            </div>
            <div>
              <span className='text-muted-foreground'>Address</span>
              <p className='mt-1 rounded-md border p-2 whitespace-pre-wrap'>
                {user.user_details?.address || '—'}
              </p>
            </div>
            {user.createdAt ? (
              <div>
                <span className='text-muted-foreground'>Created</span>
                <p className='mt-1 rounded-md border p-2'>
                  {new Date(user.createdAt).toLocaleString()}
                </p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
