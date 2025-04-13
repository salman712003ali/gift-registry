'use client'

import { useState } from 'react'

interface GiftItem {
  name: string
  description: string
  price: number
  quantity: number
  url?: string
}

interface GiftItemFormProps {
  onAddItem: (item: GiftItem) => void
}

export default function GiftItemForm({ onAddItem }: GiftItemFormProps) {
  const [giftItem, setGiftItem] = useState<GiftItem>({
    name: '',
    description: '',
    price: 0,
    quantity: 1,
    url: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddItem(giftItem)
    // Reset form
    setGiftItem({
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      url: ''
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Add a Gift Item</h2>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Item Name
        </label>
        <input
          type="text"
          id="name"
          value={giftItem.name}
          onChange={(e) => setGiftItem({...giftItem, name: e.target.value})}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={giftItem.description}
          onChange={(e) => setGiftItem({...giftItem, description: e.target.value})}
          className="w-full p-2 border rounded-lg"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price (₹)
          </label>
          <input
            type="number"
            id="price"
            value={giftItem.price}
            onChange={(e) => setGiftItem({...giftItem, price: Number(e.target.value)})}
            className="w-full p-2 border rounded-lg"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={giftItem.quantity}
            onChange={(e) => setGiftItem({...giftItem, quantity: Number(e.target.value)})}
            className="w-full p-2 border rounded-lg"
            min="1"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          Product URL (Optional)
        </label>
        <input
          type="url"
          id="url"
          value={giftItem.url}
          onChange={(e) => setGiftItem({...giftItem, url: e.target.value})}
          className="w-full p-2 border rounded-lg"
          placeholder="https://example.com/product"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
      >
        Add Gift Item
      </button>
    </form>
  )
} 