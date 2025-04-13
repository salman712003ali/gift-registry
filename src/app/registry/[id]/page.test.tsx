import { render, screen, waitFor } from '@testing-library/react'
import { generateRegistry, generateGiftItem, generateContribution, generateComment } from '@/lib/test-utils'
import RegistryPage from './page'
import supabase from '@/lib/supabase'

// Mock the useParams hook
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useParams: () => ({ id: 'test-registry-id' }),
}))

describe('RegistryPage', () => {
  const mockRegistry = generateRegistry()
  const mockGiftItem = generateGiftItem()
  const mockContribution = generateContribution()
  const mockComment = generateComment()

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Mock Supabase responses
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: mockRegistry,
      error: null,
    })

    ;(supabase.from('gift_items').select as jest.Mock).mockResolvedValue({
      data: [mockGiftItem],
      error: null,
    })

    ;(supabase.from('contributions').select as jest.Mock).mockResolvedValue({
      data: [mockContribution],
      error: null,
    })

    ;(supabase.from('comments').select as jest.Mock).mockResolvedValue({
      data: [mockComment],
      error: null,
    })
  })

  it('renders registry details correctly', async () => {
    render(<RegistryPage />)

    // Wait for the registry data to load
    await waitFor(() => {
      expect(screen.getByText(mockRegistry.title)).toBeInTheDocument()
      expect(screen.getByText(mockRegistry.description)).toBeInTheDocument()
    })

    // Check if gift item is rendered
    expect(screen.getByText(mockGiftItem.name)).toBeInTheDocument()
    expect(screen.getByText(mockGiftItem.description)).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<RegistryPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles error state correctly', async () => {
    // Mock an error response
    ;(supabase.from('registries').select as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch registry' },
    })

    render(<RegistryPage />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('calculates contribution progress correctly', async () => {
    const giftItem = generateGiftItem({ price: 100 })
    const contribution = generateContribution({ amount: 50 })

    ;(supabase.from('gift_items').select as jest.Mock).mockResolvedValue({
      data: [giftItem],
      error: null,
    })

    ;(supabase.from('contributions').select as jest.Mock).mockResolvedValue({
      data: [contribution],
      error: null,
    })

    render(<RegistryPage />)

    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument()
    })
  })

  it('handles favorite toggling correctly', async () => {
    render(<RegistryPage />)

    await waitFor(() => {
      expect(screen.getByText(mockGiftItem.name)).toBeInTheDocument()
    })

    // Mock successful favorite toggle
    ;(supabase.from('favorites').insert as jest.Mock).mockResolvedValue({
      data: null,
      error: null,
    })

    // Find and click the favorite button
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    favoriteButton.click()

    await waitFor(() => {
      expect(supabase.from('favorites').insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        gift_item_id: mockGiftItem.id,
      })
    })
  })
}) 