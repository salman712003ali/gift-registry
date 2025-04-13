'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface GiftItemFormProps {
  registryId: string
  onItemAdded?: () => void
}

export function GiftItemForm({ registryId, onItemAdded }: GiftItemFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '1',
    description: '',
    url: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('You must be logged in to add gift items')
        return
      }

      // Validate price
      const price = parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        toast.error('Please enter a valid price')
        return
      }

      // Validate quantity
      const quantity = parseInt(formData.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity')
        return
      }

      // Create the gift item
      const { error } = await supabase
        .from('gift_items')
        .insert({
          name: formData.name,
          price: price,
          quantity: quantity,
          description: formData.description,
          url: formData.url || null,
          registry_id: registryId,
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Gift item added successfully')
      
      // Reset form
      setFormData({
        name: '',
        price: '',
        quantity: '1',
        description: '',
        url: ''
      })

      // Call the onItemAdded callback if provided
      if (onItemAdded) {
        onItemAdded()
      }
    } catch (error: any) {
      console.error('Error adding gift item:', error)
      toast.error(error.message || 'Failed to add gift item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Add Gift Item</CardTitle>
          <CardDescription>
            Add a new item to your gift registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., KitchenAid Stand Mixer"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
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
                onChange={handleChange}
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
              onChange={handleChange}
              placeholder="Describe the item (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com/product"
            />
            <p className="text-xs text-muted-foreground">
              Add a link to the product on Amazon, Flipkart, or other e-commerce sites
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Gift Item'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 