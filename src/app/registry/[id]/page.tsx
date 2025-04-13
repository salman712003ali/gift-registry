'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { GiftItemDialog } from '@/components/gift-item-dialog'
import { ContributionForm } from '@/components/contribution-form'
import { ContributionsList } from '@/components/contributions-list'
import { formatCurrency } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Heart, Share2, MessageSquare, ShoppingCart } from 'lucide-react'

interface GiftItem {
  id: string
  name: string
  price: number
  quantity: number
  description: string
  url: string | null
  registry_id: string
  created_at: string
  updated_at: string
  user_id: string | null
  is_favorite?: boolean
  comments?: Comment[]
  contributions?: {
    amount: number
    contributor_name: string
    message: string
    created_at: string
  }[]
}

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  profile?: {
    full_name: string
    avatar_url: string | null
  }
}

interface Registry {
  id: string
  title: string
  description: string
  occasion: string
  event_date: string
  is_private: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export default function RegistryView() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [giftItems, setGiftItems] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('items')
  const [sortBy, setSortBy] = useState('newest')
  const [filterBy, setFilterBy] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchRegistry()
  }, [params.id])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
    }
  }

  const fetchRegistry = async () => {
    try {
      // Fetch registry data
      const { data: registryData, error: registryError } = await supabase
        .from('registries')
        .select('*')
        .eq('id', params.id)
        .single()

      if (registryError) throw registryError
      setRegistry(registryData)

      // Get current user ID for favorites check
      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      // Fetch gift items with their contributions and comments
      const { data: itemsData, error: itemsError } = await supabase
        .from('gift_items')
        .select(`
          *,
          contributions (
            amount,
            contributor_name,
            message,
            created_at
          ),
          comments!gift_item_id (
            id,
            content,
            user_id,
            created_at
          )
        `)
        .eq('registry_id', params.id)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError

      // Fetch favorites separately
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('gift_item_id')
        .eq('user_id', currentUserId)

      // Create a set of favorite item IDs
      const favoriteItemIds = new Set(favoritesData?.map(f => f.gift_item_id) || [])
      
      // Process items to add is_favorite flag
      const processedItems = itemsData.map(item => ({
        ...item,
        is_favorite: favoriteItemIds.has(item.id)
      }))
      
      // Fetch user profiles for comments
      const userIds = new Set<string>()
      processedItems.forEach(item => {
        if (item.comments) {
          item.comments.forEach((comment: { user_id: string }) => {
            userIds.add(comment.user_id)
          })
        }
      })
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(userIds))
      
      // Create a map of user IDs to profiles
      const profilesMap = new Map()
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
      
      // Add profile information to comments
      const itemsWithProfiles = processedItems.map(item => {
        if (item.comments) {
          return {
            ...item,
            comments: item.comments.map((comment: { user_id: string }) => ({
              ...comment,
              profile: profilesMap.get(comment.user_id) || { full_name: 'Anonymous', avatar_url: null }
            }))
          }
        }
        return item
      })
      
      setGiftItems(itemsWithProfiles)

      // Generate QR code
      const registryUrl = `${window.location.origin}/registry/${params.id}`
      const qrCodeDataUrl = await QRCode.toDataURL(registryUrl)
      setQrCodeUrl(qrCodeDataUrl)
    } catch (error: any) {
      console.error('Error fetching registry:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleItemAdded = () => {
    fetchRegistry()
    setIsGiftDialogOpen(false)
  }

  const handleContributionAdded = () => {
    fetchRegistry()
    setSelectedItem(null)
  }

  const calculateProgress = (item: GiftItem) => {
    const totalContributions = item.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0
    const targetAmount = item.price * item.quantity
    return Math.min((totalContributions / targetAmount) * 100, 100)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/registry/${params.id}`
    try {
      await navigator.share({
        title: registry?.title || 'Gift Registry',
        text: registry?.description || 'Check out my gift registry!',
        url
      })
    } catch (error) {
      // If Web Share API is not supported, copy to clipboard
      await navigator.clipboard.writeText(url)
      toast.success('Registry link copied to clipboard!')
    }
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    const sortedItems = [...giftItems]
    switch (value) {
      case 'newest':
        sortedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        sortedItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'price-high':
        sortedItems.sort((a, b) => b.price - a.price)
        break
      case 'price-low':
        sortedItems.sort((a, b) => a.price - b.price)
        break
      case 'progress':
        sortedItems.sort((a, b) => calculateProgress(b) - calculateProgress(a))
        break
    }
    setGiftItems(sortedItems)
  }

  const handleFilterChange = (value: string) => {
    setFilterBy(value)
  }

  const toggleFavorite = async (itemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to favorite items')
        return
      }

      const item = giftItems.find(i => i.id === itemId)
      if (!item) return

      if (item.is_favorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('gift_item_id', itemId)

        if (error) throw error
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            gift_item_id: itemId
          })

        if (error) throw error
      }

      // Update local state
      setGiftItems(items =>
        items.map(i =>
          i.id === itemId ? { ...i, is_favorite: !i.is_favorite } : i
        )
      )

      toast.success(item.is_favorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorite status')
    }
  }

  const handlePurchase = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('gift_items')
        .update({ is_purchased: true })
        .eq('id', itemId)

      if (error) throw error
      toast.success('Item marked as purchased')
      fetchRegistry()
    } catch (error: any) {
      console.error('Error marking item as purchased:', error)
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (error || !registry) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error || 'Registry not found'}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{registry.title}</h1>
          <p className="text-muted-foreground">{registry.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Registry
          </Button>
          {isAuthenticated && (
            <Button onClick={() => setIsGiftDialogOpen(true)}>
              Add Gift Item
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <p>Occasion: {registry.occasion}</p>
          <p>Date: {new Date(registry.event_date).toLocaleDateString()}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Gift Items</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Gift Items</h2>
            <div className="flex gap-4">
              <Select value={filterBy} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {giftItems.map((item) => {
              const progress = calculateProgress(item)
              const totalContributions = item.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0
              const remainingAmount = (item.price * item.quantity) - totalContributions

              return (
                <Card key={item.id} className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(item.id)}
                          className={item.is_favorite ? 'text-red-500' : ''}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        {isAuthenticated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePurchase(item.id)}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(item.price)}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{progress.toFixed(1)}% Funded</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(totalContributions)} of {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      <Progress value={progress} className="h-2" />

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline block"
                        >
                          View Product
                        </a>
                      )}

                      {remainingAmount > 0 ? (
                        <Button
                          className="w-full"
                          onClick={() => setSelectedItem(item)}
                        >
                          Contribute
                        </Button>
                      ) : (
                        <Badge className="w-full text-center">Fully Funded</Badge>
                      )}

                      {item.comments && item.comments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Comments</h4>
                          <div className="space-y-2">
                            {item.comments.map((comment) => (
                              <div key={comment.id} className="text-sm">
                                <p className="font-medium">{comment.profile?.full_name || 'Anonymous'}</p>
                                <p className="text-muted-foreground">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="contributions">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Recent Contributions</h2>
              <ContributionsList registryId={params.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="share">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Share Registry</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-2 rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <Button variant="outline" onClick={handleShare}>
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <GiftItemDialog
        registryId={params.id}
        open={isGiftDialogOpen}
        onOpenChange={setIsGiftDialogOpen}
        onItemAdded={handleItemAdded}
      />

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Contribute to {selectedItem.name}</CardTitle>
              <CardDescription>
                Price: {formatCurrency(selectedItem.price)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionForm
                giftItemId={selectedItem.id}
                registryId={params.id}
                onContributionAdded={handleContributionAdded}
                onCancel={() => setSelectedItem(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 