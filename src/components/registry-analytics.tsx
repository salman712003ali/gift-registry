'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUpIcon, UsersIcon, GiftIcon, CheckIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface RegistryAnalyticsProps {
  registryId: string
  refreshKey?: number
}

export function RegistryAnalytics({ registryId, refreshKey = 0 }: RegistryAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState({
    totalContributions: 0,
    totalAmount: 0,
    averageContribution: 0,
    uniqueContributors: 0,
    percentFunded: 0,
    totalTarget: 0,
    itemStats: {
      total: 0,
      funded: 0,
      partiallyFunded: 0
    }
  })

  useEffect(() => {
    if (registryId) {
      fetchAnalytics()
    }
  }, [registryId, refreshKey])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch contributions data for this registry
      const contributionsResponse = await fetch(`/api/analytics?registry_id=${registryId}`)
      
      if (!contributionsResponse.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await contributionsResponse.json()
      console.log('Registry analytics data:', data)
      
      if (data) {
        // Calculate metrics
        const totalContributions = data.total || 0
        const totalAmount = data.amount || 0
        const uniqueContributors = data.contributors || 0
        const averageContribution = uniqueContributors > 0 ? totalAmount / uniqueContributors : 0
        
        // Fetch gift items to calculate funding progress
        const itemsResponse = await fetch(`/api/gift-items?registry_id=${registryId}`)
        const itemsData = await itemsResponse.json()
        
        let totalTarget = 0
        let fundedItems = 0
        let partiallyFundedItems = 0
        
        if (Array.isArray(itemsData)) {
          itemsData.forEach(item => {
            const itemTotal = item.price * item.quantity
            totalTarget += itemTotal
            
            // Calculate item funding
            const itemContributions = item.contributions?.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) || 0
            const fundingPercentage = (itemContributions / itemTotal) * 100
            
            if (fundingPercentage >= 100) {
              fundedItems++
            } else if (fundingPercentage > 0) {
              partiallyFundedItems++
            }
          })
        }
        
        // Calculate overall funding percentage
        const percentFunded = totalTarget > 0 ? (totalAmount / totalTarget) * 100 : 0
        
        setMetrics({
          totalContributions,
          totalAmount,
          averageContribution,
          uniqueContributors,
          percentFunded: Math.min(percentFunded, 100), // Cap at 100%
          totalTarget,
          itemStats: {
            total: itemsData?.length || 0,
            funded: fundedItems,
            partiallyFunded: partiallyFundedItems
          }
        })
      }
      
      setError(null)
    } catch (err: any) {
      console.error('Error fetching registry analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-500">Error loading analytics: {error}</p>
          <button
            onClick={fetchAnalytics}
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
      <div className="glass-card p-4 rounded-lg animate-fade-in">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-lg">Overall Funding Progress</h3>
          <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
            {metrics.percentFunded.toFixed(1)}%
          </span>
        </div>
        <Progress value={metrics.percentFunded} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{formatCurrency(metrics.totalAmount)}</span>
          <span>of {formatCurrency(metrics.totalTarget)}</span>
        </div>
      </div>

      <div className="dashboard-grid animate-slide-up">
        <Card className="stat-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL CONTRIBUTIONS</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{formatCurrency(metrics.totalAmount)}</div>
            <p className="stat-label">from {metrics.totalContributions} contributions</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CONTRIBUTORS</CardTitle>
            <UsersIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{metrics.uniqueContributors}</div>
            <p className="stat-label">unique contributors</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AVERAGE CONTRIBUTION</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{formatCurrency(metrics.averageContribution)}</div>
            <p className="stat-label">per contributor</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">GIFT ITEMS</CardTitle>
            <GiftIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.itemStats.funded} / {metrics.itemStats.total}
            </div>
            <p className="text-xs text-gray-500">
              fully funded ({metrics.itemStats.partiallyFunded} partially funded)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 