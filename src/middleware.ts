import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we can modify
    const res = NextResponse.next()
    
    // Create Supabase client with middleware
    const supabase = createMiddlewareClient({ req: request, res })
    
    // Refresh the session if available
    await supabase.auth.getSession()
    
    // For debugging only
    console.log('Middleware - Path:', request.nextUrl.pathname)
    
    // Return the response with the refreshed session
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of error, continue without modification
    return NextResponse.next()
  }
}

// Only run middleware on auth-related routes
export const config = {
  matcher: [
    '/auth/:path*',
  ],
} 