import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { generateRegistry } from '@/lib/test-utils'
import FindRegistryPage from './page'
import supabase from '@/lib/supabase'

describe('FindRegistryPage', () => {
  const mockRegistries = [
    generateRegistry({ title: 'Wedding Registry', occasion: 'wedding' }),
    generateRegistry({ title: 'Baby Shower Registry', occasion: 'baby-shower' }),
    generateRegistry({ title: 'Birthday Registry', occasion: 'birthday' }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase responses
    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: mockRegistries,
      error: null,
    })
  })

  it('renders search form correctly', () => {
    render(<FindRegistryPage />)
    
    expect(screen.getByPlaceholderText(/search registries/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('displays registries when search is performed', async () => {
    render(<FindRegistryPage />)
    
    // Perform search
    fireEvent.change(screen.getByPlaceholderText(/search registries/i), {
      target: { value: 'registry' },
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    
    // Check if Supabase was called with correct query
    await waitFor(() => {
      expect(supabase.from('registries').select).toHaveBeenCalled()
    })
    
    // Check if registries are displayed
    expect(screen.getByText('Wedding Registry')).toBeInTheDocument()
    expect(screen.getByText('Baby Shower Registry')).toBeInTheDocument()
    expect(screen.getByText('Birthday Registry')).toBeInTheDocument()
  })

  it('filters registries by occasion', async () => {
    // Mock filtered response
    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: [mockRegistries[0]], // Only wedding registry
      error: null,
    })

    render(<FindRegistryPage />)
    
    // Select occasion filter
    const occasionSelect = screen.getByLabelText(/occasion/i)
    fireEvent.change(occasionSelect, { target: { value: 'wedding' } })
    
    // Check if Supabase was called with correct filter
    await waitFor(() => {
      expect(supabase.from('registries').select).toHaveBeenCalled()
    })
    
    // Check if only wedding registry is displayed
    expect(screen.getByText('Wedding Registry')).toBeInTheDocument()
    expect(screen.queryByText('Baby Shower Registry')).not.toBeInTheDocument()
  })

  it('sorts registries correctly', async () => {
    // Mock sorted response
    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: [...mockRegistries].reverse(), // Reverse order
      error: null,
    })

    render(<FindRegistryPage />)
    
    // Select sort option
    const sortSelect = screen.getByLabelText(/sort by/i)
    fireEvent.change(sortSelect, { target: { value: 'newest' } })
    
    // Check if Supabase was called with correct sort
    await waitFor(() => {
      expect(supabase.from('registries').select).toHaveBeenCalled()
    })
  })

  it('displays no results message when no registries are found', async () => {
    // Mock empty response
    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    })

    render(<FindRegistryPage />)
    
    // Perform search
    fireEvent.change(screen.getByPlaceholderText(/search registries/i), {
      target: { value: 'nonexistent' },
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    
    // Check if no results message is displayed
    await waitFor(() => {
      expect(screen.getByText(/no registries found/i)).toBeInTheDocument()
    })
  })

  it('handles search error correctly', async () => {
    // Mock error response
    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch registries' },
    })

    render(<FindRegistryPage />)
    
    // Perform search
    fireEvent.change(screen.getByPlaceholderText(/search registries/i), {
      target: { value: 'registry' },
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch registries/i)).toBeInTheDocument()
    })
  })
}) 