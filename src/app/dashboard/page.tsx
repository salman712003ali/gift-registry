'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Gift, Search, ArrowLeft } from 'lucide-react'

interface Registry {
  id: string
  title: string
  description: string
  occasion: string
  event_date: string
  created_at: string
  privacy_settings: {
    is_private: boolean
    show_contributor_names: boolean
    allow_anonymous_contributions: boolean
  }
  gift_items: {
    id: string
    name: string
    price: number
    contributions: {
      amount: number
    }[]
  }[]
}

interface Contribution {
  id: string
  amount: number
  created_at: string
  gift_items: {
    name: string
    registry_id: string
    registries?: {
      title: string
    }
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [registries, setRegistries] = useState<Registry[]>([])
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...')
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Session check:', session ? 'authenticated' : 'not authenticated')
      
      if (!session) {
        router.push('/auth/sign-in')
        return
      }

      // Fetch user's registries (no forced inner join)
      const { data: registriesData, error: registriesError } = await supabase
        .from('registries')
        .select(`
          *,
          gift_items (
            id,
            name,
            price,
            contributions (
              amount
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      console.log('Registry data fetch result:', registriesError ? 'error' : 'success')

      if (registriesError) {
        console.error('Registry fetch error:', registriesError)
        throw registriesError
      }
      
      // Safely cast the data to the Registry type
      const safeRegistries = (registriesData || []) as unknown as Registry[];
      setRegistries(safeRegistries)
      console.log('Registries found:', safeRegistries.length)

      // Fetch recent contributions using gift_item_id instead of nested selection
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('contributions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('Contributions data fetch result:', contributionsError ? 'error' : 'success')

      if (contributionsError) {
        console.error('Contributions fetch error:', contributionsError)
        throw contributionsError
      }

      // If there are contributions, fetch the related gift items separately
      if (contributionsData && contributionsData.length > 0) {
        console.log('Processing contributions:', contributionsData.length)
        
        // Extract gift item IDs
        const giftItemIds = contributionsData
          .filter(c => c.gift_item_id)
          .map(c => c.gift_item_id);
        
        if (giftItemIds.length > 0) {
          // Fetch gift items
          const { data: giftItemsData, error: giftItemsError } = await supabase
            .from('gift_items')
            .select('id, name, registry_id')
            .in('id', giftItemIds)
          
          if (giftItemsError) {
            console.error('Gift items fetch error:', giftItemsError)
            setRecentContributions([])
            return
          }

          // Create a map of gift item data
          const giftItemMap = new Map();
          if (giftItemsData && giftItemsData.length > 0) {
            giftItemsData.forEach(item => {
              giftItemMap.set(item.id, item);
            });
            
            // Get unique registry IDs from gift items
            const registryIds = Array.from(
              new Set(
                giftItemsData
                  .filter(item => item.registry_id)
                  .map(item => item.registry_id)
              )
            );
            
            if (registryIds.length > 0) {
              const { data: registryData } = await supabase
                .from('registries')
                .select('id, title')
                .in('id', registryIds)
              
              // Create a map of registry IDs to registry titles
              const registryMap = new Map<string, string>()
              if (registryData) {
                registryData.forEach(registry => {
                  registryMap.set(registry.id as string, registry.title as string)
                })
              }
              
              // Combine all the data
              const enhancedContributions = contributionsData.map(contribution => {
                const giftItem = giftItemMap.get(contribution.gift_item_id);
                if (!giftItem) return null;
                
                return {
                  id: contribution.id,
                  amount: contribution.amount,
                  created_at: contribution.created_at,
                  gift_items: {
                    name: giftItem.name,
                    registry_id: giftItem.registry_id,
                    registries: {
                      title: registryMap.get(giftItem.registry_id) || 'Unknown Registry'
                    }
                  }
                };
              }).filter(c => c !== null);
              
              setRecentContributions(enhancedContributions as Contribution[])
            } else {
              setRecentContributions([])
            }
          } else {
            setRecentContributions([])
          }
        } else {
          setRecentContributions([])
        }
      } else {
        setRecentContributions([])
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateRegistryProgress = (registry: Registry) => {
    const totalItems = registry.gift_items.length
    if (totalItems === 0) return 0

    const totalPrice = registry.gift_items.reduce((sum, item) => sum + item.price, 0)
    const totalContributed = registry.gift_items.reduce((sum, item) => {
      const itemContributions = item.contributions?.reduce((itemSum, contrib) => itemSum + contrib.amount, 0) || 0
      return sum + itemContributions
    }, 0)
    return Math.round((totalContributed / totalPrice) * 100)
  }

  if (loading) {
    return <div className="container py-8">Loading...</div>
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="sm"
          className="mr-4 gap-1"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild className="button-glow">
            <Link href="/create-registry">
              <Gift className="mr-2 h-4 w-4" />
              Create Registry
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/find-registry">
              <Search className="mr-2 h-4 w-4" />
              Find Registry
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Summary of all your registry statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Registries</p>
              <p className="text-2xl font-bold">{registries.length}</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Contributions</p>
              <p className="text-2xl font-bold">{recentContributions.length}</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">Avg. Funding</p>
              <p className="text-2xl font-bold">
                {registries.length ? 
                  Math.round(registries.reduce((sum, reg) => sum + calculateRegistryProgress(reg), 0) / registries.length) 
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Registries</CardTitle>
            <CardDescription>
              Manage your gift registries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registries.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">You haven't created any registries yet</p>
                <Button asChild>
                  <Link href="/create-registry">Create Your First Registry</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {registries.map((registry) => (
                  <Link 
                    key={registry.id} 
                    href={`/registry/${registry.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{registry.title}</h3>
                        <p className="text-sm text-muted-foreground">{registry.description}</p>
                        <p className="text-sm">Occasion: {registry.occasion}</p>
                        <p className="text-sm">
                          Event Date: {new Date(registry.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {calculateRegistryProgress(registry)}% Funded
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {registry.gift_items.length} items
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentContributions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent contributions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContributions.map((contribution) => (
                  <div key={contribution.id} className="flex justify-between items-start p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{contribution.gift_items.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contribution.gift_items.registries?.title || 'Unknown Registry'}
                      </p>
                      <p className="text-sm">
                        {new Date(contribution.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(contribution.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 