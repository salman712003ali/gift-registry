import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from './page'
import supabase from '@/lib/supabase'

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('LoginPage', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles form submission correctly', async () => {
    // Mock successful login
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })

    render(<LoginPage />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    // Check if Supabase auth was called with correct credentials
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
    
    // Check if user was redirected to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
  })

  it('displays error message on login failure', async () => {
    // Mock failed login
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginPage />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })

  it('navigates to signup page when signup link is clicked', () => {
    render(<LoginPage />)
    
    fireEvent.click(screen.getByText(/don't have an account/i))
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/signup')
  })
}) 