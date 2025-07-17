'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';

// Create a persister for localStorage
const createPersister = () => {
  if (typeof window === 'undefined') return null;
  
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'REACT_QUERY_OFFLINE_CACHE',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
};

// Create query client with optimized settings
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time of 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time of 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (10 minutes)
      refetchInterval: 10 * 60 * 1000,
    },
    mutations: {
      // Retry failed mutations 2 times
      retry: 2,
      // Show error notifications
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // You can integrate with your notification system here
      },
    },
  },
});

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(createQueryClient);
  const [persister, setPersister] = useState<ReturnType<typeof createPersister>>(null);
  const [isRestoringCache, setIsRestoringCache] = useState(true);

  useEffect(() => {
    // Initialize persister only on client side
    if (typeof window !== 'undefined') {
      const clientPersister = createPersister();
      setPersister(clientPersister);
      setIsRestoringCache(false);
    }
  }, []);

  // Show loading state while restoring cache
  if (isRestoringCache) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If persister is available, use PersistQueryClientProvider
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: persister,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        }}
        onSuccess={() => {
          // Cache has been restored
          console.log('React Query cache restored successfully');
        }}
        onError={() => {
          // Handle cache restoration error
          console.error('Failed to restore React Query cache');
        }}
      >
        {children}
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      </PersistQueryClientProvider>
    );
  }

  // Fallback to regular QueryClientProvider if persister is not available
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
      />
    </QueryClientProvider>
  );
}

// Hook for accessing query client
export function useQueryClient() {
  const queryClient = useState(createQueryClient)[0];
  return queryClient;
}

// Custom hook for persistent state management
export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem(key);
      if (savedValue) {
        try {
          setState(JSON.parse(savedValue));
        } catch (error) {
          console.error(`Failed to parse saved value for key ${key}:`, error);
        }
      }
      setIsLoaded(true);
    }
  }, [key]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state, isLoaded]);

  return [state, setState, isLoaded] as const;
}