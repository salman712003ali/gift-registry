import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EmailPayload {
  to: string
  subject: string
  content: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content } = await req.json() as EmailPayload

    // Validate input
    if (!to || !subject || !content) {
      throw new Error('Missing required fields')
    }

    // Initialize SendGrid
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    if (!SENDGRID_API_KEY) {
      throw new Error('Missing SendGrid API key')
    }

    // Send email using SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }]
          }
        ],
        from: {
          email: 'noreply@giftregistry.com',
          name: 'Gift Registry'
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: content
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`SendGrid error: ${JSON.stringify(error)}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
}) 