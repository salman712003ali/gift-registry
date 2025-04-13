'use client'

import { AuthProvider } from '@/hooks/use-auth'
import { Nav } from './nav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Nav />
      <main className="min-h-screen">
        {children}
      </main>
    </AuthProvider>
  )
} 