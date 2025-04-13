'use client'

import { AuthProvider } from '@/hooks/use-auth'
import { Nav } from './nav'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Nav />
      <main className="min-h-screen">
        {children}
      </main>
    </AuthProvider>
  )
} 