import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { IconPlus } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { useCreateTestimonial } from '@/hooks/use-testimonials'

export function TestimonialsPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    body: '',
    img: '',
    location: '',
    visible: true,
  })

  const { mutate: createTestimonial, isPending } = useCreateTestimonial()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.body.trim()) {
      toast.error('Name and testimonial are required')
      return
    }

    createTestimonial(
      {
        name: formData.name.trim(),
        body: formData.body.trim(),
        img: formData.img.trim() || undefined,
        location: formData.location.trim() || undefined,
        visible: formData.visible,
      },
      {
        onSuccess: () => {
          toast.success('Testimonial created successfully!')
          queryClient.invalidateQueries({ queryKey: ['testimonials'] })
          setFormData({ name: '', body: '', img: '', location: '', visible: true })
          setOpenSheet(false)
        },
        onError: (error: Error) => {
          toast.error(error?.message || 'Failed to create testimonial')
        },
      }
    )
  }

  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpenSheet(true)}>
        <span>Create Testimonial</span> <IconPlus size={18} />
      </Button>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className='p-0 sm:max-w-lg'>
          <div className='max-h-[calc(100vh-100px)] overflow-y-auto p-6'>
            <SheetHeader>
              <SheetTitle className='text-xl font-semibold'>
                Create New Testimonial
              </SheetTitle>
              <p className='text-muted-foreground text-sm'>
                Fill the details below to add a customer testimonial.
              </p>
            </SheetHeader>

            <div className='mt-6 space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='t-name'>Name *</Label>
                <Input
                  id='t-name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='t-location'>Location</Label>
                <Input
                  id='t-location'
                  name='location'
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='t-img'>Image URL</Label>
                <Input
                  id='t-img'
                  name='img'
                  placeholder='https://...'
                  value={formData.img}
                  onChange={handleChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='t-body'>Testimonial *</Label>
                <Textarea
                  id='t-body'
                  name='body'
                  value={formData.body}
                  onChange={handleChange}
                  rows={6}
                />
              </div>

              <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
                <div>
                  <Label htmlFor='t-visible' className='text-sm font-medium'>
                    Visible
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    Show this testimonial publicly.
                  </p>
                </div>
                <Switch
                  id='t-visible'
                  checked={formData.visible}
                  onCheckedChange={(val) =>
                    setFormData((prev) => ({ ...prev, visible: val }))
                  }
                />
              </div>
            </div>

            <SheetFooter className='mt-6 flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setOpenSheet(false)}
                className='w-full'
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending} className='w-full'>
                {isPending ? 'Saving...' : 'Save Testimonial'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}


