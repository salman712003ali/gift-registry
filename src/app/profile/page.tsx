'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  notification_preferences: {
    email_notifications: boolean
    contribution_notifications: boolean
    registry_updates: boolean
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setProfile(profile)
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: profile.email
      }))
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name
        })
        .eq('id', profile?.id)

      if (error) throw error
      toast.success('Profile updated successfully')
      fetchProfile()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message)
    }
  }

  const handlePasswordChange = async () => {
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.new_password
      })

      if (error) throw error
      toast.success('Password updated successfully')
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message)
    }
  }

  const handleNotificationPreferenceChange = async (key: string, value: boolean) => {
    try {
      const newPreferences = {
        ...profile?.notification_preferences,
        [key]: value
      }

      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: newPreferences })
        .eq('id', profile?.id)

      if (error) throw error
      toast.success('Notification preferences updated')
      fetchProfile()
    } catch (error: any) {
      console.error('Error updating notification preferences:', error)
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="container py-8">Loading...</div>
  }

  if (!profile) {
    return <div className="container py-8">Profile not found</div>
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                />
              </div>

              <Button onClick={handleProfileUpdate}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                />
              </div>

              <Button onClick={handlePasswordChange}>
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage your notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.email_notifications}
                  onCheckedChange={(checked) => 
                    handleNotificationPreferenceChange('email_notifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Contribution Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone contributes to your registry
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.contribution_notifications}
                  onCheckedChange={(checked) => 
                    handleNotificationPreferenceChange('contribution_notifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registry Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about registry updates
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.registry_updates}
                  onCheckedChange={(checked) => 
                    handleNotificationPreferenceChange('registry_updates', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 