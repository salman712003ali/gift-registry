'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface UserPreferences {
  email_notifications: boolean
  contribution_notifications: boolean
  registry_updates: boolean
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    contribution_notifications: true,
    registry_updates: true,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      fetchPreferences()
    }

    checkSession()
  }, [router, supabase])

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data?.preferences) {
        setPreferences(data.preferences)
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const updatedPreferences = { ...preferences, [key]: value }
      setPreferences(updatedPreferences)

      const { error } = await supabase
        .from('users')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Preferences updated successfully')
    } catch (error: any) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
      // Revert the change on error
      setPreferences(prev => ({ ...prev, [key]: !value }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive email notifications about your registries
              </p>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Contribution Notifications</Label>
              <p className="text-sm text-gray-500">
                Get notified when someone contributes to your registry
              </p>
            </div>
            <Switch
              checked={preferences.contribution_notifications}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('contribution_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registry Updates</Label>
              <p className="text-sm text-gray-500">
                Stay informed about updates to your registries
              </p>
            </div>
            <Switch
              checked={preferences.registry_updates}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('registry_updates', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 