'use client'

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CommentForm } from './comment-form'

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
}

interface CommentsListProps {
  comments: Comment[]
  className?: string
  giftItemId: string
}

export function CommentsList({ comments, className, giftItemId }: CommentsListProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <CommentForm giftItemId={giftItemId} />
      
      <div className={cn("space-y-4", className)}>
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="flex items-start gap-4 p-4">
              <Avatar>
                <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                <AvatarFallback>
                  {comment.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{comment.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{comment.content}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground">No comments yet</p>
        )}
      </div>
    </div>
  )
} 