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
import { ContributionsList } from '@/components/contributions-list'
import { GiftItemForm } from '@/components/gift-item-form'
import { toast } from 'sonner'

interface Registry {
  id: string
  title: string
  description: string
  occasion: string
  event_date: string
  is_private: boolean
  privacy_settings: {
    visibility: 'public' | 'private'
    password: string | null
    require_contributor_info: boolean
    show_contributor_names: boolean
    allow_anonymous_contributions: boolean
  }
}

interface GiftItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  url: string
  total_contributed: number
}

export default function RegistrySettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [giftItems, setGiftItems] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    visibility: 'public',
    password: '',
    require_contributor_info: true,
    show_contributor_names: true,
    allow_anonymous_contributions: false
  })

  useEffect(() => {
    fetchRegistry()
  }, [params.id])

  const fetchRegistry = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: registry, error: registryError } = await supabase
        .from('registries')
        .select('*')
        .eq('id', params.id)
        .single()

      if (registryError) throw registryError

      if (!registry) {
        toast.error('Registry not found')
        router.push('/')
        return
      }

      // Check if user is the owner
      setIsOwner(registry.user_id === session.user.id)
      if (!isOwner) {
        toast.error('You do not have permission to access these settings')
        router.push(`/registry/${params.id}`)
        return
      }

      setRegistry(registry)
      setPrivacySettings(registry.privacy_settings)

      // Fetch gift items
      const { data: items, error: itemsError } = await supabase
        .from('gift_items')
        .select('*')
        .eq('registry_id', params.id)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      setGiftItems(items)
    } catch (error: any) {
      console.error('Error fetching registry:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacySettingChange = async (key: string, value: any) => {
    try {
      const newSettings = { ...privacySettings, [key]: value }
      setPrivacySettings(newSettings)

      const { error } = await supabase
        .from('registries')
        .update({ privacy_settings: newSettings })
        .eq('id', params.id)

      if (error) throw error
      toast.success('Privacy settings updated')
    } catch (error: any) {
      console.error('Error updating privacy settings:', error)
      toast.error(error.message)
    }
  }

  const handleDeleteRegistry = async () => {
    if (!confirm('Are you sure you want to delete this registry? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('registries')
        .delete()
        .eq('id', params.id)

      if (error) throw error
      toast.success('Registry deleted successfully')
      router.push('/')
    } catch (error: any) {
      console.error('Error deleting registry:', error)
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="container py-8">Loading...</div>
  }

  if (!registry) {
    return <div className="container py-8">Registry not found</div>
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{registry.title}</h1>
          <p className="text-muted-foreground">{registry.description}</p>
        </div>
        <Button variant="destructive" onClick={handleDeleteRegistry}>
          Delete Registry
        </Button>
      </div>

      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
          <TabsTrigger value="gifts">Gift Items</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can view and contribute to your registry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Private Registry</Label>
                  <p className="text-sm text-muted-foreground">
                    Only people with the link can view this registry
                  </p>
                </div>
                <Switch
                  checked={privacySettings.visibility === 'private'}
                  onCheckedChange={(checked) => 
                    handlePrivacySettingChange('visibility', checked ? 'private' : 'public')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Contributor Information</Label>
                  <p className="text-sm text-muted-foreground">
                    Contributors must provide their name and email
                  </p>
                </div>
                <Switch
                  checked={privacySettings.require_contributor_info}
                  onCheckedChange={(checked) => 
                    handlePrivacySettingChange('require_contributor_info', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Contributor Names</Label>
                  <p className="text-sm text-muted-foreground">
                    Display contributor names on the registry page
                  </p>
                </div>
                <Switch
                  checked={privacySettings.show_contributor_names}
                  onCheckedChange={(checked) => 
                    handlePrivacySettingChange('show_contributor_names', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Anonymous Contributions</Label>
                  <p className="text-sm text-muted-foreground">
                    Contributors can contribute without providing their information
                  </p>
                </div>
                <Switch
                  checked={privacySettings.allow_anonymous_contributions}
                  onCheckedChange={(checked) => 
                    handlePrivacySettingChange('allow_anonymous_contributions', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gifts">
          <Card>
            <CardHeader>
              <CardTitle>Gift Items</CardTitle>
              <CardDescription>
                Manage the items in your registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GiftItemForm registryId={params.id} onItemAdded={fetchRegistry} />
              
              <div className="mt-8 space-y-4">
                {giftItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-sm">Price: ₹{item.price}</p>
                          <p className="text-sm">Quantity: {item.quantity}</p>
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              View Product
                            </a>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{item.total_contributed} contributed</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((item.total_contributed / (item.price * item.quantity)) * 100)}% funded
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contributions</CardTitle>
              <CardDescription>
                View all contributions to your registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionsList registryId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 