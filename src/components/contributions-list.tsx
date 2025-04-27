'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type ContributionRow = Tables['contributions']['Row']
type ProfileRow = Tables['profiles']['Row']

interface Profile {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  email?: string | null
}

interface RawContribution {
  id: string
  amount: number
  message?: string | null
  created_at: string
  contributor_name?: string | null
  user_id?: string | null
  profile_id?: string | null
  profiles?: Profile | null
}

interface Contribution extends RawContribution {
  formatted_name: string
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
  const supabase = createClient()

  const fetchContributions = async () => {
    try {
      setLoading(true)
      console.log('Fetching contributions for:', { giftItemId, registryId })
      
      // First fetch contributions with profiles
      let query = supabase
        .from('contributions')
        .select(`
          id,
          amount,
          message,
          created_at,
          contributor_name,
          user_id,
          profile_id,
          profiles (
            id,
            first_name,
            last_name,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (giftItemId) {
        query = query.eq('gift_item_id', giftItemId)
      }
      if (registryId) {
        query = query.eq('registry_id', registryId)
      }

      const { data: contributionsData, error: fetchError } = await query

      if (fetchError) throw fetchError

      console.log('Raw contributions data:', contributionsData)

      if (!contributionsData || !Array.isArray(contributionsData)) {
        throw new Error('No contributions found')
      }

      // Process contributions with profile data
      const processedContributions: Contribution[] = contributionsData.map((contribution: RawContribution) => {
        const profile = contribution.profiles
        const formatted_name = contribution.contributor_name || 
          (profile ? (
            profile.full_name ||
            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
            profile.email ||
            'Anonymous'
          ) : 'Anonymous')

        return {
          ...contribution,
          formatted_name
        }
      })

      console.log('Processed contributions:', processedContributions)

      // Calculate stats
      const totalAmount = processedContributions.reduce((sum, contribution) => {
        return sum + contribution.amount
      }, 0)

      const uniqueContributors = new Set(
        processedContributions.map(c => c.profile_id || c.contributor_name || 'anonymous')
      ).size

      setStats({
        total: totalAmount,
        count: uniqueContributors
      })

      setContributions(processedContributions)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching contributions:', err)
      setError(err.message || 'Failed to fetch contributions')
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
                  {contribution.formatted_name}
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