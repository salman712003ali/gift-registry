"use client"

import { useState } from 'react'
import Link from 'next/link'
import { formatDistance } from 'date-fns'
import { Gift, Calendar, Eye, Lock, Users, DollarSign, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'

interface Registry {
  id: string
  title: string
  description: string
  event_date: string
  created_at: string
  is_private: boolean
  total_items?: number
  funded_percent?: number
  total_contribution_amount?: number
  owner_name?: string
  owner_avatar?: string
  cover_image?: string
}

interface RegistryCardProps {
  registry: Registry
  showActions?: boolean
}

export function RegistryCard({ registry, showActions = true }: RegistryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const hasDate = !!registry.event_date
  const eventDate = hasDate ? new Date(registry.event_date) : null
  const timeago = formatDistance(
    new Date(registry.created_at),
    new Date(),
    { addSuffix: true }
  )
  
  const defaultCoverImages = [
    '/images/gift-cover-1.jpg',
    '/images/gift-cover-2.jpg',
    '/images/gift-cover-3.jpg',
  ]
  
  // Use a deterministic image based on registry ID
  const defaultCoverIndex = registry.id.charCodeAt(0) % defaultCoverImages.length
  const coverImage = registry.cover_image || defaultCoverImages[defaultCoverIndex]
  
  return (
    <div 
      className="feature-card overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          style={{ backgroundImage: `url(${coverImage || '/images/gift-placeholder.jpg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        
        {registry.is_private && (
          <Badge variant="outline" className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
            <Lock className="h-3 w-3 mr-1" />
            Private
          </Badge>
        )}
        
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-bold text-white truncate">{registry.title}</h3>
          {registry.owner_name && (
            <div className="flex items-center gap-2 mt-1">
              {registry.owner_avatar ? (
                <img 
                  src={registry.owner_avatar} 
                  alt={registry.owner_name} 
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <Users className="w-4 h-4 text-white/80" />
              )}
              <span className="text-sm text-white/80">{registry.owner_name}</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-muted-foreground line-clamp-2 text-sm mb-4 h-10">
        {registry.description || 'No description provided.'}
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{eventDate ? eventDate.toLocaleDateString() : 'No date set'}</span>
          </div>
          <span className="text-xs text-muted-foreground">Created {timeago}</span>
        </div>
        
        {registry.funded_percent !== undefined && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Funding progress</span>
              <span>{Math.round(registry.funded_percent)}%</span>
            </div>
            <Progress value={registry.funded_percent} className="h-1" />
            {registry.total_contribution_amount !== undefined && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(registry.total_contribution_amount || 0)}</span>
                <span>{registry.total_items || 0} items</span>
              </div>
            )}
          </div>
        )}
        
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button asChild className="w-full button-glow" size="sm">
              <Link href={`/registry/${registry.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/registry/${registry.id}/contribute`}>
                <Gift className="h-4 w-4 mr-2" />
                Contribute
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 