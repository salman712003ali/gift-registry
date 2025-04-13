import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
}

interface Contribution {
  id: string;
  amount: number;
  contributor_name?: string;
  message?: string;
  created_at: string;
  user_id?: string;
  profiles?: Profile;
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const giftItemId = searchParams.get('gift_item_id')
    const registryId = searchParams.get('registry_id')

    if (!giftItemId && !registryId) {
      return NextResponse.json(
        { error: 'Either gift_item_id or registry_id is required' },
        { status: 400 }
      )
    }

    // Use profiles instead of users and specify both user_id and profile_id for maximum compatibility
    let query = supabase
      .from('contributions')
      .select(`
        id, 
        amount, 
        contributor_name, 
        message, 
        created_at, 
        user_id
      `)

    if (giftItemId) {
      query = query.eq('gift_item_id', giftItemId)
    }

    if (registryId) {
      query = query.eq('registry_id', registryId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contributions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contributions' },
        { status: 500 }
      )
    }

    // If we have user_ids, fetch associated profiles in a separate query
    const userIds = data
      .filter(contribution => contribution.user_id)
      .map(contribution => contribution.user_id);
    
    let profilesMap = new Map();
    
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, email')
        .in('id', userIds);
        
      if (!profilesError && profilesData) {
        // Create a map of user_id to profile data
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }
    }

    // Process data to ensure contributor names are properly formatted
    const processedData = data.map(contribution => {
      const contribWithProfile = contribution as Contribution;
      
      // Add profile data if available
      if (contribWithProfile.user_id && profilesMap.has(contribWithProfile.user_id)) {
        contribWithProfile.profiles = profilesMap.get(contribWithProfile.user_id);
      }
      
      // Use contributor_name field if available (for anonymous contributions)
      // Otherwise use profile data if available
      if (!contribWithProfile.contributor_name && contribWithProfile.profiles) {
        const profile = contribWithProfile.profiles;
        contribWithProfile.contributor_name = profile.full_name || 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
          'Anonymous';
      } else if (!contribWithProfile.contributor_name) {
        contribWithProfile.contributor_name = 'Anonymous';
      }
      return contribWithProfile;
    });

    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error in contributions route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    console.log('Request body:', body)

    const { gift_item_id, registry_id, amount, message, contributor_name } = body

    if (!gift_item_id || !registry_id || !amount) {
      return NextResponse.json(
        { error: 'Gift item ID, registry ID, and amount are required' },
        { status: 400 }
      )
    }

    // First, verify that the gift item exists and belongs to the registry
    const { data: giftItem, error: giftItemError } = await supabase
      .from('gift_items')
      .select('registry_id')
      .eq('id', gift_item_id)
      .single()

    if (giftItemError || !giftItem) {
      console.error('Error fetching gift item:', giftItemError)
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 }
      )
    }

    if (giftItem.registry_id !== registry_id) {
      return NextResponse.json(
        { error: 'Gift item does not belong to the specified registry' },
        { status: 400 }
      )
    }

    // Get the current user's session if available
    const { data: { session } } = await supabase.auth.getSession()

    // Create the contribution using profile_id (and user_id for backward compatibility)
    const { data, error } = await supabase
      .from('contributions')
      .insert({
        gift_item_id,
        registry_id,
        user_id: session?.user?.id || null,
        profile_id: session?.user?.id || null, // Use the same ID for profile_id
        contributor_name: session?.user?.id ? null : contributor_name, // Only set if not authenticated
        amount,
        message: message || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contribution:', error)
      return NextResponse.json(
        { error: 'Failed to create contribution', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in contributions route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// NEW API ENDPOINT for analytics
export async function OPTIONS(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const registryId = searchParams.get('registry_id')
    
    if (!registryId) {
      return NextResponse.json(
        { error: 'registry_id is required' },
        { status: 400 }
      )
    }
    
    // Get the total number of contributions and total amount
    const { data: totals, error: totalsError } = await supabase
      .from('contributions')
      .select('amount, created_at')
      .eq('registry_id', registryId)
      .order('created_at', { ascending: false })
    
    if (totalsError) {
      console.error('Error fetching contribution totals:', totalsError)
      return NextResponse.json(
        { error: 'Failed to fetch contribution analytics' },
        { status: 500 }
      )
    }
    
    // Count unique contributors
    const { data: contributorsCount, error: countError } = await supabase
      .from('contributions')
      .select('user_id, contributor_name')
      .eq('registry_id', registryId)
    
    if (countError) {
      console.error('Error counting contributors:', countError)
      return NextResponse.json(
        { error: 'Failed to count contributors' },
        { status: 500 }
      )
    }
    
    // Calculate unique contributors
    const uniqueContributors = new Set()
    contributorsCount.forEach(contribution => {
      if (contribution.user_id) {
        uniqueContributors.add(contribution.user_id)
      } else if (contribution.contributor_name) {
        // For anonymous contributions, use contributor_name
        uniqueContributors.add(`anon-${contribution.contributor_name}`)
      }
    })
    
    // Calculate totals
    const totalAmount = totals.reduce((sum, item) => sum + (item.amount || 0), 0)
    const totalContributions = totals.length
    
    return NextResponse.json({
      totalAmount,
      totalContributions,
      uniqueContributors: uniqueContributors.size,
      lastContributionDate: totals.length > 0 ? 
        totals[0]?.created_at : null
    })
    
  } catch (error) {
    console.error('Error in contribution analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 