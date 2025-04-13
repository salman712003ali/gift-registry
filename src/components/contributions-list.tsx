'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Contribution {
  id: string
  amount: number
  message?: string
  created_at: string
  contributor_name?: string
  profiles?: {
    id?: string
    first_name?: string
    last_name?: string
    full_name?: string
    email?: string
  }
  users?: {
    full_name: string | null
  }
}

interface ContributionsListProps {
  giftItemId?: string
  registryId?: string
  refreshKey?: number
}

export function ContributionsList({ giftItemId, registryId, refreshKey = 0 }: ContributionsListProps) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{total: number, count: number}>({ total: 0, count: 0 })

  const fetchContributions = async () => {
    try {
      const params = new URLSearchParams()
      if (giftItemId) params.append('gift_item_id', giftItemId)
      if (registryId) params.append('registry_id', registryId)

      console.log('Fetching contributions with params:', params.toString());
      const response = await fetch(`/api/contributions?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || 'Failed to fetch contributions')
      }

      console.log('Contributions data:', data);
      
      // Calculate stats
      if (Array.isArray(data)) {
        const totalAmount = data.reduce((sum, contribution) => sum + (contribution.amount || 0), 0);
        setStats({
          total: totalAmount,
          count: data.length
        });
      }
      
      setContributions(data)
      setError(null)
    } catch (error: any) {
      console.error('Error fetching contributions:', error)
      setError(error.message || 'Failed to fetch contributions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContributions()
  }, [giftItemId, registryId, refreshKey])

  if (loading) {
    return <div className="text-center py-6">
      <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
      <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
    </div>
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
      <p className="font-medium">Error loading contributions</p>
      <p className="text-sm">{error}</p>
      <button 
        onClick={fetchContributions}
        className="mt-2 text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
      >
        Try Again
      </button>
    </div>
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No contributions yet</h3>
        <p className="text-gray-500 mt-2">Be the first to contribute to this registry!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Analytics summary */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium text-gray-500">TOTAL CONTRIBUTIONS</h4>
            <p className="text-xl font-semibold">{formatCurrency(stats.total)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">CONTRIBUTORS</h4>
            <p className="text-xl font-semibold">{stats.count}</p>
          </div>
        </div>
      </div>
      
      {/* Contributions list */}
      <div className="space-y-4">
        {contributions.map((contribution) => (
          <Card key={contribution.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {contribution.contributor_name || 
                   (contribution.profiles ? (
                      (contribution.profiles.full_name) || 
                      `${contribution.profiles.first_name || ''} ${contribution.profiles.last_name || ''}`.trim() ||
                      contribution.profiles.email ||
                      'Anonymous'
                   ) : 'Anonymous')}
                </p>
                <p className="text-muted-foreground text-sm">
                  {new Date(contribution.created_at).toLocaleDateString()}
                </p>
                {contribution.message && (
                  <p className="mt-2">{contribution.message}</p>
                )}
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(contribution.amount)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 