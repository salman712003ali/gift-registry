'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface CoOwner {
  profile_id: string
  permissions: {
    can_edit: boolean
    can_delete: boolean
  }
  profile: {
    email: string
    full_name: string
  }
}

interface CoOwnersProps {
  registryId: string
  isOwner: boolean
}

export function CoOwners({ registryId, isOwner }: CoOwnersProps) {
  const [loading, setLoading] = useState(true)
  const [coOwners, setCoOwners] = useState<CoOwner[]>([])
  const [email, setEmail] = useState('')
  const [addingCoOwner, setAddingCoOwner] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCoOwners()
  }, [registryId])

  const fetchCoOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('registry_co_owners')
        .select(`
          profile_id,
          permissions,
          profile:profiles (
            email,
            full_name
          )
        `)
        .eq('registry_id', registryId)

      if (error) throw error

      setCoOwners(data as CoOwner[])
    } catch (error) {
      console.error('Error fetching co-owners:', error)
      toast.error('Failed to load co-owners')
    } finally {
      setLoading(false)
    }
  }

  const addCoOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingCoOwner(true)

    try {
      // First, find the profile by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single()

      if (profileError) throw new Error('User not found')

      // Add co-owner
      const { error } = await supabase
        .from('registry_co_owners')
        .insert({
          registry_id: registryId,
          profile_id: profiles.id,
          permissions: {
            can_edit: true,
            can_delete: false
          }
        })

      if (error) throw error

      toast.success('Co-owner added successfully')
      setEmail('')
      fetchCoOwners()
    } catch (error) {
      console.error('Error adding co-owner:', error)
      toast.error('Failed to add co-owner')
    } finally {
      setAddingCoOwner(false)
    }
  }

  const updatePermissions = async (profileId: string, permissions: CoOwner['permissions']) => {
    try {
      const { error } = await supabase
        .from('registry_co_owners')
        .update({ permissions })
        .eq('registry_id', registryId)
        .eq('profile_id', profileId)

      if (error) throw error

      setCoOwners(current =>
        current.map(co =>
          co.profile_id === profileId
            ? { ...co, permissions }
            : co
        )
      )

      toast.success('Permissions updated')
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    }
  }

  const removeCoOwner = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('registry_co_owners')
        .delete()
        .eq('registry_id', registryId)
        .eq('profile_id', profileId)

      if (error) throw error

      setCoOwners(current =>
        current.filter(co => co.profile_id !== profileId)
      )

      toast.success('Co-owner removed')
    } catch (error) {
      console.error('Error removing co-owner:', error)
      toast.error('Failed to remove co-owner')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Co-Owners</CardTitle>
        <CardDescription>
          Manage who can edit and contribute to this registry
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isOwner && (
          <form onSubmit={addCoOwner} className="space-y-4 mb-6">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={addingCoOwner}>
                {addingCoOwner ? <LoadingSpinner size="sm" /> : 'Add'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {coOwners.map((coOwner) => (
            <div
              key={coOwner.profile_id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{coOwner.profile.full_name}</p>
                <p className="text-sm text-gray-500">{coOwner.profile.email}</p>
              </div>
              {isOwner && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={coOwner.permissions.can_edit}
                      onCheckedChange={(checked) =>
                        updatePermissions(coOwner.profile_id, {
                          ...coOwner.permissions,
                          can_edit: checked
                        })
                      }
                    />
                    <Label>Can Edit</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={coOwner.permissions.can_delete}
                      onCheckedChange={(checked) =>
                        updatePermissions(coOwner.profile_id, {
                          ...coOwner.permissions,
                          can_delete: checked
                        })
                      }
                    />
                    <Label>Can Delete</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCoOwner(coOwner.profile_id)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}

          {coOwners.length === 0 && (
            <p className="text-center text-gray-500">
              No co-owners added yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 