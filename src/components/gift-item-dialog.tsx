'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface GiftItemDialogProps {
  registryId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded?: () => void
}

export function GiftItemDialog({
  registryId,
  open,
  onOpenChange,
  onItemAdded
}: GiftItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '1',
    description: '',
    productUrl: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Validate price
      const price = parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price')
      }

      // Validate quantity
      const quantity = parseInt(formData.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid quantity')
      }

      const { error: insertError } = await supabase
        .from('gift_items')
        .insert({
          registry_id: registryId,
          name: formData.name,
          price: price,
          quantity: quantity,
          description: formData.description,
          url: formData.productUrl || null
        })

      if (insertError) throw insertError

      // Reset form
      setFormData({
        name: '',
        price: '',
        quantity: '1',
        description: '',
        productUrl: ''
      })

      onItemAdded?.()
      toast.success('Gift item added successfully!')
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to create gift item')
      toast.error(err.message || 'Failed to add gift item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Gift Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter item description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productUrl">Product URL (optional)</Label>
            <Input
              id="productUrl"
              name="productUrl"
              type="url"
              value={formData.productUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/product"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 