'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface GiftItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  url?: string
  image_url?: string
  registry_id: string
  created_at: string
  contributions?: Contribution[]
}

interface Contribution {
  id: string
  amount: number
  contributor_name: string
  contributor_email: string
  message?: string
  created_at: string
}

interface Registry {
  id: string
  title: string
  description: string
  occasion: string
  date: string
  privacy_settings: string
  user_id: string
}

export default function PublicRegistryPage({ params }: { params: { id: string } }) {
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [items, setItems] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributorName, setContributorName] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')
  const [contributorMessage, setContributorMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRegistry()
    fetchItems()
  }, [params.id])

  const fetchRegistry = async () => {
    try {
      console.log('Fetching registry:', params.id)
      const { data, error } = await supabase
        .from('registries')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching registry:', error)
        throw error
      }
      console.log('Fetched registry:', data)
      setRegistry(data)
    } catch (error: any) {
      console.error('Error in fetchRegistry:', error)
      toast.error('Failed to load registry')
      router.push('/')
    }
  }

  const fetchItems = async () => {
    try {
      console.log('Fetching items for registry:', params.id)
      const { data, error } = await supabase
        .from('gift_items')
        .select(`
          *,
          contributions (
            id,
            amount,
            contributor_name,
            contributor_email,
            message,
            created_at
          )
        `)
        .eq('registry_id', params.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched items:', data)
      setItems(data || [])
    } catch (error: any) {
      console.error('Error in fetchItems:', error)
      toast.error('Failed to load gift items')
    } finally {
      setLoading(false)
    }
  }

  const handleContribution = async () => {
    if (!selectedItem) return

    try {
      // First, add the contribution
      const { data: contribution, error: contributionError } = await supabase
        .from('contributions')
        .insert({
          gift_item_id: selectedItem.id,
          registry_id: params.id,
          amount: parseFloat(contributionAmount),
          contributor_name: contributorName,
          contributor_email: contributorEmail,
          message: contributorMessage,
        })
        .select()
        .single()

      if (contributionError) throw contributionError

      // Then, send notification
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contribution',
          userId: registry?.user_id,
          registryId: params.id,
          itemId: selectedItem.id,
          contributorName,
          amount: parseFloat(contributionAmount),
        }),
      })

      if (!response.ok) {
        console.error('Failed to send notification:', await response.text())
        // Don't throw error here, as the contribution was successful
      }

      toast.success('Contribution added successfully')
      setIsContributionDialogOpen(false)
      setContributionAmount('')
      setContributorName('')
      setContributorEmail('')
      setContributorMessage('')
      fetchItems() // Refresh items to show new contribution
    } catch (error: any) {
      console.error('Error adding contribution:', error)
      toast.error('Failed to add contribution')
    }
  }

  const openContributionDialog = (item: GiftItem) => {
    setSelectedItem(item)
    setContributionAmount(item.price.toString())
    setIsContributionDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!registry) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{registry.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{registry.description}</p>
          <div className="flex justify-center space-x-4 text-gray-500">
            <span>{registry.occasion}</span>
            <span>•</span>
            <span>{new Date(registry.date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 space-y-4"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="font-medium">₹{item.price}</p>
                <p className="text-sm">Quantity: {item.quantity}</p>
                {item.contributions && item.contributions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Contributions:</p>
                    <ul className="text-sm text-gray-600">
                      {item.contributions.map((contribution) => (
                        <li key={contribution.id}>
                          {contribution.contributor_name}: ₹{contribution.amount}
                          {contribution.message && (
                            <span className="block text-xs text-gray-500">
                              "{contribution.message}"
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View Item
                  </a>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => openContributionDialog(item)}
              >
                Contribute
              </Button>
            </div>
          ))}
        </div>

        <Dialog
          open={isContributionDialogOpen}
          onOpenChange={setIsContributionDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make a Contribution</DialogTitle>
              <DialogDescription>
                Contribute to {selectedItem?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Contribution Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  value={contributorMessage}
                  onChange={(e) => setContributorMessage(e.target.value)}
                  placeholder="Enter a message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsContributionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleContribution}>Contribute</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 