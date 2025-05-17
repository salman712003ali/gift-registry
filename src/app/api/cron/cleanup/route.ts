import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Delete expired sessions
    const { error: sessionError } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (sessionError) throw sessionError

    // Delete old verification tokens
    const { error: tokenError } = await supabase
      .from('verification_tokens')
      .delete()
      .lt('expires', new Date().toISOString())

    if (tokenError) throw tokenError

    // Clean up unused files
    const { data: files, error: filesError } = await supabase
      .storage
      .from('gift-images')
      .list()

    if (filesError) throw filesError

    // Delete files older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    for (const file of files) {
      if (new Date(file.created_at) < thirtyDaysAgo) {
        await supabase
          .storage
          .from('gift-images')
          .remove([file.name])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 