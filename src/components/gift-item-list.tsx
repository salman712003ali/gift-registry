'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GiftItemDialog } from './gift-item-dialog'
import { toast } from 'sonner'

interface GiftItem {
  id: string
  name: string
  price: number
  quantity: number
  description: string
  url: string
  registry_id: string
  created_at: string
  is_purchased: boolean
}

interface GiftItemListProps {
  items: GiftItem[]
  registryId: string
  isOwner?: boolean
  onItemUpdated?: () => void
}

export function GiftItemList({ items, registryId, isOwner = false, onItemUpdated }: GiftItemListProps) {
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEdit = (item: GiftItem) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/gift-items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      toast.success('Item deleted successfully')
      onItemUpdated?.()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  const handleMarkAsPurchased = async (itemId: string, isPurchased: boolean) => {
    try {
      const response = await fetch(`/api/gift-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_purchased: isPurchased }),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      toast.success(`Item marked as ${isPurchased ? 'purchased' : 'not purchased'}`)
      onItemUpdated?.()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No gift items added yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                  </span>
                  {isOwner && (
                    <Button
                      variant={item.is_purchased ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMarkAsPurchased(item.id, !item.is_purchased)}
                    >
                      {item.is_purchased ? 'Purchased' : 'Mark as Purchased'}
                    </Button>
                  )}
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline block"
                  >
                    View Product
                  </a>
                )}

                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <GiftItemDialog
        registryId={registryId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={selectedItem}
        onItemAdded={onItemUpdated}
      />
    </>
  )
} 