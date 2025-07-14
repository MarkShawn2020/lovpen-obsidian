import type { KnowledgeItem, PlatformIntegration, SearchFilters, SearchResult } from '@/types/knowledge-base';
import { db } from '@/libs/DB';
import { knowledgeItemsSchema, platformIntegrationsSchema } from '@/models/Schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

export class KnowledgeBaseService {
  // 获取知识库项目列表
  static async getKnowledgeItems(
    userId: string,
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0,
  ): Promise<SearchResult> {
    const conditions = [eq(knowledgeItemsSchema.userId, userId)];

    // 应用过滤器
    if (filters.platforms && filters.platforms.length > 0) {
      conditions.push(sql`${knowledgeItemsSchema.sourcePlatform} = ANY(${filters.platforms})`);
    }

    if (filters.contentTypes && filters.contentTypes.length > 0) {
      conditions.push(sql`${knowledgeItemsSchema.contentType} = ANY(${filters.contentTypes})`);
    }

    if (filters.processingStatus && filters.processingStatus.length > 0) {
      conditions.push(sql`${knowledgeItemsSchema.processingStatus} = ANY(${filters.processingStatus})`);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        conditions.push(sql`${knowledgeItemsSchema.createdAt} >= ${filters.dateRange.start}`);
      }
      if (filters.dateRange.end) {
        conditions.push(sql`${knowledgeItemsSchema.createdAt} <= ${filters.dateRange.end}`);
      }
    }

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(knowledgeItemsSchema)
        .where(and(...conditions))
        .orderBy(desc(knowledgeItemsSchema.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(knowledgeItemsSchema)
        .where(and(...conditions)),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      items: items.map(this.transformKnowledgeItem),
      total,
      hasMore: total > offset + limit,
      nextCursor: total > offset + limit ? String(offset + limit) : undefined,
    };
  }

  // 根据ID获取单个知识库项目
  static async getKnowledgeItem(id: string, userId: string): Promise<KnowledgeItem | null> {
    const items = await db
      .select()
      .from(knowledgeItemsSchema)
      .where(and(eq(knowledgeItemsSchema.id, id), eq(knowledgeItemsSchema.userId, userId)))
      .limit(1);

    if (items.length === 0) {
      return null;
    }

    return this.transformKnowledgeItem(items[0]);
  }

  // 创建知识库项目
  static async createKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeItem> {
    const insertData = {
      userId: item.userId,
      sourcePlatform: item.sourcePlatform,
      sourceId: item.sourceId,
      contentType: item.contentType,
      title: item.title,
      content: item.content,
      rawContent: item.rawContent,
      metadata: item.metadata,
      embedding: item.embedding,
      tags: item.tags,
      processingStatus: item.processingStatus,
    };

    const result = await db
      .insert(knowledgeItemsSchema)
      .values(insertData)
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to create knowledge item');
    }

    return this.transformKnowledgeItem(result[0]);
  }

  // 更新知识库项目
  static async updateKnowledgeItem(id: string, userId: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.rawContent !== undefined) updateData.rawContent = updates.rawContent;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.embedding !== undefined) updateData.embedding = updates.embedding;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.processingStatus !== undefined) updateData.processingStatus = updates.processingStatus;

    const result = await db
      .update(knowledgeItemsSchema)
      .set(updateData)
      .where(and(eq(knowledgeItemsSchema.id, id), eq(knowledgeItemsSchema.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to update knowledge item');
    }

    return this.transformKnowledgeItem(result[0]);
  }

  // 删除知识库项目
  static async deleteKnowledgeItem(id: string, userId: string): Promise<void> {
    await db
      .delete(knowledgeItemsSchema)
      .where(and(eq(knowledgeItemsSchema.id, id), eq(knowledgeItemsSchema.userId, userId)));
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
    const searchPattern = `%${query}%`;
    const items = await db
      .select()
      .from(knowledgeItemsSchema)
      .where(
        and(
          eq(knowledgeItemsSchema.userId, userId),
          or(
            ilike(knowledgeItemsSchema.title, searchPattern),
            ilike(knowledgeItemsSchema.content, searchPattern)
          )
        )
      )
      .limit(limit);

    return items.map(this.transformKnowledgeItem);
  }

  // 获取标签统计
  static async getTagStats(userId: string): Promise<Array<{ tag: string; count: number }>> {
    const items = await db
      .select({ tags: knowledgeItemsSchema.tags })
      .from(knowledgeItemsSchema)
      .where(eq(knowledgeItemsSchema.userId, userId));

    // 统计标签
    const tagCounts: Record<string, number> = {};
    items.forEach((item) => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  // 转换数据库行为业务对象
  private static transformKnowledgeItem(row: any): KnowledgeItem {
    return {
      id: row.id,
      userId: row.userId,
      sourcePlatform: row.sourcePlatform as any,
      sourceId: row.sourceId || undefined,
      contentType: row.contentType,
      title: row.title || undefined,
      content: row.content || undefined,
      rawContent: row.rawContent,
      metadata: row.metadata || {},
      embedding: row.embedding || undefined,
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      processingStatus: row.processingStatus,
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
    const items = await db
      .select()
      .from(platformIntegrationsSchema)
      .where(eq(platformIntegrationsSchema.userId, userId))
      .orderBy(desc(platformIntegrationsSchema.createdAt));

    return items.map(this.transformPlatformIntegration);
  }

  // 创建平台集成
  static async createPlatformIntegration(integration: Omit<PlatformIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlatformIntegration> {
    const insertData = {
      userId: integration.userId,
      platformType: integration.platformType,
      authData: integration.authData,
      syncSettings: integration.syncSettings,
      lastSync: integration.lastSync ? new Date(integration.lastSync) : null,
      isActive: integration.isActive,
    };

    const result = await db
      .insert(platformIntegrationsSchema)
      .values(insertData)
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to create platform integration');
    }

    return this.transformPlatformIntegration(result[0]);
  }

  // 更新平台集成
  static async updatePlatformIntegration(id: string, userId: string, updates: Partial<PlatformIntegration>): Promise<PlatformIntegration> {
    const updateData: any = {};
    
    if (updates.authData !== undefined) updateData.authData = updates.authData;
    if (updates.syncSettings !== undefined) updateData.syncSettings = updates.syncSettings;
    if (updates.lastSync !== undefined) updateData.lastSync = updates.lastSync ? new Date(updates.lastSync) : null;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const result = await db
      .update(platformIntegrationsSchema)
      .set(updateData)
      .where(and(eq(platformIntegrationsSchema.id, id), eq(platformIntegrationsSchema.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to update platform integration');
    }

    return this.transformPlatformIntegration(result[0]);
  }

  // 删除平台集成
  static async deletePlatformIntegration(id: string, userId: string): Promise<void> {
    await db
      .delete(platformIntegrationsSchema)
      .where(and(eq(platformIntegrationsSchema.id, id), eq(platformIntegrationsSchema.userId, userId)));
  }

  private static transformPlatformIntegration(row: any): PlatformIntegration {
    return {
      id: row.id,
      userId: row.userId,
      platformType: row.platformType,
      authData: row.authData,
      syncSettings: row.syncSettings,
      lastSync: row.lastSync ? row.lastSync.toISOString() : undefined,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
