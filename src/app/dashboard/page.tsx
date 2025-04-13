'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch user's registries with gift items and their contributions
      const { data: registriesData, error: registriesError } = await supabase
        .from('registries')
        .select(`
          *,
          gift_items!inner (
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

      if (registriesError) throw registriesError
      
      // Safely cast the data to the Registry type
      const safeRegistries = (registriesData || []) as unknown as Registry[];
      setRegistries(safeRegistries)

      // Fetch recent contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('contributions')
        .select(`
          *,
          gift_items!inner (
            name,
            registry_id
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (contributionsError) throw contributionsError

      // For each contribution, get its registry information
      if (contributionsData && contributionsData.length > 0) {
        // Get unique registry IDs from contributions
        const registryIds = Array.from(
          new Set(
            contributionsData.map((c: any) => c.gift_items.registry_id as string)
          )
        );
        
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
        
        // Add registry titles to contributions
        const enhancedContributions = contributionsData.map((contribution: any) => ({
          id: contribution.id,
          amount: contribution.amount,
          created_at: contribution.created_at,
          gift_items: {
            name: contribution.gift_items.name,
            registry_id: contribution.gift_items.registry_id,
            registries: {
              title: registryMap.get(contribution.gift_items.registry_id) || 'Unknown Registry'
            }
          }
        }));
        
        setRecentContributions(enhancedContributions as Contribution[])
      } else {
        setRecentContributions([])
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error(error.message)
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/create-registry">Create New Registry</Link>
        </Button>
      </div>

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