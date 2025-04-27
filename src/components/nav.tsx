'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Menu, Bell, LogOut, User, Settings, Home, Gift, Search, Plus, ChevronDown } from 'lucide-react'
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Profile {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  email: string | null
}

type DatabaseProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    getProfile()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getProfile()
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, email')
          .eq('id', session.user.id)
          .single<DatabaseProfile>()

        if (error) {
          console.error('Profile fetch error:', error)
          
          // If profile doesn't exist, create a default one with email
          console.log('Creating default profile for user')
          setProfile({
            first_name: null,
            last_name: null,
            avatar_url: null,
            email: session.user.email || null
          })
          
          // Try to create profile in database
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              updated_at: new Date().toISOString()
            })
          
          if (upsertError) {
            console.error('Error creating profile:', upsertError)
          }
        } else if (data) {
          console.log('Profile loaded successfully')
          const profileData: Profile = {
            first_name: data.first_name,
            last_name: data.last_name,
            avatar_url: data.avatar_url,
            email: data.email,
          }
          setProfile(profileData)
        }
      } else {
        console.log('No active session, profile cleared')
        setProfile(null)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fall back to email-only profile if session exists
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setProfile({
          first_name: null,
          last_name: null,
          avatar_url: null,
          email: session.user.email || null
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Successfully signed out')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error signing out')
    }
  }

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return profile?.email?.[0].toUpperCase() || '?'
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="font-semibold text-lg">
          Gift Registry
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          <Button asChild variant="ghost">
            <Link href="/find-registry">
              <Search className="h-4 w-4 mr-2" />
              Find Registry
            </Link>
          </Button>

          {!loading && (
            <>
              {profile ? (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/create-registry">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Registry
                    </Link>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[100px] truncate">
                          {profile.first_name || profile.email?.split('@')[0] || 'Profile'}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {profile.first_name && profile.last_name 
                              ? `${profile.first_name} ${profile.last_name}`
                              : 'My Account'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {profile.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <Home className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-registries">
                          <Gift className="h-4 w-4 mr-2" />
                          My Registries
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="text-red-500 focus:text-red-500 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/login">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
} 