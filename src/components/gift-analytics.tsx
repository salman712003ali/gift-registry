'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface AnalyticsData {
  totalAmount: number
  totalContributions: number
  uniqueContributors: number
  lastContributionDate: string | null
}

interface GiftAnalyticsProps {
  registryId: string
}

export function GiftAnalytics({ registryId }: GiftAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // Using OPTIONS method as a workaround to fetch analytics
      const response = await fetch(`/api/contributions?registry_id=${registryId}`, {
        method: 'OPTIONS'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
      
      setAnalytics(data)
      setError(null)
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      setError(error.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (registryId) {
      fetchAnalytics()
    }
  }, [registryId])

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
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Registry Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">TOTAL RAISED</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.totalAmount)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">CONTRIBUTIONS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalContributions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">CONTRIBUTORS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.uniqueContributors}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">AVERAGE CONTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.totalContributions > 0 
                ? formatCurrency(analytics.totalAmount / analytics.totalContributions) 
                : formatCurrency(0)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {analytics.lastContributionDate && (
        <p className="text-sm text-gray-500">
          Last contribution: {new Date(analytics.lastContributionDate).toLocaleDateString()}
        </p>
      )}
    </div>
  )
} 