import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // This is a dummy implementation for deployment - will be configured later
    return NextResponse.json(
      { 
        received: true,
        message: "This is a placeholder. Configure Stripe webhooks in production."
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
} 