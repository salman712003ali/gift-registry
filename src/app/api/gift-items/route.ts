import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const registryId = searchParams.get('registry_id')

    if (!registryId) {
      return NextResponse.json(
        { error: 'Registry ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('gift_items')
      .select('*')
      .eq('registry_id', registryId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching gift items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gift items' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gift items route:', error)
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

    const { registry_id, name, description, price, quantity, url } = body

    if (!registry_id) {
      return NextResponse.json(
        { error: 'Registry ID is required' },
        { status: 400 }
      )
    }

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Try to get the current user's ID, but don't require it
    let userId = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        userId = session.user.id
      }
    } catch (error) {
      console.warn('Could not get user session:', error)
    }

    const { data, error } = await supabase
      .from('gift_items')
      .insert({
        registry_id,
        user_id: userId, // This will be NULL if no user is logged in
        name,
        description,
        price,
        quantity: quantity || 1,
        url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating gift item:', error)
      return NextResponse.json(
        { error: 'Failed to create gift item', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gift items route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 