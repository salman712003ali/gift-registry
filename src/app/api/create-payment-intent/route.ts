import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await req.json()
    const { 
      amount, 
      registryId, 
      giftItemId, 
      contributorName, 
      message, 
      isAnonymous,
      userId
    } = body

    if (!amount || !registryId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Fetch registry info to include in metadata
    const { data: registry } = await supabase
      .from('registries')
      .select('title, user_id')
      .eq('id', registryId)
      .single()

    if (!registry) {
      return NextResponse.json(
        { error: 'Registry not found' },
        { status: 404 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        registryId,
        giftItemId: giftItemId || '',
        contributorName,
        message: message || '',
        isAnonymous: isAnonymous ? 'true' : 'false',
        userId: userId || '',
        registryTitle: registry.title,
        registryOwnerId: registry.user_id
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
} 