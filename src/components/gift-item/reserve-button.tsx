'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { User } from '@supabase/supabase-js'

interface ReserveButtonProps {
  giftItemId: string
  isReserved: boolean
  reservedBy?: string
  reservationExpiresAt?: string
  onReservationChange?: () => void
}

export function ReserveButton({
  giftItemId,
  isReserved,
  reservedBy,
  reservationExpiresAt,
  onReservationChange
}: ReserveButtonProps) {
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReserve = async () => {
    setLoading(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Please sign in to reserve items')
        return
      }

      const { error } = await supabase
        .from('gift_items')
        .update({
          reserved_by: isReserved ? null : session.user.id,
          reservation_expires_at: isReserved ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', giftItemId)

      if (error) throw error

      toast.success(isReserved ? 'Item unreserved' : 'Item reserved for 24 hours')
      if (onReservationChange) {
        onReservationChange()
      }
    } catch (error) {
      console.error('Error reserving item:', error)
      toast.error('Failed to update reservation')
    } finally {
      setLoading(false)
    }
  }

  const isExpired = reservationExpiresAt && new Date(reservationExpiresAt) < new Date()

  return (
    <Button
      variant={isReserved && !isExpired ? "secondary" : "default"}
      onClick={handleReserve}
      disabled={loading || (isReserved && reservedBy !== currentUser?.id)}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : isReserved && !isExpired ? (
        'Cancel Reservation'
      ) : (
        'Reserve Item'
      )}
    </Button>
  )
} 