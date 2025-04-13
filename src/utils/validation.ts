interface RegistryData {
  occasion: string
  date: string
  description: string
  visibility: string
}

interface GiftItem {
  name: string
  description: string
  price: number
  quantity: number
  url?: string
}

export function validateRegistryData(data: RegistryData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data.occasion) {
    errors.occasion = 'Please select an occasion'
  }

  if (!data.date) {
    errors.date = 'Please select a date'
  } else {
    const selectedDate = new Date(data.date)
    const today = new Date()
    if (selectedDate < today) {
      errors.date = 'Date cannot be in the past'
    }
  }

  if (!data.description.trim()) {
    errors.description = 'Please provide a description'
  }

  if (!data.visibility) {
    errors.visibility = 'Please select a visibility option'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateGiftItem(item: GiftItem): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!item.name.trim()) {
    errors.name = 'Item name is required'
  }

  if (item.price <= 0) {
    errors.price = 'Price must be greater than 0'
  }

  if (item.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1'
  }

  if (item.url && !isValidUrl(item.url)) {
    errors.url = 'Please enter a valid URL'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
} 