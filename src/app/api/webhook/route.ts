import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { Resend } from 'resend'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
})

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
)

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (error: unknown) {
    console.error(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    )
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const metadata = paymentIntent.metadata

    try {
      // Extract metadata
      const registryId = metadata.registryId
      const giftItemId = metadata.giftItemId
      const message = metadata.message
      const contributorName = metadata.contributorName
      const isAnonymous = metadata.isAnonymous === 'true'
      const userId = metadata.userId

      // Save contribution to database
      const { data: contribution, error } = await supabase
        .from('contributions')
        .insert({
          registry_id: registryId,
          gift_item_id: giftItemId || null,
          user_id: userId || null,
          amount: paymentIntent.amount,
          message: message,
          contributor_name: contributorName,
          is_anonymous: isAnonymous,
          payment_intent_id: paymentIntent.id,
          status: 'completed'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving contribution:', error)
        return NextResponse.json(
          { error: 'Error saving contribution' },
          { status: 500 }
        )
      }

      // Get registry information for notification
      const { data: registry } = await supabase
        .from('registries')
        .select('title, user_id, id')
        .eq('id', registryId)
        .single()

      if (registry) {
        // Get registry owner email
        const { data: owner } = await supabase
          .from('profiles')
          .select('email, first_name, last_name, notification_preferences')
          .eq('id', registry.user_id)
          .single()

        if (owner && owner.notification_preferences?.email_on_contribution) {
          // Send email notification
          await resend.emails.send({
            from: process.env.MAIL_FROM || 'Gift Registry <noreply@registry-gift.com>',
            to: owner.email,
            subject: `New Contribution to Your Registry: ${registry.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Contribution!</h2>
                <p>Hello ${owner.first_name || 'there'},</p>
                <p>${isAnonymous ? 'Someone' : contributorName} has contributed ₹${(paymentIntent.amount / 100).toFixed(2)} to your registry "${registry.title}".</p>
                ${message ? `<p>Message: "${message}"</p>` : ''}
                <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/registry/${registry.id}">View your registry</a></p>
                <p>Thank you for using Gift Registry!</p>
              </div>
            `,
          })
        }

        // Create notification in database
        await supabase.from('notifications').insert({
          user_id: registry.user_id,
          type: 'contribution',
          content: `${isAnonymous ? 'Someone' : contributorName} contributed ₹${(paymentIntent.amount / 100).toFixed(2)} to your registry "${registry.title}".`,
          registry_id: registry.id,
          contribution_id: contribution.id,
          read: false
        })
      }

      return NextResponse.json({ received: true, success: true })
    } catch (error: unknown) {
      console.error('Error processing payment:', error)
      return NextResponse.json(
        { error: 'Error processing payment' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
} 