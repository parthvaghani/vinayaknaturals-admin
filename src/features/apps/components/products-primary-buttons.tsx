import { IconDownload, IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { useCreateProduct } from '@/hooks/use-products'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function ProductsPrimaryButtons() {
  const [openSheet, setOpenSheet] = useState(false)
  const queryClient = useQueryClient()

  const [productData, setProductData] = useState({
    category: '',
    name: '',
    description: '',
    images: [] as string[],
    ingredients: [] as string[],
    benefits: [] as string[],
    isPremium: false,
    isPopular: false,
    variants: {
      gm: [] as { weight: string; price: number; discount: number }[],
      kg: [] as { weight: string; price: number; discount: number }[],
    },
  })

  // Temporary local states for adding
  const [imageInput, setImageInput] = useState('')
  const [ingredientInput, setIngredientInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')
  const [variantType, setVariantType] = useState<'gm' | 'kg'>('gm')
  const [variantWeight, setVariantWeight] = useState('')
  const [variantPrice, setVariantPrice] = useState('')
  const [variantDiscount, setVariantDiscount] = useState('')

  const { mutate: createProduct, isPending } = useCreateProduct()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductData({ ...productData, [e.target.name]: e.target.value })
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setProductData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }))
      setImageInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      setProductData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()],
      }))
      setIngredientInput('')
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setProductData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()],
      }))
      setBenefitInput('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }))
  }

  const handleAddVariant = () => {
    if (variantWeight && variantPrice) {
      setProductData((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          [variantType]: [
            ...prev.variants[variantType],
            { weight: variantWeight, price: parseFloat(variantPrice), discount: parseFloat(variantDiscount) || 0 },
          ],
        },
      }))
      setVariantWeight('')
      setVariantPrice('')
      setVariantDiscount('')
    }
  }

  const handleRemoveVariant = (type: 'gm' | 'kg', index: number) => {
    setProductData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [type]: prev.variants[type].filter((_, i) => i !== index),
      }
    }))
  }

  const handleSubmit = () => {
    createProduct(productData, {
      onSuccess: () => {
        toast.success('Product created successfully!')
        queryClient.invalidateQueries({ queryKey: ['products'] })
        setProductData({
          category: '',
          name: '',
          description: '',
          images: [],
          ingredients: [],
          benefits: [],
          isPremium: false,
          isPopular: false,
          variants: { gm: [], kg: [] },
        })
        setOpenSheet(false)
      },
      onError: (error: Error) => {
        toast.error(error?.message || 'Failed to create product')
      },
    })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1">
        <span>Import</span> <IconDownload size={18} />
      </Button>

      <Button className="space-x-1" onClick={() => setOpenSheet(true)}>
        <span>Create Product</span> <IconPlus size={18} />
      </Button>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-lg p-0">
          <div className="max-h-[calc(100vh-100px)] overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle className="text-xl font-semibold">Create New Product</SheetTitle>
              <p className="text-sm text-muted-foreground">Fill out the details below to add a new product.</p>
            </SheetHeader>

            <div className="space-y-5 mt-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" name="category" value={productData.category} onChange={handleChange} />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" value={productData.name} onChange={handleChange} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" value={productData.description} onChange={handleChange} />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex gap-2">
                  <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="Paste image URL" />
                  <Button type="button" onClick={handleAddImage}>Add</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {productData.images.map((img, i) => (
                    <div key={i} className="relative border rounded overflow-hidden">
                      <img src={img} alt={`Image ${i + 1}`} className="w-full h-24 object-cover" />
                      <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 text-xs" onClick={() => handleRemoveImage(i)}>✕</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <div className="flex gap-2">
                  <Input value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} placeholder="Add ingredient" />
                  <Button type="button" onClick={handleAddIngredient}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {productData.ingredients.map((ing, i) => (
                    <span key={i} className="bg-gray-100 text-sm px-2 py-1 rounded flex items-center gap-1">
                      {ing}
                      <button onClick={() => handleRemoveIngredient(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <Label>Benefits</Label>
                <div className="flex gap-2">
                  <Input value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} placeholder="Add benefit" />
                  <Button type="button" onClick={handleAddBenefit}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {productData.benefits.map((ben, i) => (
                    <span key={i} className="bg-gray-100 text-sm px-2 py-1 rounded flex items-center gap-1">
                      {ben}
                      <button onClick={() => handleRemoveBenefit(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-2">
                <Label>Variants</Label>
                <div className="flex gap-2">
                  <select value={variantType} onChange={(e) => setVariantType(e.target.value as 'gm' | 'kg')} className="border rounded px-2">
                    <option value="gm">Gram</option>
                    <option value="kg">Kilogram</option>
                  </select>
                  <Input placeholder="Weight" value={variantWeight} onChange={(e) => setVariantWeight(e.target.value)} />
                  <Input placeholder="Price" type="number" value={variantPrice} onChange={(e) => setVariantPrice(e.target.value)} />
                  <Input placeholder="Discount" type="number" value={variantDiscount} onChange={(e) => setVariantDiscount(e.target.value)} />
                  <Button onClick={handleAddVariant}>Add</Button>
                </div>
                <div className="mt-2">
                  {(['gm', 'kg'] as const).map((type) => (
                    <div key={type} className="mt-2">
                      <p className="font-medium capitalize">{type} Variants:</p>
                      {productData.variants[type].map((v, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded mt-1">
                          <span>{v.weight} - ₹{v.price} (Discount: {v.discount}%)</span>
                          <button onClick={() => handleRemoveVariant(type, i)} className="text-red-500 text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Switches */}
              <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <Label htmlFor="isPremium" className="text-sm font-medium">Premium Product</Label>
                  <p className="text-xs text-muted-foreground">Mark this product as premium.</p>
                </div>
                <Switch id="isPremium" checked={productData.isPremium} onCheckedChange={(val) => setProductData({ ...productData, isPremium: val })} />
              </div>

              <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <Label htmlFor="isPopular" className="text-sm font-medium">Popular Product</Label>
                  <p className="text-xs text-muted-foreground">Mark this product as popular.</p>
                </div>
                <Switch id="isPopular" checked={productData.isPopular} onCheckedChange={(val) => setProductData({ ...productData, isPopular: val })} />
              </div>
            </div>

            <SheetFooter className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setOpenSheet(false)} className="w-full">Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save Product'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
