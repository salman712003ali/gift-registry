'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthDebug } from '@/components/auth-debug'

export default function DirectLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const supabase = createClient()

  // Direct login without hooks
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('Logging in...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setMessage(`Error: ${error.message}`)
        throw error
      }
      
      if (data.session) {
        setMessage('Successfully logged in. Creating profile and redirecting...')
        
        // Create profile if needed
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.session.user.id,
              email: data.session.user.email,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            
          if (profileError) {
            console.error('Profile error:', profileError)
            setMessage(`Profile error: ${profileError.message}, but continuing...`)
          }
        } catch (e: any) {
          console.error('Profile creation error:', e)
          setMessage(`Profile error: ${e.message}, but continuing...`)
        }
        
        // Redirect using direct navigation
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        setMessage('No session created. Something went wrong.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AuthDebug />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Emergency Direct Login</CardTitle>
          <CardDescription>
            This bypasses all hooks and middleware for direct Supabase login
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleDirectLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {message && (
              <div className="p-3 bg-muted rounded text-sm">
                {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Direct Login'}
            </Button>
            <div className="text-xs text-muted-foreground">
              Use the browser console for debugging: press F12 and check the console tab.
              <br />
              Type <code>debugAuth.help()</code> for debug commands.
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 