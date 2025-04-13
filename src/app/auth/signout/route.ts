import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || 'http://localhost:3000'
  return NextResponse.redirect(new URL('/login', origin))
} 