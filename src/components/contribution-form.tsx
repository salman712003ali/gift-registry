'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Session } from '@supabase/supabase-js'

interface ContributionFormProps {
  giftItemId: string
  registryId: string
  onContributionAdded?: () => void
  onCancel?: () => void
}

export function ContributionForm({ 
  giftItemId, 
  registryId, 
  onContributionAdded,
  onCancel 
}: ContributionFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    message: ''
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate amount
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }

      console.log('Starting contribution submission...', {
        amount,
        giftItemId,
        registryId,
        isAnonymous
      })

      // Get user's profile if authenticated
      let profile = null
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('Error fetching profile:', profileError)
          throw new Error('Failed to fetch user profile')
        }
        
        profile = profileData
        console.log('Fetched profile:', profile)
      }

      // Prepare contribution data
      const contributionData = {
        gift_item_id: giftItemId,
        registry_id: registryId,
        amount: amount,
        message: formData.message || null,
        created_at: new Date().toISOString(),
        user_id: isAnonymous ? null : session?.user?.id || null,
        profile_id: isAnonymous ? null : session?.user?.id || null,
        contributor_name: isAnonymous 
          ? 'Anonymous' 
          : session?.user
            ? (profile?.full_name || 
               `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
               session.user.email || 
               'Anonymous')
            : (formData.name || 'Anonymous'),
        is_anonymous: isAnonymous
      }

      console.log('Contributing as:', contributionData.contributor_name)
      console.log('Is anonymous:', isAnonymous)
      console.log('Has session:', !!session?.user)

      // Create the contribution
      const { data: newContribution, error } = await supabase
        .from('contributions')
        .insert(contributionData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Contribution created successfully:', newContribution)

      toast.success('Contribution added successfully')
      
      // Reset form
      setFormData({
        amount: '',
        name: '',
        message: ''
      })
      
      // Call the onContributionAdded callback if provided
      if (onContributionAdded) {
        onContributionAdded()
      }
    } catch (error: any) {
      console.error('Error adding contribution:', error)
      toast.error(error.message || 'Failed to add contribution')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Contribution Amount (₹)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="isAnonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isAnonymous">Make contribution anonymous</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Add a message with your contribution"
          rows={3}
        />
      </div>

      {!isAnonymous && !session?.user && (
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required={!isAnonymous}
          />
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Contributing...' : 'Contribute'}
        </Button>
      </div>
    </form>
  )
} 