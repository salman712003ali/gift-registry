'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface FormData {
  title: string;
  description: string;
  occasion: string;
  event_date: string;
  is_private: boolean;
  show_contributor_names: boolean;
  show_contribution_amounts: boolean;
  allow_partial_contributions: boolean;
  currency: string;
  status: string;
}

export default function CreateRegistryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    occasion: '',
    event_date: '',
    is_private: false,
    show_contributor_names: true,
    show_contribution_amounts: true,
    allow_partial_contributions: true,
    currency: 'USD',
    status: 'active'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to create a registry")
        return
      }

      // Ensure user exists in the profiles table
      const { error: userError } = await supabase
        .rpc('ensure_user_exists', { user_id: user.id })

      if (userError) {
        console.error('Error ensuring user exists:', userError)
        toast.error("Failed to create registry. Please try again.")
        return
      }

      // Format the event date
      const formattedDate = formData.event_date ? new Date(formData.event_date).toISOString() : null

      // Create the registry with the new schema
      const { data: registry, error: registryError } = await supabase
        .from('registries')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            occasion: formData.occasion,
            event_date: formattedDate,
            user_id: user.id,
            is_private: formData.is_private,
            show_contributor_names: formData.show_contributor_names,
            show_contribution_amounts: formData.show_contribution_amounts,
            allow_partial_contributions: formData.allow_partial_contributions,
            currency: formData.currency,
            status: formData.status
          }
        ])
        .select()
        .single()

      if (registryError) {
        console.error('Error creating registry:', registryError)
        toast.error("Failed to create registry. Please try again.")
        return
      }

      toast.success("Registry created successfully!")
      router.push(`/registry/${registry.id}`)
    } catch (error) {
      console.error('Error:', error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create a Gift Registry</h1>
          <p className="text-muted-foreground">
            Set up your registry to share with friends and family
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Registry Details</CardTitle>
              <CardDescription>
                Fill in the details for your gift registry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Registry Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Wedding Registry, Birthday Wishlist"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your registry or occasion"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Select
                  value={formData.occasion}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, occasion: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="baby_shower">Baby Shower</SelectItem>
                    <SelectItem value="housewarming">Housewarming</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date</Label>
                <Input
                  id="event_date"
                  name="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Privacy Settings</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_private"
                    name="is_private"
                    checked={formData.is_private}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_private" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Make this registry private
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contribution Settings</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_contributor_names"
                    name="show_contributor_names"
                    checked={formData.show_contributor_names}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="show_contributor_names" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Show contributor names on the registry
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_contribution_amounts"
                    name="show_contribution_amounts"
                    checked={formData.show_contribution_amounts}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="show_contribution_amounts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Show contribution amounts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_partial_contributions"
                    name="allow_partial_contributions"
                    checked={formData.allow_partial_contributions}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="allow_partial_contributions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Allow partial contributions to gifts
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Registry'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 