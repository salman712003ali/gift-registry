'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { ChevronUpIcon, ChevronDownIcon, DollarSignIcon, GiftIcon, UsersIcon, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AnalyticsProps {
  userId: string
  refreshTrigger?: number
}

export function UserAnalyticsDashboard({ userId, refreshTrigger = 0 }: AnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<{
    totalContributions: number
    totalAmount: number
    totalGiftItems: number
    totalRegistries: number
    recentActivity: Array<{
      type: string
      date: string
      amount?: number
      itemName?: string
      registryTitle?: string
    }>
  }>({
    totalContributions: 0,
    totalAmount: 0,
    totalGiftItems: 0,
    totalRegistries: 0,
    recentActivity: []
  })
  
  const supabase = createClient()
  
  useEffect(() => {
    fetchUserAnalytics()
  }, [userId, refreshTrigger])
  
  const fetchUserAnalytics = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      
      // Fetch registries count
      const { data: registriesData, error: registriesError } = await supabase
        .from('registries')
        .select('id')
        .eq('user_id', userId)
      
      if (registriesError) throw registriesError
      
      // Fetch gift items count
      const { data: itemsData, error: itemsError } = await supabase
        .from('gift_items')
        .select(`
          id,
          registry_id,
          registries!inner (
            user_id
          )
        `)
        .eq('registries.user_id', userId)
      
      if (itemsError) throw itemsError
      
      // Fetch contributions data
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('contributions')
        .select(`
          id,
          amount,
          created_at,
          gift_item_id,
          gift_items!inner(
            name,
            registry_id,
            registries!inner(
              title,
              user_id
            )
          )
        `)
        .eq('gift_items.registries.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (contributionsError) throw contributionsError
      
      // Calculate totals
      const totalAmount = contributionsData?.reduce((sum, contribution) => sum + contribution.amount, 0) || 0
      
      // Format recent activity
      const recentActivity = contributionsData?.map(contribution => ({
        type: 'contribution',
        date: contribution.created_at,
        amount: contribution.amount,
        itemName: contribution.gift_items?.name,
        registryTitle: contribution.gift_items?.registries?.title
      })) || []
      
      setAnalytics({
        totalContributions: contributionsData?.length || 0,
        totalAmount,
        totalGiftItems: itemsData?.length || 0,
        totalRegistries: registriesData?.length || 0,
        recentActivity
      })
      
      setError(null)
    } catch (err: any) {
      console.error('Error fetching user analytics:', err)
      setError(err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-500">Error loading analytics: {error}</p>
          <button
            onClick={fetchUserAnalytics}
            className="mt-2 text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">TOTAL RAISED</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalAmount)}</div>
                <p className="text-xs text-gray-500">from {analytics.totalContributions} contributions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">REGISTRIES</CardTitle>
                <GiftIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalRegistries}</div>
                <p className="text-xs text-gray-500">active registries</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">GIFT ITEMS</CardTitle>
                <GiftIcon className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalGiftItems}</div>
                <p className="text-xs text-gray-500">across all registries</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">AVG. CONTRIBUTION</CardTitle>
                <UsersIcon className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalContributions > 0 
                    ? formatCurrency(analytics.totalAmount / analytics.totalContributions) 
                    : formatCurrency(0)}
                </div>
                <p className="text-xs text-gray-500">per contribution</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <div className="flex items-center">
                          <Badge className="mr-2">{activity.type}</Badge>
                          <p className="font-medium">{activity.itemName}</p>
                        </div>
                        <p className="text-sm text-gray-500">{activity.registryTitle}</p>
                        <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleString()}</p>
                      </div>
                      <div className="font-bold">{formatCurrency(activity.amount || 0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 