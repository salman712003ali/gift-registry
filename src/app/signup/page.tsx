'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First check if email is valid
      if (!email || !password) {
        toast.error('Please enter both email and password')
        setLoading(false)
        return
      }

      // Check password length
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('This email is already registered. Please sign in instead.')
          return
        }
        throw error
      }

      if (!data.user) {
        toast.error('Failed to create user. Please try again.')
        return
      }

      if (data.user.identities && data.user.identities.length === 0) {
        toast.error('User already exists')
        return
      }

      // Check if email confirmation is required
      if (data.user.confirmation_sent_at) {
        toast.success('Check your email for the confirmation link!')
      } else {
        toast.success('Account created successfully! You can now sign in.')
      }

      // Clear the form after successful signup
      setEmail('')
      setPassword('')
      router.push('/login')
    } catch (error: any) {
      console.error('Error signing up:', error)
      toast.error(error.message || 'Failed to sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-background rounded-lg shadow-lg relative">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 gap-1"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="flex flex-col space-y-2 pt-8">
          <h2 className="text-center text-2xl font-bold">Create an account</h2>
          <p className="text-center text-sm text-muted-foreground">
            Sign up to create and manage your gift registries
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter your password (min. 6 characters)"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 