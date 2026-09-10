'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@pc-platform/ui';
import { configureApiClient } from '@pc-platform/api-client';

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    configureApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
      getToken: () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('nexus_admin_token');
        }
        return null;
      },
    });
  }, []);

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
