import { createClient } from '@/utils/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { type, userId, registryId, itemId, contributorName, amount } = await request.json()

    // Get user's notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('users')
      .select('notifications_enabled, email_notifications')
      .eq('id', userId)
      .single()

    if (prefError) {
      console.error('Error fetching user preferences:', prefError)
      return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 })
    }

    // Only proceed if notifications are enabled
    if (!preferences?.notifications_enabled) {
      return NextResponse.json({ message: 'Notifications disabled' }, { status: 200 })
    }

    // Create notification record
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        registry_id: registryId,
        gift_item_id: itemId,
        contributor_name: contributorName,
        amount,
        read: false,
      })

    if (notifyError) {
      console.error('Error creating notification:', notifyError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // If email notifications are enabled, we'll handle that separately
    // This is where you would integrate with an email service
    if (preferences?.email_notifications) {
      // TODO: Implement email notification logic
      console.log('Email notification would be sent here')
    }

    return NextResponse.json({ message: 'Notification created successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in notification route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 