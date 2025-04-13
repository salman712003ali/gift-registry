'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

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
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    message: ''
  })

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

      // Create the contribution
      const { error } = await supabase
        .from('contributions')
        .insert({
          gift_item_id: giftItemId,
          registry_id: registryId,
          amount: amount,
          contributor_name: formData.name || null,
          message: formData.message || null,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Contribution added successfully')
      
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

      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
        />
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