import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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

    let query = supabase
      .from('contributions')
      .select('*, users(full_name)')

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

    return NextResponse.json(data)
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

    // Create the contribution
    const { data, error } = await supabase
      .from('contributions')
      .insert({
        gift_item_id,
        registry_id,
        user_id: session?.user?.id || null,
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