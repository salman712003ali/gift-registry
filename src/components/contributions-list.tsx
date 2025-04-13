'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Contribution {
  id: string
  amount: number
  message?: string
  created_at: string
  users?: {
    full_name: string | null
  }
}

interface ContributionsListProps {
  giftItemId?: string
  registryId?: string
}

export function ContributionsList({ giftItemId, registryId }: ContributionsListProps) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContributions = async () => {
    try {
      const params = new URLSearchParams()
      if (giftItemId) params.append('gift_item_id', giftItemId)
      if (registryId) params.append('registry_id', registryId)

      const response = await fetch(`/api/contributions?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contributions')
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
  }, [giftItemId, registryId])

  if (loading) {
    return <div className="text-center">Loading contributions...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (contributions.length === 0) {
    return <div className="text-muted-foreground">No contributions yet</div>
  }

  return (
    <div className="space-y-4">
      {contributions.map((contribution) => (
        <Card key={contribution.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {contribution.users?.full_name || 'Anonymous'}
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
  )
} 