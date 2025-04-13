import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const itemStr = localStorage.getItem(key)
          if (!itemStr) return null
          const item = JSON.parse(itemStr)
          const now = new Date()
          if (now.getTime() > item.expiry) {
            localStorage.removeItem(key)
            return null
          }
          return item.value
        } catch (err) {
          return null
        }
      },
      setItem: (key, value) => {
        const item = {
          value: value,
          expiry: new Date().getTime() + 365 * 24 * 60 * 60 * 1000, // 1 year
        }
        localStorage.setItem(key, JSON.stringify(item))
      },
      removeItem: (key) => localStorage.removeItem(key)
    }
  }
})

export default supabase 