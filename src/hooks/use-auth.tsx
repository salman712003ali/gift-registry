'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type User = {
  id: string
  email: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check for session and set up auth state listener
  useEffect(() => {
    console.log('Auth provider initialized')
    
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Active session found')
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
        } else {
          console.log('No active session')
          setUser(null)
        }
      } catch (error) {
        console.error('Session check error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event)
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      console.log('Auth hook: signing in with', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Auth hook: sign in error', error)
        return { error }
      }
      
      if (data.session) {
        console.log('Auth hook: sign in successful, session created')
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
        })
        
        // Ensure profile exists with retry logic
        try {
          console.log('Auth hook: ensuring profile exists')
          for (let i = 0; i < 3; i++) { // Try up to 3 times
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert(
                {
                  id: data.session.user.id,
                  email: data.session.user.email,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              )
            
            if (!profileError) {
              console.log('Auth hook: profile created/updated successfully')
              break
            }
            
            if (i === 2) { // Last attempt failed
              console.error('Auth hook: profile creation failed after 3 attempts', profileError)
            } else {
              console.warn(`Auth hook: profile creation attempt ${i+1} failed, retrying...`, profileError)
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
            }
          }
        } catch (error) {
          console.error('Auth hook: profile creation exception', error)
        }
        
        // Refresh page to make sure session is properly loaded
        window.location.href = '/dashboard'
        return { error: null }
      }
      
      console.error('Auth hook: sign in had no error but no session was created')
      return { error: new Error('No session created') }
    } catch (error) {
      console.error('Auth hook: sign in exception', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    setLoading(true)
    
    try {
      await supabase.auth.signOut()
      router.push('/auth/sign-in')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
} 