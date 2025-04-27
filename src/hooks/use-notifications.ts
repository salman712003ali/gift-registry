import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { PostgrestResponse } from '@supabase/supabase-js'

export interface Notification {
  id: string
  type: string
  content: string
  read: boolean
  user_id: string
  registry_id?: string
  contribution_id?: string
  created_at: string
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setNotifications(data as Notification[])
      } catch (err) {
        setError(err as Error)
        toast.error('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((current) => [newNotification, ...current])
          toast.info(newNotification.content)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications((current) =>
        current.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    } catch (err) {
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)

      if (error) throw error

      setNotifications((current) =>
        current.map((n) => ({ ...n, read: true }))
      )
    } catch (err) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications((current) =>
        current.filter((n) => n.id !== notificationId)
      )
    } catch (err) {
      toast.error('Failed to delete notification')
    }
  }

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
} 