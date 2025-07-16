import type { KnowledgeItem, SearchFilters, SearchResult } from '@/types/knowledge-base';

export class KnowledgeBaseClientService {
  // 获取知识库项目列表
  static async getKnowledgeItems(
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0,
  ): Promise<SearchResult> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    if (filters.platforms?.length) {
      params.append('platforms', filters.platforms.join(','));
    }
    if (filters.contentTypes?.length) {
      params.append('contentTypes', filters.contentTypes.join(','));
    }
    if (filters.processingStatus?.length) {
      params.append('processingStatus', filters.processingStatus.join(','));
    }
    if (filters.tags?.length) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters.dateRange?.start) {
      params.append('dateStart', filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      params.append('dateEnd', filters.dateRange.end);
    }

    const response = await fetch(`/api/knowledge-base?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch knowledge items');
    }

    return response.json();
  }

  // 语义搜索
  static async semanticSearch(
    query: string,
    limit: number = 10,
  ): Promise<KnowledgeItem[]> {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('limit', limit.toString());

    const response = await fetch(`/api/knowledge-base?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search knowledge items');
    }

    const result = await response.json();
    return result.items;
  }

  // 根据ID获取单个知识库项目
  static async getKnowledgeItem(id: string): Promise<KnowledgeItem | null> {
    const response = await fetch(`/api/knowledge-base/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch knowledge item');
    }

    return response.json();
  }

  // 创建知识库项目
  static async createKnowledgeItem(
    item: Omit<KnowledgeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<KnowledgeItem> {
    const response = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create knowledge item');
    }

    return response.json();
  }

  // 更新知识库项目
  static async updateKnowledgeItem(
    id: string,
    updates: Partial<KnowledgeItem>,
  ): Promise<KnowledgeItem> {
    const response = await fetch(`/api/knowledge-base/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update knowledge item');
    }

    return response.json();
  }

  // 删除知识库项目
  static async deleteKnowledgeItem(id: string): Promise<void> {
    const response = await fetch(`/api/knowledge-base/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete knowledge item');
    }
  }
}
