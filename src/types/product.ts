export interface Product {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  retailer: string
  url: string
  category?: string
  brand?: string
  rating?: number
  reviews_count?: number
  availability?: string
  shipping_info?: string
} 