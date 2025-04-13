'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CommentFormProps {
  giftItemId: string
  onCommentAdded?: () => void
}

export function CommentForm({ giftItemId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to add a comment')
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            content: content.trim(),
            gift_item_id: giftItemId,
            user_id: user.id,
          },
        ])

      if (error) throw error

      setContent('')
      toast.success('Comment added successfully')
      onCommentAdded?.()
    } catch (error: any) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="min-h-[100px]"
      />
      <Button type="submit" disabled={isSubmitting || !content.trim()}>
        {isSubmitting ? 'Adding...' : 'Add Comment'}
      </Button>
    </form>
  )
} 