'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// This component injects a debugging script that can be used
// from any page to check authentication status
export function AuthDebug() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Add to window for debugging
    const supabase = createClient()
    
    // @ts-ignore
    window.debugAuth = {
      // Check current session
      getSession: async () => {
        try {
          const { data, error } = await supabase.auth.getSession()
          console.log('Session:', data.session)
          console.log('Error:', error)
          return { data, error }
        } catch (e) {
          console.error('Session error:', e)
          return { error: e }
        }
      },
      
      // Get current user
      getUser: async () => {
        try {
          const { data, error } = await supabase.auth.getUser()
          console.log('User:', data.user)
          console.log('Error:', error)
          return { data, error }
        } catch (e) {
          console.error('User error:', e)
          return { error: e }
        }
      },
      
      // Check profile
      getProfile: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            console.log('No session found')
            return { error: 'No session found' }
          }
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          console.log('Profile:', data)
          console.log('Error:', error)
          return { data, error }
        } catch (e) {
          console.error('Profile error:', e)
          return { error: e }
        }
      },
      
      // Create profile
      createProfile: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            console.log('No session found')
            return { error: 'No session found' }
          }
          
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              updated_at: new Date().toISOString(),
            })
          
          console.log('Profile created:', data)
          console.log('Error:', error)
          return { data, error }
        } catch (e) {
          console.error('Profile creation error:', e)
          return { error: e }
        }
      },
      
      // Login
      login: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          console.log('Session:', data.session)
          console.log('Error:', error)
          return { data, error }
        } catch (e) {
          console.error('Login error:', e)
          return { error: e }
        }
      },
      
      // Logout
      logout: async () => {
        try {
          const { error } = await supabase.auth.signOut()
          console.log('Signed out')
          console.log('Error:', error)
          return { error }
        } catch (e) {
          console.error('Logout error:', e)
          return { error: e }
        }
      },
      
      // Go to dashboard
      goToDashboard: () => {
        window.location.href = '/dashboard'
      },
      
      // Force reload
      reload: () => {
        window.location.reload()
      },
      
      // Check URL params
      urlParams: () => {
        return new URLSearchParams(window.location.search)
      },
      
      // Debugging help
      help: () => {
        console.log('Available commands:')
        console.log('debugAuth.getSession() - Check current session')
        console.log('debugAuth.getUser() - Get current user')
        console.log('debugAuth.getProfile() - Check profile')
        console.log('debugAuth.createProfile() - Create profile')
        console.log('debugAuth.login(email, password) - Login')
        console.log('debugAuth.logout() - Logout')
        console.log('debugAuth.goToDashboard() - Go to dashboard')
        console.log('debugAuth.reload() - Force reload')
        console.log('debugAuth.urlParams() - Check URL params')
      }
    }
    
    console.log('Auth debugging enabled. Type "debugAuth.help()" for available commands.')
  }, [])

  return null
} 