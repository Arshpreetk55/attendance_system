'use client'

import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm',
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  )
}