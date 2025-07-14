'use client';

import type { SearchFilters } from '@/types/knowledge-base';
import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { KnowledgeBaseService } from '@/services/knowledge-base';

export function KnowledgeBasePage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [searchQuery] = useState('');
  const [filters] = useState<SearchFilters>({});
  const [total, setTotal] = useState(0);

  const loadKnowledgeItems = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      let result;

      if (searchQuery.trim()) {
        const searchResults = await KnowledgeBaseService.semanticSearch(
          user.id,
          searchQuery,
          20,
        );
        result = {
          items: searchResults,
          total: searchResults.length,
          hasMore: false,
        };
      } else {
        result = await KnowledgeBaseService.getKnowledgeItems(
          user.id,
          filters,
          20,
          0,
        );
      }

      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load knowledge items:', error);
    } finally {
      setLoading(false);
    }
  }, [user, searchQuery, filters]);

  useEffect(() => {
    if (user) {
      loadKnowledgeItems();
    }
  }, [user, loadKnowledgeItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">知识库</h1>
          <p className="text-gray-600">
            共
            {total}
            {' '}
            个项目
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-medium text-gray-900 mb-4">知识库功能正在开发中</h2>
          <p className="text-gray-500">
            基础架构已完成，正在完善UI组件和功能
          </p>
        </div>
      </div>
    </div>
  );
}
