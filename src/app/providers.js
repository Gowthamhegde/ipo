'use client'

import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { useState } from 'react'
import { IPOProvider } from '../contexts/IPOContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { AuthProvider } from '../contexts/AuthContext'

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error.status === 404 || error.status === 403) {
            return false
          }
          return failureCount < 3
        },
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IPOProvider>
          <NotificationProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </NotificationProvider>
        </IPOProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}