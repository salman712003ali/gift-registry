'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
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
import { Heart, Share2, MessageSquare, ShoppingCart, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductSearch } from '@/components/product-search/product-search'
import { AddItemForm } from '@/components/add-item-form'

interface Profile {
  first_name: string;
  last_name: string;
}

interface Contribution {
  id: string;
  amount: number;
  message: string | null;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  gift_item_id: string;
  profiles: Profile | null;
}

interface GiftItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string | null;
  url: string | null;
  registry_id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  is_purchased: boolean;
  is_favorite?: boolean;
  contributions: Contribution[];
  comments: Comment[];
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

interface SupabaseRegistry {
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

interface SupabaseGiftItem {
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
  is_purchased: boolean
  contributions: {
    amount: number
    contributor_name: string
    message: string
    created_at: string
  }[]
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
  const [contributionsRefreshKey, setContributionsRefreshKey] = useState(0)
  const [showSharePopup, setShowSharePopup] = useState(false)
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
      if (!registryData) throw new Error('Registry not found')
      setRegistry(registryData as unknown as Registry)

      // Get current user ID for favorites check
      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      // Fetch gift items with their contributions
      const { data: itemsData, error: itemsError } = await supabase
        .from('gift_items')
        .select(`
          id,
          name,
          price,
          quantity,
          description,
          url,
          registry_id,
          created_at,
          updated_at,
          user_id,
          is_purchased,
          contributions (
            id,
            amount,
            message,
            created_at,
            user_id,
            contributor_name,
            profiles (
              id,
              first_name,
              last_name,
              full_name,
              email
            )
          )
        `)
        .eq('registry_id', params.id)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      if (!itemsData) throw new Error('No items found')

      // Process the items to include contributor names
      const processedItems = (itemsData as any[]).map(item => ({
        ...item,
        contributions: (item.contributions || []).map((contribution: any) => ({
          ...contribution,
          contributor_name: contribution.contributor_name || 
            (contribution.profiles ? (
              contribution.profiles.full_name ||
              `${contribution.profiles.first_name || ''} ${contribution.profiles.last_name || ''}`.trim() ||
              contribution.profiles.email ||
              'Anonymous'
            ) : 'Anonymous')
        }))
      })) as GiftItem[]

      // Fetch comments separately
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          gift_item_id
        `)
        .in('gift_item_id', processedItems.map(item => item.id))
        .order('created_at', { ascending: false })

      // Group comments by gift item ID
      const commentsByItemId = new Map<string, Comment[]>()
      if (commentsData) {
        (commentsData as any[]).forEach((comment: any) => {
          const comments = commentsByItemId.get(comment.gift_item_id) || []
          comments.push({
            id: comment.id,
            content: comment.content,
            user_id: comment.user_id,
            created_at: comment.created_at,
            gift_item_id: comment.gift_item_id,
            profiles: comment.profiles
          })
          commentsByItemId.set(comment.gift_item_id, comments)
        })
      }

      // Fetch favorites separately if user is authenticated
      let favoriteItemIds = new Set<string>()
      if (currentUserId) {
        const { data: favoritesData } = await supabase
          .from('favorites')
          .select('gift_item_id')
          .eq('user_id', currentUserId)

        // Create a set of favorite item IDs with proper type casting
        favoriteItemIds = new Set(
          (favoritesData || [])
            .map(f => f.gift_item_id)
            .filter((id): id is string => typeof id === 'string')
        )
      }
      
      // Process items to add is_favorite flag and comments
      const itemsWithProfiles = processedItems.map(item => ({
        ...item,
        is_favorite: favoriteItemIds.has(item.id),
        comments: commentsByItemId.get(item.id) || []
      })) as GiftItem[]

      setGiftItems(itemsWithProfiles)

      // Update QR code generation to not use the qrcode library
      // Generate a simple URL instead of QR code
      setQrCodeUrl(`${window.location.origin}/registry/${params.id}`);
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
    setContributionsRefreshKey(prevKey => prevKey + 1)
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
      // If Web Share API is not supported, show social share popup
      setShowSharePopup(true)
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

  const handlePurchase = async (itemId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to mark items as purchased')
      return
    }

    try {
      setLoading(true)
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { error } = await supabase
        .from('gift_items')
        .update({ is_purchased: true })
        .eq('id', itemId)

      if (error) throw error
      toast.success('Item marked as purchased')
      fetchRegistry()
    } catch (error: any) {
      console.error('Error marking as purchased:', error)
      toast.error('Failed to mark item as purchased')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (itemId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add favorites')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const item = giftItems.find(item => item.id === itemId)
      if (!item) throw new Error('Item not found')

      if (item.is_favorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('gift_item_id', itemId)

        if (error) throw error
        toast.success('Removed from favorites')
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            gift_item_id: itemId
          })

        if (error) throw error
        toast.success('Added to favorites')
      }

      fetchRegistry()
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorites')
    }
  }

  const shareToWhatsApp = () => {
    const url = `${window.location.origin}/registry/${params.id}`
    const encodedText = encodeURIComponent(`Check out my gift registry: ${registry?.title}\n${url}`)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    setShowSharePopup(false)
  }

  const shareToFacebook = () => {
    const url = `${window.location.origin}/registry/${params.id}`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    setShowSharePopup(false)
  }

  const shareToTwitter = () => {
    const url = `${window.location.origin}/registry/${params.id}`
    const text = `Check out my gift registry: ${registry?.title}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    setShowSharePopup(false)
  }

  const shareToEmail = () => {
    const url = `${window.location.origin}/registry/${params.id}`
    const subject = encodeURIComponent(`${registry?.title} - Gift Registry`)
    const body = encodeURIComponent(`Check out my gift registry: ${registry?.title}\n${url}`)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    setShowSharePopup(false)
  }

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/registry/${params.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Registry link copied to clipboard!')
    setShowSharePopup(false)
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (error || !registry) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error || 'Registry not found'}</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4 gap-1"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{registry.title}</h1>
          <p className="text-muted-foreground">{registry.description}</p>
        </div>
        <div className="ml-auto flex gap-2">
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
                                {comment.profiles ? (
                                  <span className="font-medium">{comment.profiles.first_name} {comment.profiles.last_name}</span>
                                ) : (
                                  <span className="font-medium">Anonymous</span>
                                )}
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
              <ContributionsList registryId={params.id} refreshKey={contributionsRefreshKey} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="share">
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Share Your Registry</CardTitle>
                <CardDescription>Share your registry link with friends and family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center w-full max-w-md">
                    <p className="text-sm text-gray-500 mb-2">Your registry link:</p>
                    <p className="font-medium break-all">{qrCodeUrl}</p>
                  </div>
                  
                  <Button 
                    onClick={copyToClipboard} 
                    variant="outline"
                    className="w-full max-w-md"
                  >
                    Copy Link to Clipboard
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={shareToWhatsApp}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600">
                      <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.447h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={shareToFacebook}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600">
                      <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-xs">Facebook</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={shareToTwitter}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-400">
                      <path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    <span className="text-xs">Twitter</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={shareToEmail}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-red-500">
                      <path fill="currentColor" d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z" />
                    </svg>
                    <span className="text-xs">Email</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
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

      {showSharePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Share Registry</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-2" 
                onClick={() => setShowSharePopup(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={shareToWhatsApp}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600">
                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.447h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-xs">WhatsApp</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={shareToFacebook}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-xs">Facebook</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={shareToTwitter}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-400">
                    <path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  <span className="text-xs">Twitter</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={shareToEmail}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-red-500">
                    <path fill="currentColor" d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z" />
                  </svg>
                  <span className="text-xs">Email</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-md p-2">
                <div className="truncate flex-1 text-sm bg-muted/50 p-2 rounded">
                  {`${window.location.origin}/registry/${params.id}`}
                </div>
                <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Add Items to Your Registry</h2>
        <Tabs defaultValue="search" className="w-full">
          <TabsList>
            <TabsTrigger value="search">Search Products</TabsTrigger>
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <ProductSearch
              registryId={params.id}
              onProductSelect={(product) => {
                // Refresh the items list after adding a product
                fetchRegistry()
              }}
            />
          </TabsContent>
          <TabsContent value="manual">
            <AddItemForm
              registryId={params.id}
              onItemAdded={() => {
                fetchRegistry()
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 