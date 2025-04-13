'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      // Clear any local storage or state
      localStorage.clear()
      sessionStorage.clear()
      // Redirect to login page
      router.push('/login')
      router.refresh() // Force a refresh of the page
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Gift Registry
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`transition-colors hover:text-foreground/80 ${
                    pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/create-registry"
                  className={`transition-colors hover:text-foreground/80 ${
                    pathname === '/create-registry' ? 'text-foreground' : 'text-foreground/60'
                  }`}
                >
                  Create Registry
                </Link>
                <Link
                  href="/find-registry"
                  className={`transition-colors hover:text-foreground/80 ${
                    pathname === '/find-registry' ? 'text-foreground' : 'text-foreground/60'
                  }`}
                >
                  Find Registry
                </Link>
                <Link
                  href="/settings"
                  className={`transition-colors hover:text-foreground/80 ${
                    pathname === '/settings' ? 'text-foreground' : 'text-foreground/60'
                  }`}
                >
                  Settings
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 