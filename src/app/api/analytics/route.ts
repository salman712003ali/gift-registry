import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const registryId = searchParams.get('registry_id')
    const userId = searchParams.get('user_id')

    if (!registryId && !userId) {
      return NextResponse.json(
        { error: 'Registry ID or User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    let responseData = {}

    // Registry-specific analytics
    if (registryId) {
      // Get total contributions and amount
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('contributions')
        .select('amount, user_id, contributor_name, message, created_at')
        .eq('registry_id', registryId)

      if (contributionsError) {
        console.error('Error fetching contributions:', contributionsError)
        return NextResponse.json(
          { error: 'Failed to fetch contributions data' },
          { status: 500 }
        )
      }

      // Calculate metrics
      const totalAmount = contributionsData.reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount.toString()) || 0)
      }, 0)

      // Get unique contributors
      const uniqueContributors = new Set(
        contributionsData.map(contribution => 
          contribution.user_id || contribution.contributor_name || 'anonymous'
        )
      ).size

      // Get gift items data with purchased status
      const { data: itemsData, error: itemsError } = await supabase
        .from('gift_items')
        .select('id, price, quantity, is_purchased')
        .eq('registry_id', registryId)

      if (itemsError) {
        console.error('Error fetching gift items:', itemsError)
        return NextResponse.json(
          { error: 'Failed to fetch gift items data' },
          { status: 500 }
        )
      }

      // Calculate percentage funded and item statistics
      let totalTargetAmount = 0
      let purchasedItems = 0
      
      if (itemsData) {
        totalTargetAmount = itemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        purchasedItems = itemsData.filter(item => item.is_purchased).length
      }

      const percentFunded = totalTargetAmount > 0 
        ? Math.min((totalAmount / totalTargetAmount) * 100, 100) 
        : 0

      responseData = {
        registry: {
          total: contributionsData.length,
          amount: totalAmount,
          contributors: uniqueContributors,
          percentFunded: percentFunded,
          totalTarget: totalTargetAmount,
          items: {
            total: itemsData?.length || 0,
            purchased: purchasedItems
          },
          contributionsData: contributionsData.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(0, 10) // Include 10 most recent contributions
        }
      }
    }

    // User-specific analytics (if userId provided)
    if (userId) {
      // Get user's registries
      const { data: registriesData, error: registriesError } = await supabase
        .from('registries')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (registriesError) {
        console.error('Error fetching user registries:', registriesError)
      } else {
        // Get total contributions across all user registries
        let totalContributions = 0
        let totalContributionAmount = 0
        
        if (registriesData && registriesData.length > 0) {
          const registryIds = registriesData.map(r => r.id)
          
          const { data: contribData, error: contribError } = await supabase
            .from('contributions')
            .select('amount')
            .in('registry_id', registryIds)
          
          if (!contribError && contribData) {
            totalContributions = contribData.length
            totalContributionAmount = contribData.reduce((sum, c) => 
              sum + (parseFloat(c.amount.toString()) || 0), 0)
          }
        }
        
        responseData = {
          ...responseData,
          user: {
            registries: registriesData?.length || 0,
            totalContributions,
            totalAmount: totalContributionAmount
          }
        }
      }
    }

    // Return analytics data
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 