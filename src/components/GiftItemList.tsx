'use client'

import { useState } from 'react'

interface GiftItem {
  name: string
  description: string
  price: number
  quantity: number
  url?: string
}

interface GiftItemListProps {
  items: GiftItem[]
  onUpdateItem: (index: number, item: GiftItem) => void
  onRemoveItem: (index: number) => void
}

export default function GiftItemList({ items, onUpdateItem, onRemoveItem }: GiftItemListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedItem, setEditedItem] = useState<GiftItem | null>(null)

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditedItem(items[index])
  }

  const handleSave = (index: number) => {
    if (editedItem) {
      onUpdateItem(index, editedItem)
      setEditingIndex(null)
      setEditedItem(null)
    }
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditedItem(null)
  }

  // Calculate total price
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No items added yet. Add your first gift item above!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Added Items</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Items: {items.length}</p>
          <p className="font-medium text-lg">Total Value: ₹{totalPrice.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg">
            {editingIndex === index ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name</label>
                  <input
                    type="text"
                    value={editedItem?.name}
                    onChange={(e) => setEditedItem({...editedItem!, name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editedItem?.description}
                    onChange={(e) => setEditedItem({...editedItem!, description: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={editedItem?.price}
                      onChange={(e) => setEditedItem({...editedItem!, price: Number(e.target.value)})}
                      className="w-full p-2 border rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      value={editedItem?.quantity}
                      onChange={(e) => setEditedItem({...editedItem!, quantity: Number(e.target.value)})}
                      className="w-full p-2 border rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Product URL</label>
                  <input
                    type="url"
                    value={editedItem?.url}
                    onChange={(e) => setEditedItem({...editedItem!, url: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://example.com/product"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(index)}
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Product
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{item.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  <p className="text-sm text-gray-600">Total: ₹{(item.price * item.quantity).toFixed(2)}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 