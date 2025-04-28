'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Edit, 
  Trash, 
  MoreHorizontal, 
  Heart, 
  Package, 
  Gift, 
  Search, 
  ShoppingCart,
  ShieldAlert,
  Check,
  X,
  Loader2,
  Link as LinkIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface GiftItem {
  id: string
  name: string
  price: number
  quantity: number
  description: string | null
  url: string | null
  image_url: string | null
  is_purchased: boolean
  is_reserved: boolean
  registry_id: string
  created_at: string
  registry: {
    title: string
    id: string
  }
}

interface Registry {
  id: string
  title: string
}

export default function ManageItemsPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<GiftItem[]>([])
  const [filteredItems, setFilteredItems] = useState<GiftItem[]>([])
  const [registries, setRegistries] = useState<Registry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [registryFilter, setRegistryFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [purchasedFilter, setPurchasedFilter] = useState('all')
  const [itemToEdit, setItemToEdit] = useState<GiftItem | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    quantity: '',
    description: '',
    url: ''
  })

  useEffect(() => {
    fetchItems()
    fetchRegistries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [items, searchTerm, registryFilter, sortBy, purchasedFilter])

  const fetchItems = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }
      
      // Fetch gift items across all user's registries
      const { data, error } = await supabase
        .from('gift_items')
        .select(`
          *,
          registry:registries(id, title)
        `)
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      // Cast the data to GiftItem[] to handle the registry join
      setItems((data as unknown as GiftItem[]) || [])
    } catch (error: any) {
      console.error('Error fetching gift items:', error)
      toast.error(error.message || 'Failed to load gift items')
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { data, error } = await supabase
        .from('registries')
        .select('id, title')
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      setRegistries((data as unknown as Registry[]) || [])
    } catch (error: any) {
      console.error('Error fetching registries:', error)
    }
  }

  const applyFilters = () => {
    let result = [...items]
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase()
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowercaseSearch) || 
        (item.description && item.description.toLowerCase().includes(lowercaseSearch))
      )
    }
    
    // Apply registry filter
    if (registryFilter) {
      result = result.filter(item => item.registry_id === registryFilter)
    }
    
    // Apply purchased filter
    if (purchasedFilter === 'purchased') {
      result = result.filter(item => item.is_purchased)
    } else if (purchasedFilter === 'not_purchased') {
      result = result.filter(item => !item.is_purchased)
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'price_high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'price_low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
    }
    
    setFilteredItems(result)
  }
  
  const handleEditItem = (item: GiftItem) => {
    setItemToEdit(item)
    setEditForm({
      name: item.name,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      description: item.description || '',
      url: item.url || ''
    })
    setIsEditing(true)
  }
  
  const handleSaveEdit = async () => {
    if (!itemToEdit) return
    
    try {
      setLoading(true)
      
      // Validate inputs
      const price = parseFloat(editForm.price)
      const quantity = parseInt(editForm.quantity)
      
      if (isNaN(price) || price <= 0) {
        toast.error('Please enter a valid price')
        return
      }
      
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity')
        return
      }
      
      // Update item in database
      const { error } = await supabase
        .from('gift_items')
        .update({
          name: editForm.name,
          price: price,
          quantity: quantity,
          description: editForm.description || null,
          url: editForm.url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemToEdit.id)
      
      if (error) throw error
      
      // Update local state
      const updatedItems = items.map(item => {
        if (item.id === itemToEdit.id) {
          return {
            ...item,
            name: editForm.name,
            price: price,
            quantity: quantity,
            description: editForm.description || null,
            url: editForm.url || null
          }
        }
        return item
      })
      
      setItems(updatedItems)
      setIsEditing(false)
      toast.success('Gift item updated successfully')
    } catch (error: any) {
      console.error('Error updating gift item:', error)
      toast.error(error.message || 'Failed to update gift item')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsDeleting(itemId)
      
      const { error } = await supabase
        .from('gift_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
      
      // Update local state
      setItems(items.filter(item => item.id !== itemId))
      toast.success('Gift item deleted successfully')
    } catch (error: any) {
      console.error('Error deleting gift item:', error)
      toast.error(error.message || 'Failed to delete gift item')
    } finally {
      setIsDeleting(null)
    }
  }
  
  const handleTogglePurchased = async (item: GiftItem) => {
    try {
      const { error } = await supabase
        .from('gift_items')
        .update({ is_purchased: !item.is_purchased })
        .eq('id', item.id)
      
      if (error) throw error
      
      // Update local state
      const updatedItems = items.map(i => {
        if (i.id === item.id) {
          return { ...i, is_purchased: !item.is_purchased }
        }
        return i
      })
      
      setItems(updatedItems)
      toast.success(item.is_purchased 
        ? `${item.name} marked as not purchased` 
        : `${item.name} marked as purchased`)
    } catch (error: any) {
      console.error('Error updating purchase status:', error)
      toast.error('Failed to update purchase status')
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading gift items...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Gift Items</h1>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="registry-filter" className="mb-2">Registry</Label>
              <Select value={registryFilter} onValueChange={setRegistryFilter}>
                <SelectTrigger id="registry-filter">
                  <SelectValue placeholder="All Registries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Registries</SelectItem>
                  {registries.map(registry => (
                    <SelectItem key={registry.id} value={registry.id}>
                      {registry.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="sort-by" className="mb-2">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="name_asc">Name: A to Z</SelectItem>
                  <SelectItem value="name_desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="purchased-filter" className="mb-2">Status</Label>
              <Select value={purchasedFilter} onValueChange={setPurchasedFilter}>
                <SelectTrigger id="purchased-filter">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="not_purchased">Not Purchased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Gift Items Found</h2>
            <p className="text-muted-foreground mb-4">
              {items.length === 0 
                ? "You haven't added any gift items to your registries yet." 
                : "No items match your current filters."}
            </p>
            {items.length === 0 && (
              <Button onClick={() => router.push('/create-registry')}>
                <Gift className="h-4 w-4 mr-2" />
                Create a Registry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gift Items ({filteredItems.length})</CardTitle>
            <CardDescription>
              Manage your gift items across all registries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Registry</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                            {item.description}
                          </div>
                        )}
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            View Product
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/registry/${item.registry_id}`}
                        className="text-primary hover:underline"
                      >
                        {item.registry.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.is_purchased ? "secondary" : "outline"}>
                        {item.is_purchased ? (
                          <span className="flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Purchased
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTogglePurchased(item)}
                        >
                          {item.is_purchased ? 'Unpurchase' : 'Mark Purchased'}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditItem(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600"
                            >
                              {isDeleting === item.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Gift Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Enter item name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Item description (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-url">Product URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={editForm.url}
                onChange={(e) => setEditForm({...editForm, url: e.target.value})}
                placeholder="https://example.com/product"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 