import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching gift item:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gift item' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gift item route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('gift_items')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating gift item:', error)
      return NextResponse.json(
        { error: 'Failed to update gift item' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gift item route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('gift_items')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting gift item:', error)
      return NextResponse.json(
        { error: 'Failed to delete gift item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in gift item route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 