// Comprehensive type definitions for uni-api responses

// Base types
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Knowledge Base types
export interface KnowledgeItem {
  id: string;
  title?: string;
  content?: string;
  rawContent: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'pdf' | 'markdown';
  sourcePlatform: 'wechat' | 'flomo' | 'feishu' | 'notion' | 'manual' | 'upload';
  sourceId?: string;
  sourceUrl?: string;
  metadata: Record<string, any>;
  tags: string[];
  embedding?: number[];
  embeddings?: {
    model: string;
    vector: number[];
    dimensions: number;
  }[];
  createdAt: string;
  updatedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  userId: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  extractedText?: string;
  language?: string;
  wordCount?: number;
  readingTime?: number;
  categories?: string[];
  relatedItems?: string[];
  accessCount?: number;
  lastAccessedAt?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  customFields?: Record<string, any>;
}

export interface SearchFilters {
  platforms?: string[];
  contentTypes?: string[];
  processingStatus?: string[];
  tags?: string[];
  categories?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  fileSize?: {
    min?: number;
    max?: number;
  };
  wordCount?: {
    min?: number;
    max?: number;
  };
  language?: string[];
  isArchived?: boolean;
  isFavorite?: boolean;
  hasEmbedding?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'wordCount' | 'accessCount';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult extends PaginatedResponse<KnowledgeItem> {
  query?: string;
  filters?: SearchFilters;
  searchTime: number;
  totalMatches: number;
  facets?: {
    platforms: Array<{ name: string; count: number }>;
    contentTypes: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
  };
}

// AI Search types
export interface AISearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  includeRelevanceScore?: boolean;
  includeExplanation?: boolean;
  contextWindow?: number;
  searchMode?: 'semantic' | 'hybrid' | 'keyword';
  rerank?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface AISearchResult {
  id: string;
  item: KnowledgeItem;
  relevanceScore: number;
  explanation?: string;
  matchedSegments: Array<{
    text: string;
    score: number;
    startIndex: number;
    endIndex: number;
  }>;
  semanticSimilarity: number;
  keywordMatches: string[];
  contextualRelevance: number;
}

export interface AISearchResponse {
  results: AISearchResult[];
  query: string;
  totalResults: number;
  searchTime: number;
  model: string;
  parameters: AISearchRequest;
  suggestions?: string[];
  relatedQueries?: string[];
}

// AI Reasoning types
export interface AIReasoningRequest {
  query: string;
  contextItems?: string[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
  includeSourceCitations?: boolean;
  reasoningMode?: 'analytical' | 'creative' | 'factual' | 'comparative';
  outputFormat?: 'text' | 'structured' | 'bullets' | 'summary';
}

export interface AIReasoningResponse {
  reasoning: string;
  sourceItems: Array<{
    id: string;
    title: string;
    relevance: number;
    citationText: string;
  }>;
  confidence: number;
  tokensUsed: number;
  processingTime: number;
  model: string;
  keyInsights: string[];
  limitations: string[];
  followUpQuestions: string[];
  structuredOutput?: {
    summary: string;
    keyPoints: string[];
    evidence: Array<{
      claim: string;
      evidence: string;
      sourceId: string;
      confidence: number;
    }>;
    conclusions: string[];
  };
}

// Platform Integration types
export interface PlatformIntegration {
  id: string;
  userId: string;
  platformType: 'wechat' | 'flomo' | 'feishu' | 'notion' | 'obsidian' | 'logseq';
  isConnected: boolean;
  authData: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    permissions?: string[];
    accountInfo?: Record<string, any>;
  };
  syncSettings: {
    autoSync: boolean;
    syncInterval: number; // in minutes
    syncFilters: {
      contentTypes?: string[];
      dateRange?: {
        start?: string;
        end?: string;
      };
      includeTags?: string[];
      excludeTags?: string[];
    };
    transformations?: {
      titleFormat?: string;
      contentFormat?: string;
      tagMapping?: Record<string, string>;
    };
  };
  lastSync?: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'paused';
  syncError?: string;
  syncStats: {
    totalItems: number;
    newItems: number;
    updatedItems: number;
    errorCount: number;
    lastSyncDuration: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSyncResult {
  status: 'success' | 'partial' | 'failed';
  message: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: Array<{
    itemId?: string;
    error: string;
    details?: any;
  }>;
  duration: number;
  nextSyncAt?: string;
}

// Analytics types
export interface AnalyticsInsights {
  totalItems: number;
  totalSizeBytes: number;
  averageWordCount: number;
  averageReadingTime: number;
  recentActivity: Array<{
    date: string;
    count: number;
    type: 'created' | 'updated' | 'accessed' | 'searched';
  }>;
  topTags: Array<{
    tag: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  platformBreakdown: Array<{
    platform: string;
    count: number;
    percentage: number;
    avgWordCount: number;
  }>;
  contentTypeBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
    avgSize: number;
  }>;
  languageBreakdown: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  processingStats: {
    completed: number;
    pending: number;
    failed: number;
    processingTime: {
      average: number;
      min: number;
      max: number;
    };
  };
  searchStats: {
    totalSearches: number;
    avgResultsPerSearch: number;
    topQueries: Array<{
      query: string;
      count: number;
      avgRelevance: number;
    }>;
    searchTrends: Array<{
      date: string;
      count: number;
      avgResponseTime: number;
    }>;
  };
  userEngagement: {
    activeUsers: number;
    avgSessionDuration: number;
    topFeatures: Array<{
      feature: string;
      usage: number;
    }>;
  };
}

export interface UsageAnalytics {
  period: {
    start: string;
    end: string;
  };
  dailyUsage: Array<{
    date: string;
    requests: number;
    uniqueUsers: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  topQueries: Array<{
    query: string;
    count: number;
    avgRelevance: number;
    lastUsed: string;
  }>;
  featureUsage: Array<{
    feature: string;
    usage: number;
    percentage: number;
  }>;
  performanceMetrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    successRate: number;
  };
  resourceUsage: {
    tokensUsed: number;
    storageUsed: number;
    bandwidthUsed: number;
    computeTime: number;
  };
}

// Vector and Embedding types
export interface VectorStats {
  totalVectors: number;
  indexedItems: number;
  pendingItems: number;
  failedItems: number;
  vectorDimensions: number;
  embeddingModel: string;
  lastIndexTime?: string;
  indexHealth: 'healthy' | 'degraded' | 'error';
  indexSize: number;
  averageIndexingTime: number;
  indexingErrors: Array<{
    itemId: string;
    error: string;
    timestamp: string;
  }>;
  performanceMetrics: {
    searchLatency: {
      average: number;
      p95: number;
      p99: number;
    };
    indexingThroughput: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export interface VectorizationTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startTime: string;
  endTime?: string;
  estimatedCompletion?: string;
  itemIds?: string[];
  model: string;
  parameters: {
    batchSize: number;
    dimensions: number;
    normalize: boolean;
  };
  errors: Array<{
    itemId: string;
    error: string;
    timestamp: string;
  }>;
  performance: {
    itemsPerSecond: number;
    avgProcessingTime: number;
    memoryUsage: number;
  };
}

// Network and Connection types
export interface KnowledgeNetwork {
  nodes: Array<{
    id: string;
    title: string;
    category: string;
    size: number;
    color: string;
    metadata: Record<string, any>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
    type: 'semantic' | 'reference' | 'temporal' | 'tag' | 'platform';
    metadata: Record<string, any>;
  }>;
  clusters: Array<{
    id: string;
    name: string;
    nodeIds: string[];
    centroid: {
      x: number;
      y: number;
    };
    cohesion: number;
  }>;
  metrics: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    density: number;
    modularity: number;
    clusterCount: number;
  };
}

export interface TopicAnalysis {
  topics: Array<{
    id: string;
    name: string;
    description: string;
    count: number;
    percentage: number;
    keywords: string[];
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    items: Array<{
      id: string;
      title: string;
      relevance: number;
    }>;
    trends: Array<{
      date: string;
      count: number;
    }>;
    relatedTopics: Array<{
      topicId: string;
      similarity: number;
    }>;
  }>;
  totalTopics: number;
  coverage: number;
  coherence: number;
  model: string;
  parameters: {
    minTopicSize: number;
    maxTopics: number;
    alpha: number;
    beta: number;
  };
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  path?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ErrorResponse {
  success: false;
  error: APIError;
  validationErrors?: ValidationError[];
}

// Batch operations
export interface BatchOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'vectorize';
  items: T[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: Array<{
    itemId: string;
    status: 'success' | 'error';
    error?: string;
    result?: any;
  }>;
  startTime: string;
  endTime?: string;
  estimatedDuration?: number;
}

// Export utility types
export type CreateKnowledgeItem = Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
export type UpdateKnowledgeItem = Partial<Pick<KnowledgeItem, 'title' | 'content' | 'tags' | 'categories' | 'metadata' | 'isArchived' | 'isFavorite' | 'customFields'>>;
export type KnowledgeItemWithScore = KnowledgeItem & { relevanceScore: number };
export type PlatformType = PlatformIntegration['platformType'];
export type ContentType = KnowledgeItem['contentType'];
export type ProcessingStatus = KnowledgeItem['processingStatus'];
export type SearchMode = AISearchRequest['searchMode'];
export type ReasoningMode = AIReasoningRequest['reasoningMode'];
export type OutputFormat = AIReasoningRequest['outputFormat'];

// Event types for real-time updates
export interface KnowledgeBaseEvent {
  type: 'item_created' | 'item_updated' | 'item_deleted' | 'sync_started' | 'sync_completed' | 'vectorization_completed';
  timestamp: string;
  userId: string;
  data: any;
  metadata?: Record<string, any>;
}