import { AuthIntegrationService } from './auth-integration';

// Types based on uni-api OpenAPI spec
export interface UniApiKnowledgeItem {
  id: string;
  title?: string;
  content?: string;
  rawContent: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'document';
  sourcePlatform: 'wechat' | 'flomo' | 'feishu' | 'notion' | 'manual';
  sourceId?: string;
  metadata: Record<string, any>;
  tags: string[];
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  userId: string;
}

export interface UniApiSearchResult {
  items: UniApiKnowledgeItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface UniApiSearchFilters {
  platforms?: string[];
  contentTypes?: string[];
  processingStatus?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface UniApiAISearchRequest {
  query: string;
  limit?: number;
  filters?: UniApiSearchFilters;
  includeRelevanceScore?: boolean;
}

export interface UniApiAIReasoningRequest {
  query: string;
  contextItems?: string[];
  maxTokens?: number;
  temperature?: number;
}

export interface UniApiAIReasoningResponse {
  reasoning: string;
  sourceItems: string[];
  confidence: number;
  tokensUsed: number;
}

export interface UniApiPlatformStatus {
  platform: string;
  isConnected: boolean;
  lastSync?: string;
  status: 'active' | 'paused' | 'error';
  syncSettings: Record<string, any>;
}

export interface UniApiAnalyticsInsights {
  totalItems: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
  topTags: {
    tag: string;
    count: number;
  }[];
  platformBreakdown: {
    platform: string;
    count: number;
  }[];
}

export interface UniApiVectorStats {
  totalVectors: number;
  indexedItems: number;
  pendingItems: number;
  lastIndexTime?: string;
  indexHealth: 'healthy' | 'degraded' | 'error';
}

export class UniApiClient {
  private baseUrl: string;
  private authService: AuthIntegrationService;

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.authService = AuthIntegrationService.getInstance(baseUrl);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const authHeaders = await this.authService.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText}`, {
        cause: error,
      });
    }

    return response.json();
  }

  // Knowledge Items API
  async getKnowledgeItems(
    filters: UniApiSearchFilters = {},
    limit = 20,
    offset = 0
  ): Promise<UniApiSearchResult> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (filters.platforms) {
      filters.platforms.forEach(platform => params.append('platforms', platform));
    }
    if (filters.contentTypes) {
      filters.contentTypes.forEach(type => params.append('contentTypes', type));
    }
    if (filters.processingStatus) {
      filters.processingStatus.forEach(status => params.append('processingStatus', status));
    }

    return this.request<UniApiSearchResult>(`/knowledge/items/?${params}`);
  }

  async getKnowledgeItem(id: string): Promise<UniApiKnowledgeItem> {
    return this.request<UniApiKnowledgeItem>(`/knowledge/items/${id}`);
  }

  async createKnowledgeItem(
    item: Omit<UniApiKnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UniApiKnowledgeItem> {
    return this.request<UniApiKnowledgeItem>('/knowledge/items/', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateKnowledgeItem(
    id: string,
    updates: Partial<UniApiKnowledgeItem>
  ): Promise<UniApiKnowledgeItem> {
    return this.request<UniApiKnowledgeItem>(`/knowledge/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteKnowledgeItem(id: string): Promise<void> {
    return this.request<void>(`/knowledge/items/${id}`, {
      method: 'DELETE',
    });
  }

  async batchDeleteKnowledgeItems(filenames: string[]): Promise<{ deleted: number }> {
    return this.request<{ deleted: number }>('/knowledge/items/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ filenames }),
    });
  }

  async uploadKnowledgeItem(file: File): Promise<UniApiKnowledgeItem> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.baseUrl}/knowledge/items/upload`;
    const authHeaders = await this.authService.getAuthHeaders();

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - let browser set it automatically
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`, {
        cause: error,
      });
    }

    return response.json();
  }

  async searchKnowledgeItems(
    query: string,
    filters: UniApiSearchFilters = {},
    limit = 10
  ): Promise<UniApiKnowledgeItem[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    if (filters.platforms) {
      filters.platforms.forEach(platform => params.append('platforms', platform));
    }

    return this.request<UniApiKnowledgeItem[]>(`/knowledge/items/search?${params}`);
  }

  // AI-powered search and reasoning
  async aiSearch(request: UniApiAISearchRequest): Promise<UniApiKnowledgeItem[]> {
    return this.request<UniApiKnowledgeItem[]>('/knowledge/ai/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async aiReasoning(request: UniApiAIReasoningRequest): Promise<UniApiAIReasoningResponse> {
    return this.request<UniApiAIReasoningResponse>('/knowledge/ai/reasoning', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async discoverConnections(itemIds: string[]): Promise<{
    connections: Array<{
      sourceId: string;
      targetId: string;
      strength: number;
      type: string;
    }>;
  }> {
    return this.request('/knowledge/ai/connections', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    });
  }

  async summarizeKnowledge(request: {
    query?: string;
    itemIds?: string[];
    maxTokens?: number;
  }): Promise<{
    summary: string;
    sourceItems: string[];
    keyInsights: string[];
  }> {
    return this.request('/knowledge/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Platform integration
  async getPlatformStatus(): Promise<UniApiPlatformStatus[]> {
    return this.request<UniApiPlatformStatus[]>('/knowledge/platforms/status');
  }

  async syncPlatform(platform: string): Promise<{ status: string; message: string }> {
    return this.request(`/knowledge/platforms/${platform}/sync`, {
      method: 'POST',
    });
  }

  async pausePlatformSync(platform: string): Promise<{ status: string }> {
    return this.request(`/knowledge/platforms/${platform}/pause`, {
      method: 'POST',
    });
  }

  async resumePlatformSync(platform: string): Promise<{ status: string }> {
    return this.request(`/knowledge/platforms/${platform}/resume`, {
      method: 'POST',
    });
  }

  async disconnectPlatform(platform: string): Promise<{ status: string }> {
    return this.request(`/knowledge/platforms/${platform}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getKnowledgeInsights(): Promise<UniApiAnalyticsInsights> {
    return this.request<UniApiAnalyticsInsights>('/knowledge/analytics/insights');
  }

  async getUsageAnalytics(): Promise<{
    dailyUsage: Array<{ date: string; requests: number }>;
    topQueries: Array<{ query: string; count: number }>;
    averageResponseTime: number;
  }> {
    return this.request('/knowledge/analytics/usage');
  }

  async getTopicAnalysis(): Promise<{
    topics: Array<{
      name: string;
      count: number;
      items: string[];
    }>;
  }> {
    return this.request('/knowledge/analytics/topics');
  }

  async getKnowledgeNetwork(): Promise<{
    nodes: Array<{ id: string; title: string; category: string }>;
    edges: Array<{ source: string; target: string; weight: number }>;
  }> {
    return this.request('/knowledge/analytics/network');
  }

  // Vector operations
  async startVectorization(itemIds?: string[]): Promise<{ taskId: string; status: string }> {
    return this.request('/knowledge/vector/vectorize', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    });
  }

  async getVectorizationStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    processedItems: number;
    totalItems: number;
  }> {
    return this.request(`/knowledge/vector/vectorize/status?taskId=${taskId}`);
  }

  async getVectorIndexStats(): Promise<UniApiVectorStats> {
    return this.request<UniApiVectorStats>('/knowledge/vector/index/stats');
  }

  async rebuildVectorIndex(): Promise<{ status: string; taskId: string }> {
    return this.request('/knowledge/vector/index/rebuild', {
      method: 'POST',
    });
  }

  async clearVectorIndex(): Promise<{ status: string }> {
    return this.request('/knowledge/vector/index/clear', {
      method: 'DELETE',
    });
  }

  async vectorizeSingleDocument(itemId: string): Promise<{ status: string }> {
    return this.request(`/knowledge/vector/document/${itemId}/vectorize`, {
      method: 'POST',
    });
  }

  async getSearchPerformance(): Promise<{
    averageLatency: number;
    successRate: number;
    recentQueries: Array<{
      query: string;
      latency: number;
      resultsCount: number;
      timestamp: string;
    }>;
  }> {
    return this.request('/knowledge/vector/search/performance');
  }
}

// Create a singleton instance
export const uniApiClient = new UniApiClient();