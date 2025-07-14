import type { Database } from '@/types/database';
import type { KnowledgeItem, PlatformIntegration, SearchFilters, SearchResult } from '@/types/knowledge-base';
import { supabase } from '@/lib/supabase';

type KnowledgeItemRow = Database['public']['Tables']['knowledge_items']['Row'];
type KnowledgeItemInsert = Database['public']['Tables']['knowledge_items']['Insert'];
type KnowledgeItemUpdate = Database['public']['Tables']['knowledge_items']['Update'];

export class KnowledgeBaseService {
  // 获取知识库项目列表
  static async getKnowledgeItems(
    userId: string,
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0,
  ): Promise<SearchResult> {
    let query = supabase
      .from('knowledge_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 应用过滤器
    if (filters.platforms && filters.platforms.length > 0) {
      query = query.in('source_platform', filters.platforms);
    }

    if (filters.contentTypes && filters.contentTypes.length > 0) {
      query = query.in('content_type', filters.contentTypes);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.processingStatus && filters.processingStatus.length > 0) {
      query = query.in('processing_status', filters.processingStatus);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('created_at', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        query = query.lte('created_at', filters.dateRange.end);
      }
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch knowledge items: ${error.message}`);
    }

    return {
      items: data?.map(this.transformKnowledgeItem) || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      nextCursor: (count || 0) > offset + limit ? String(offset + limit) : undefined,
    };
  }

  // 根据ID获取单个知识库项目
  static async getKnowledgeItem(id: string, userId: string): Promise<KnowledgeItem | null> {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到
      }
      throw new Error(`Failed to fetch knowledge item: ${error.message}`);
    }

    return this.transformKnowledgeItem(data);
  }

  // 创建知识库项目
  static async createKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeItem> {
    const insertData: KnowledgeItemInsert = {
      user_id: item.userId,
      source_platform: item.sourcePlatform,
      source_id: item.sourceId,
      content_type: item.contentType,
      title: item.title,
      content: item.content,
      raw_content: item.rawContent,
      metadata: item.metadata,
      embedding: item.embedding,
      tags: item.tags,
      processing_status: item.processingStatus,
    };

    const { data, error } = await supabase
      .from('knowledge_items')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge item: ${error.message}`);
    }

    return this.transformKnowledgeItem(data);
  }

  // 更新知识库项目
  static async updateKnowledgeItem(id: string, userId: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const updateData: KnowledgeItemUpdate = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.rawContent !== undefined && { raw_content: updates.rawContent }),
      ...(updates.metadata !== undefined && { metadata: updates.metadata }),
      ...(updates.embedding !== undefined && { embedding: updates.embedding }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      ...(updates.processingStatus !== undefined && { processing_status: updates.processingStatus }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('knowledge_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update knowledge item: ${error.message}`);
    }

    return this.transformKnowledgeItem(data);
  }

  // 删除知识库项目
  static async deleteKnowledgeItem(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete knowledge item: ${error.message}`);
    }
  }

  // 语义搜索
  static async semanticSearch(
    userId: string,
    query: string,
    limit: number = 10,
  ): Promise<KnowledgeItem[]> {
    // 首先生成查询向量 (这里需要调用 OpenAI API 或其他嵌入服务)
    // const queryEmbedding = await this.generateEmbedding(query)

    // 临时实现：使用文本搜索
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search knowledge items: ${error.message}`);
    }

    return data?.map(this.transformKnowledgeItem) || [];
  }

  // 获取标签统计
  static async getTagStats(userId: string): Promise<Array<{ tag: string; count: number }>> {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('tags')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch tag stats: ${error.message}`);
    }

    // 统计标签
    const tagCounts: Record<string, number> = {};
    data?.forEach((item) => {
      item.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  // 转换数据库行为业务对象
  private static transformKnowledgeItem(row: KnowledgeItemRow): KnowledgeItem {
    return {
      id: row.id,
      userId: row.user_id,
      sourcePlatform: row.source_platform as any,
      sourceId: row.source_id || undefined,
      contentType: row.content_type,
      title: row.title || undefined,
      content: row.content || undefined,
      rawContent: row.raw_content,
      metadata: row.metadata as any,
      embedding: row.embedding || undefined,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processingStatus: row.processing_status,
    };
  }

  // 生成嵌入向量 (需要配置 OpenAI API)
  // private static async generateEmbedding(text: string): Promise<number[]> {
  //   // TODO: 实现 OpenAI Embedding API 调用
  //   // const response = await openai.embeddings.create({
  //   //   model: 'text-embedding-3-large',
  //   //   input: text
  //   // })
  //   // return response.data[0].embedding
  //   return []
  // }
}

export class PlatformIntegrationService {
  // 获取平台集成列表
  static async getPlatformIntegrations(userId: string): Promise<PlatformIntegration[]> {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch platform integrations: ${error.message}`);
    }

    return data?.map(this.transformPlatformIntegration) || [];
  }

  // 创建平台集成
  static async createPlatformIntegration(integration: Omit<PlatformIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlatformIntegration> {
    const { data, error } = await supabase
      .from('platform_integrations')
      .insert({
        user_id: integration.userId,
        platform_type: integration.platformType,
        auth_data: integration.authData,
        sync_settings: integration.syncSettings,
        last_sync: integration.lastSync,
        is_active: integration.isActive,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create platform integration: ${error.message}`);
    }

    return this.transformPlatformIntegration(data);
  }

  // 更新平台集成
  static async updatePlatformIntegration(id: string, userId: string, updates: Partial<PlatformIntegration>): Promise<PlatformIntegration> {
    const updateData: any = {
      ...(updates.authData !== undefined && { auth_data: updates.authData }),
      ...(updates.syncSettings !== undefined && { sync_settings: updates.syncSettings }),
      ...(updates.lastSync !== undefined && { last_sync: updates.lastSync }),
      ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('platform_integrations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update platform integration: ${error.message}`);
    }

    return this.transformPlatformIntegration(data);
  }

  // 删除平台集成
  static async deletePlatformIntegration(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('platform_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete platform integration: ${error.message}`);
    }
  }

  private static transformPlatformIntegration(row: any): PlatformIntegration {
    return {
      id: row.id,
      userId: row.user_id,
      platformType: row.platform_type,
      authData: row.auth_data,
      syncSettings: row.sync_settings,
      lastSync: row.last_sync,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
