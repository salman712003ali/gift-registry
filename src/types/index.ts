export interface GiftItem {
  id: string
  registry_id: string
  name: string
  description: string
  price: number
  quantity: number
  url?: string
  is_purchased: boolean
  created_at: string
  updated_at: string
} 