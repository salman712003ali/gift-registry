"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { CommentsList } from "@/components/comments-list"
import { CommentForm } from "@/components/comment-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Profile {
  full_name: string | null
  avatar_url: string | null
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string | undefined
  content: string
  createdAt: string
}

interface CommentsSectionProps {
  giftItemId: string
  className?: string
}

export function CommentsSection({ giftItemId, className }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("gift_item_id", giftItemId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedComments: Comment[] = data.map((comment) => {
        const profile = comment.profiles as unknown as Profile
        return {
          id: comment.id,
          userId: comment.user_id,
          userName: profile?.full_name || "Anonymous",
          userAvatar: profile?.avatar_url || undefined,
          content: comment.content,
          createdAt: comment.created_at,
        }
      })

      setComments(formattedComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [giftItemId])

  const handleCommentAdded = () => {
    fetchComments()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommentForm giftItemId={giftItemId} onCommentAdded={handleCommentAdded} />
        <CommentsList comments={comments} giftItemId={giftItemId} />
      </CardContent>
    </Card>
  )
} 