// import { IconDownload } from '@tabler/icons-react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { useCreateProductCategory } from '@/hooks/use-categories' // ✅ Import mutation hook
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function TasksPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false)
  const queryClient = useQueryClient()

  const [categoryData, setCategoryData] = useState({
    category: '',
    name: '',
    description: '',
    pricingEnabled: false,
  })

  const [errors, setErrors] = useState<{ category?: string; name?: string; description?: string }>({})


  const { mutate: createCategory, isPending } = useCreateProductCategory()

  const validate = () => {
    const nextErrors: { category?: string; name?: string; description?: string } = {}

    const category = categoryData.category.trim()
    const name = categoryData.name.trim()
    const description = categoryData.description.trim()

    if (!category) {
      nextErrors.category = 'Category is required'
    } else {
      if (category.length < 2) nextErrors.category = 'Category must be at least 2 characters'
      else if (category.length > 32) nextErrors.category = 'Category must be at most 32 characters'
      else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category))
        nextErrors.category = 'Use lowercase letters, numbers, and hyphens only'
    }

    if (!name) {
      nextErrors.name = 'Name is required'
    } else {
      if (name.length < 3) nextErrors.name = 'Name must be at least 3 characters'
      else if (name.length > 64) nextErrors.name = 'Name must be at most 64 characters'
    }

    if (!description) {
      nextErrors.description = 'Description is required'
    } else {
      if (description.length < 10) nextErrors.description = 'Description must be at least 10 characters'
      else if (description.length > 200) nextErrors.description = 'Description must be at most 200 characters'
    }

    return nextErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCategoryData({ ...categoryData, [name]: value })
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: undefined })
    }
  }

  const handleSubmit = () => {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast.error('Please fill all details before saving.')
      return
    }

    createCategory(
      {
        ...categoryData,
        category: categoryData.category.trim(),
        name: categoryData.name.trim(),
        description: categoryData.description.trim(),
      },
      {
      onSuccess: () => {
        toast.success('Category created successfully!')
        queryClient.invalidateQueries({ queryKey: ['product-categories'] })
        setCategoryData({ category: '', name: '', description: '', pricingEnabled: false })
        setErrors({})
        setOpenSheet(false)
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to create category')
      },
    }
    )
  }

  return (
    <div className="flex gap-2">
      {/* Import Button */}
      {/* <Button variant="outline" className="space-x-1">
        <span>Import</span> <IconDownload size={18} />
      </Button> */}

      {/* Create Category Button */}
      <Button className="space-x-1" onClick={() => setOpenSheet(true)}>
        <span>Create Category</span> <IconPlus size={18} />
      </Button>

      {/* Sheet for Creating Category */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold">Create New Category</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Fill out the details below to add a new product category.
            </p>
          </SheetHeader>

          <div className="space-y-5 mt-6 mx-2">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category"
                name="category"
                value={categoryData.category}
                onChange={handleChange}
                placeholder="e.g. electronics"
                required
                maxLength={32}
                aria-invalid={!!errors.category}
              />
              {errors.category ? (
                <p className="text-xs text-red-500">{errors.category}</p>
              ) : null}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={categoryData.name}
                onChange={handleChange}
                placeholder="e.g. Electronics & Gadgets"
                required
                maxLength={64}
                aria-invalid={!!errors.name}
              />
              {errors.name ? (
                <p className="text-xs text-red-500">{errors.name}</p>
              ) : null}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-red-500">*</span></Label>
              <Input
                id="description"
                name="description"
                value={categoryData.description}
                onChange={handleChange}
                placeholder="Short description about this category"
                required
                minLength={10}
                maxLength={200}
                aria-invalid={!!errors.description}
              />
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description}</p>
              ) : null}
            </div>

            {/* Pricing Enabled Switch */}
            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <Label htmlFor="pricingEnabled" className="text-sm font-medium">Pricing Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Enable pricing options for products in this category.
                </p>
              </div>
              <Switch
                id="pricingEnabled"
                checked={categoryData.pricingEnabled}
                onCheckedChange={(val) =>
                  setCategoryData({ ...categoryData, pricingEnabled: val })
                }
              />
            </div>
          </div>

          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setOpenSheet(false)} className="w-full">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
