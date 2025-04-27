import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface AddItemFormProps {
  registryId: string
  onItemAdded: () => void
}

export function AddItemForm({ registryId, onItemAdded }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !price) {
      toast.error('Name and price are required')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('gift_items')
        .insert({
          registry_id: registryId,
          name,
          price: parseFloat(price),
          description,
          image_url: imageUrl,
          product_url: url
        })

      if (error) throw error

      toast.success('Item added successfully')
      onItemAdded()
      
      // Reset form
      setName('')
      setPrice('')
      setDescription('')
      setImageUrl('')
      setUrl('')
    } catch (error) {
      toast.error('Failed to add item')
      console.error('Add item error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Item Name *
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter item name"
          required
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-1">
          Price *
        </label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter item description"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
          Image URL
        </label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Enter image URL"
        />
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          Product URL
        </label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter product URL"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Adding...' : 'Add Item'}
      </Button>
    </form>
  )
} 