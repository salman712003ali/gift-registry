import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { generateRegistry } from '@/lib/test-utils'
import GiftItemForm from './gift-item-form'
import supabase from '@/lib/supabase'

describe('GiftItemForm', () => {
  const mockRegistry = generateRegistry()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated user
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
  })

  it('renders form fields correctly', () => {
    render(<GiftItemForm registryId={mockRegistry.id} />)
    
    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/product url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add gift item/i })).toBeInTheDocument()
  })

  it('submits form with correct data', async () => {
    // Mock successful gift item creation
    ;(supabase.from('gift_items').insert as jest.Mock).mockResolvedValue({
      data: { id: 'new-gift-item-id' },
      error: null,
    })

    render(<GiftItemForm registryId={mockRegistry.id} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Test Gift Item' },
    })
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' },
    })
    fireEvent.change(screen.getByLabelText(/product url/i), {
      target: { value: 'https://example.com/product' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add gift item/i }))
    
    // Check if Supabase was called with correct data
    await waitFor(() => {
      expect(supabase.from('gift_items').insert).toHaveBeenCalledWith({
        name: 'Test Gift Item',
        price: 100,
        quantity: 2,
        description: 'Test description',
        product_url: 'https://example.com/product',
        registry_id: mockRegistry.id,
      })
    })
  })

  it('validates required fields', async () => {
    render(<GiftItemForm registryId={mockRegistry.id} />)
    
    // Submit the form without filling in required fields
    fireEvent.click(screen.getByRole('button', { name: /add gift item/i }))
    
    // Check if validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/price is required/i)).toBeInTheDocument()
      expect(screen.getByText(/quantity is required/i)).toBeInTheDocument()
    })
  })

  it('validates numeric fields', async () => {
    render(<GiftItemForm registryId={mockRegistry.id} />)
    
    // Fill in the form with invalid numeric values
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: 'abc' },
    })
    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: '-1' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add gift item/i }))
    
    // Check if validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/price must be a positive number/i)).toBeInTheDocument()
      expect(screen.getByText(/quantity must be a positive number/i)).toBeInTheDocument()
    })
  })

  it('handles submission error correctly', async () => {
    // Mock failed gift item creation
    ;(supabase.from('gift_items').insert as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to create gift item' },
    })

    render(<GiftItemForm registryId={mockRegistry.id} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Test Gift Item' },
    })
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: '1' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add gift item/i }))
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to create gift item/i)).toBeInTheDocument()
    })
  })
}) 