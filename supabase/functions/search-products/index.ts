import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface SearchResult {
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

interface RetailerConfig {
  name: string
  apiKey: string
  baseUrl: string
}

const RETAILERS: RetailerConfig[] = [
  {
    name: 'Amazon',
    apiKey: Deno.env.get('AMAZON_API_KEY') || '',
    baseUrl: 'https://api.rainforestapi.com/request'
  },
  {
    name: 'Target',
    apiKey: Deno.env.get('TARGET_API_KEY') || '',
    baseUrl: 'https://api.target.com/products/v3/search'
  },
  {
    name: 'Walmart',
    apiKey: Deno.env.get('WALMART_API_KEY') || '',
    baseUrl: 'https://api.walmart.com/v3/items/search'
  }
]

async function searchAmazon(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    api_key: RETAILERS[0].apiKey,
    type: 'search',
    amazon_domain: 'amazon.com',
    search_term: query
  })

  try {
    const response = await fetch(`${RETAILERS[0].baseUrl}?${params}`)
    const data = await response.json()

    return data.search_results.map((item: any) => ({
      id: item.asin,
      title: item.title,
      description: item.description || '',
      price: parseFloat(item.price.value) || 0,
      image_url: item.image,
      retailer: 'Amazon',
      url: item.link,
      rating: item.rating,
      reviews_count: item.reviews_total,
      availability: item.availability?.status
    }))
  } catch (error) {
    console.error('Amazon search error:', error)
    return []
  }
}

async function searchTarget(query: string): Promise<SearchResult[]> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RETAILERS[1].apiKey}`
  }

  try {
    const response = await fetch(`${RETAILERS[1].baseUrl}?keyword=${query}`, { headers })
    const data = await response.json()

    return data.data.map((item: any) => ({
      id: item.tcin,
      title: item.item.product_description.title,
      description: item.item.product_description.downstream_description,
      price: item.price.current_retail,
      image_url: item.item.enrichment.images.primary_image_url,
      retailer: 'Target',
      url: `https://www.target.com/p/-/A-${item.tcin}`,
      category: item.item.product_classification.category_name
    }))
  } catch (error) {
    console.error('Target search error:', error)
    return []
  }
}

async function searchWalmart(query: string): Promise<SearchResult[]> {
  const headers = {
    'Content-Type': 'application/json',
    'WM_SEC.ACCESS_TOKEN': RETAILERS[2].apiKey
  }

  try {
    const response = await fetch(`${RETAILERS[2].baseUrl}?query=${query}`, { headers })
    const data = await response.json()

    return data.items.map((item: any) => ({
      id: item.itemId,
      title: item.name,
      description: item.shortDescription,
      price: item.salePrice,
      image_url: item.largeImage,
      retailer: 'Walmart',
      url: item.productUrl,
      category: item.categoryPath,
      brand: item.brandName
    }))
  } catch (error) {
    console.error('Walmart search error:', error)
    return []
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Search across all retailers in parallel
    const results = await Promise.all([
      searchAmazon(query),
      searchTarget(query),
      searchWalmart(query)
    ])

    // Combine and sort results
    const allResults = results.flat()
      .sort((a, b) => {
        // Sort by a combination of price and rating (if available)
        const aScore = (a.rating || 0) * 0.5 + (1 / a.price) * 0.5
        const bScore = (b.rating || 0) * 0.5 + (1 / b.price) * 0.5
        return bScore - aScore
      })
      .slice(0, 30) // Limit to top 30 results

    return new Response(
      JSON.stringify(allResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 