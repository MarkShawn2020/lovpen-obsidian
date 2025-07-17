'use client';

import { 
  useQuery, 
  useMutation, 
  useInfiniteQuery, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { 
  uniApiClient, 
  type UniApiKnowledgeItem, 
  type UniApiSearchResult,
  type UniApiSearchFilters,
  type UniApiAISearchRequest,
  type UniApiAIReasoningRequest,
  type UniApiAIReasoningResponse,
  type UniApiPlatformStatus,
  type UniApiAnalyticsInsights,
  type UniApiVectorStats,
} from '@/services/uni-api-client';

// Query keys for consistent caching
export const knowledgeBaseKeys = {
  all: ['knowledgeBase'] as const,
  items: () => [...knowledgeBaseKeys.all, 'items'] as const,
  item: (id: string) => [...knowledgeBaseKeys.items(), id] as const,
  search: (query: string, filters?: UniApiSearchFilters) => 
    [...knowledgeBaseKeys.all, 'search', query, filters] as const,
  aiSearch: (request: UniApiAISearchRequest) => 
    [...knowledgeBaseKeys.all, 'aiSearch', request] as const,
  aiReasoning: (request: UniApiAIReasoningRequest) => 
    [...knowledgeBaseKeys.all, 'aiReasoning', request] as const,
  platforms: () => [...knowledgeBaseKeys.all, 'platforms'] as const,
  analytics: () => [...knowledgeBaseKeys.all, 'analytics'] as const,
  vectorStats: () => [...knowledgeBaseKeys.all, 'vectorStats'] as const,
} as const;

// Hook for getting knowledge base items with pagination
export function useKnowledgeItems(
  filters: UniApiSearchFilters = {},
  options?: UseInfiniteQueryOptions<UniApiSearchResult>
) {
  const { user } = useUser();
  
  return useInfiniteQuery({
    queryKey: [...knowledgeBaseKeys.items(), filters],
    queryFn: async ({ pageParam = 0 }) => {
      return uniApiClient.getKnowledgeItems(filters, 20, pageParam as number);
    },
    enabled: !!user,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for getting a single knowledge base item
export function useKnowledgeItem(
  id: string,
  options?: UseQueryOptions<UniApiKnowledgeItem>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.item(id),
    queryFn: () => uniApiClient.getKnowledgeItem(id),
    enabled: !!user && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// Hook for searching knowledge base items
export function useSearchKnowledgeItems(
  query: string,
  filters: UniApiSearchFilters = {},
  options?: UseQueryOptions<UniApiKnowledgeItem[]>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.search(query, filters),
    queryFn: () => uniApiClient.searchKnowledgeItems(query, filters, 20),
    enabled: !!user && !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

// Hook for AI-powered semantic search
export function useAISearch(
  request: UniApiAISearchRequest,
  options?: UseQueryOptions<UniApiKnowledgeItem[]>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.aiSearch(request),
    queryFn: () => uniApiClient.aiSearch(request),
    enabled: !!user && !!request.query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for AI reasoning
export function useAIReasoning(
  request: UniApiAIReasoningRequest,
  options?: UseQueryOptions<UniApiAIReasoningResponse>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.aiReasoning(request),
    queryFn: () => uniApiClient.aiReasoning(request),
    enabled: !!user && !!request.query.trim(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// Hook for platform status
export function usePlatformStatus(
  options?: UseQueryOptions<UniApiPlatformStatus[]>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.platforms(),
    queryFn: () => uniApiClient.getPlatformStatus(),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
}

// Hook for analytics insights
export function useAnalyticsInsights(
  options?: UseQueryOptions<UniApiAnalyticsInsights>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.analytics(),
    queryFn: () => uniApiClient.getKnowledgeInsights(),
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}

// Hook for vector statistics
export function useVectorStats(
  options?: UseQueryOptions<UniApiVectorStats>
) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: knowledgeBaseKeys.vectorStats(),
    queryFn: () => uniApiClient.getVectorIndexStats(),
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

// Mutation hooks for CRUD operations
export function useCreateKnowledgeItem(
  options?: UseMutationOptions<
    UniApiKnowledgeItem,
    Error,
    Omit<UniApiKnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item) => uniApiClient.createKnowledgeItem(item),
    onSuccess: (data) => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.items() });
      
      // Add the new item to the cache
      queryClient.setQueryData(knowledgeBaseKeys.item(data.id), data);
      
      // Update analytics
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.analytics() });
    },
    ...options,
  });
}

export function useUpdateKnowledgeItem(
  options?: UseMutationOptions<
    UniApiKnowledgeItem,
    Error,
    { id: string; updates: Partial<UniApiKnowledgeItem> }
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => uniApiClient.updateKnowledgeItem(id, updates),
    onMutate: (async ({ id, updates }: { id: string; updates: Partial<UniApiKnowledgeItem> }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: knowledgeBaseKeys.item(id) });
      
      // Snapshot the previous value
      const previousItem = queryClient.getQueryData<UniApiKnowledgeItem>(
        knowledgeBaseKeys.item(id)
      );
      
      // Optimistically update to the new value
      if (previousItem) {
        queryClient.setQueryData(knowledgeBaseKeys.item(id), {
          ...previousItem,
          ...updates,
        });
      }
      
      return { previousItem };
    }) as any,
    onError: (_error: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(
          knowledgeBaseKeys.item(variables.id),
          context.previousItem
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch the item regardless of success/failure
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.item(variables.id) });
    },
    ...options,
  });
}

export function useDeleteKnowledgeItem(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => uniApiClient.deleteKnowledgeItem(id),
    onSuccess: (_data, id) => {
      // Remove the item from cache
      queryClient.removeQueries({ queryKey: knowledgeBaseKeys.item(id) });
      
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.items() });
      
      // Update analytics
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.analytics() });
    },
    ...options,
  });
}

export function useUploadKnowledgeItem(
  options?: UseMutationOptions<UniApiKnowledgeItem, Error, File>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file) => uniApiClient.uploadKnowledgeItem(file),
    onSuccess: (data) => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.items() });
      
      // Add the new item to the cache
      queryClient.setQueryData(knowledgeBaseKeys.item(data.id), data);
      
      // Update analytics
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.analytics() });
    },
    ...options,
  });
}

export function useBatchDeleteKnowledgeItems(
  options?: UseMutationOptions<{ deleted: number }, Error, string[]>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (filenames) => uniApiClient.batchDeleteKnowledgeItems(filenames),
    onSuccess: () => {
      // Invalidate all items-related queries
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.items() });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.analytics() });
    },
    ...options,
  });
}

// Platform sync mutations
export function useSyncPlatform(
  options?: UseMutationOptions<
    { status: string; message: string },
    Error,
    string
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (platform) => uniApiClient.syncPlatform(platform),
    onSuccess: () => {
      // Invalidate platform status and items
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.platforms() });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.items() });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.analytics() });
    },
    ...options,
  });
}

export function usePausePlatformSync(
  options?: UseMutationOptions<{ status: string }, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (platform) => uniApiClient.pausePlatformSync(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.platforms() });
    },
    ...options,
  });
}

export function useResumePlatformSync(
  options?: UseMutationOptions<{ status: string }, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (platform) => uniApiClient.resumePlatformSync(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.platforms() });
    },
    ...options,
  });
}

// Vector operations
export function useStartVectorization(
  options?: UseMutationOptions<
    { taskId: string; status: string },
    Error,
    string[] | undefined
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemIds) => uniApiClient.startVectorization(itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.vectorStats() });
    },
    ...options,
  });
}

export function useRebuildVectorIndex(
  options?: UseMutationOptions<{ status: string; taskId: string }, Error, void>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => uniApiClient.rebuildVectorIndex(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.vectorStats() });
    },
    ...options,
  });
}

// Utility hooks for common operations
export function useKnowledgeBaseStats() {
  const { data: insights } = useAnalyticsInsights();
  const { data: vectorStats } = useVectorStats();
  
  return {
    totalItems: insights?.totalItems || 0,
    vectorizedItems: vectorStats?.indexedItems || 0,
    pendingItems: vectorStats?.pendingItems || 0,
    indexHealth: vectorStats?.indexHealth || 'unknown',
    isLoading: !insights || !vectorStats,
  };
}

export function useKnowledgeBaseSearch(query: string, enableAI = true) {
  const basicSearch = useSearchKnowledgeItems(query);
  const aiSearch = useAISearch(
    { query, includeRelevanceScore: true },
    { 
      enabled: enableAI && !!query.trim(),
      queryKey: knowledgeBaseKeys.aiSearch({ query, includeRelevanceScore: true })
    }
  );
  
  return {
    basicResults: basicSearch.data || [],
    aiResults: aiSearch.data || [],
    isLoading: basicSearch.isLoading || aiSearch.isLoading,
    error: basicSearch.error || aiSearch.error,
  };
}