import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { Toaster } from 'sonner'

function render(ui: React.ReactElement, { ...renderOptions } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock data generators
const generateRegistry = (overrides = {}) => ({
  id: 'test-registry-id',
  title: 'Test Registry',
  description: 'Test Description',
  occasion: 'wedding',
  event_date: '2024-12-31',
  user_id: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z',
  privacy_settings: {
    is_private: false,
    show_contributor_names: true,
    allow_anonymous_contributions: false,
  },
  ...overrides,
})

const generateGiftItem = (overrides = {}) => ({
  id: 'test-gift-item-id',
  name: 'Test Gift',
  description: 'Test Gift Description',
  price: 100,
  quantity: 1,
  registry_id: 'test-registry-id',
  created_at: '2024-01-01T00:00:00Z',
  is_favorite: false,
  ...overrides,
})

const generateContribution = (overrides = {}) => ({
  id: 'test-contribution-id',
  gift_item_id: 'test-gift-item-id',
  user_id: 'test-user-id',
  amount: 50,
  message: 'Test contribution message',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const generateComment = (overrides = {}) => ({
  id: 'test-comment-id',
  gift_item_id: 'test-gift-item-id',
  user_id: 'test-user-id',
  content: 'Test comment',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Mock Supabase responses
const mockSupabaseResponse = {
  data: null,
  error: null,
}

const mockSupabaseError = (message: string) => ({
  data: null,
  error: { message },
})

export {
  render,
  generateRegistry,
  generateGiftItem,
  generateContribution,
  generateComment,
  mockSupabaseResponse,
  mockSupabaseError,
} 