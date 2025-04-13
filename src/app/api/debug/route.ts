import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface TableCounts {
  [key: string]: { count?: number | null, error?: string }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Count records in each table
    const tables = ['registries', 'gift_items', 'contributions', 'profiles']
    const counts: TableCounts = {}

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        counts[table] = { error: error.message }
      } else {
        counts[table] = { count }
      }
    }

    // Get a sample registry if any exist
    const { data: sampleRegistry, error: registryError } = await supabase
      .from('registries')
      .select('*')
      .limit(1)
      .single()

    return NextResponse.json({
      tables: counts,
      sampleRegistry: registryError ? null : sampleRegistry,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 