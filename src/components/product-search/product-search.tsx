import { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { LoadingSpinner } from '../ui/loading-spinner'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { Product } from '@/types/product'

interface ProductSearchProps {
  onProductSelect: (product: Product) => void
  registryId: string
}

export function ProductSearch({ onProductSelect, registryId }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const supabase = createClient()

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term')
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .functions.invoke('search-products', {
          body: { query: searchQuery }
        })

      if (error) throw error

      setProducts(data)
      if (data.length === 0) {
        toast.info('No products found')
      }
    } catch (error) {
      toast.error('Failed to search products')
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImport = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('gift_items')
        .insert({
          registry_id: registryId,
          name: product.title,
          price: product.price,
          description: product.description,
          image_url: product.image_url,
          retailer: product.retailer,
          product_url: product.url
        })

      if (error) throw error

      onProductSelect(product)
      toast.success('Product added to registry')
    } catch (error) {
      toast.error('Failed to add product')
      console.error('Import error:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
        />
        <Button onClick={searchProducts} disabled={isSearching}>
          {isSearching ? <LoadingSpinner /> : 'Search'}
        </Button>
      </div>

      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 space-y-2"
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold">${product.price}</span>
                <Button onClick={() => handleImport(product)} size="sm">
                  Add to Registry
                </Button>
              </div>
              <p className="text-xs text-gray-500">From {product.retailer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 