'use client';

import type { UniApiSearchFilters } from '@/services/uni-api-client';
import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { PersistentTabs, PersistentTabsList, PersistentTabsTrigger, PersistentTabsContent } from '@/components/ui/PersistentTabs';
import { 
  useKnowledgeItems, 
  useKnowledgeBaseSearch, 
  useAnalyticsInsights, 
  usePlatformStatus,
  useKnowledgeBaseStats,
  useUploadKnowledgeItem
} from '@/hooks/useKnowledgeBase';
import { withUniApiAuth } from '@/services/auth-integration';

function KnowledgeBasePageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters] = useState<UniApiSearchFilters>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // React Query hooks
  const knowledgeItems = useKnowledgeItems(filters);
  const searchResults = useKnowledgeBaseSearch(searchQuery, true);
  const analytics = useAnalyticsInsights();
  const platformStatus = usePlatformStatus();
  const stats = useKnowledgeBaseStats();
  const uploadMutation = useUploadKnowledgeItem();

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      await uploadMutation.mutateAsync(file);
      setUploadFile(null);
      // Refresh data after upload
      knowledgeItems.refetch();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };


  const isLoading = knowledgeItems.isLoading || analytics.isLoading || stats.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Container>
      <div className="py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">知识库</h1>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>共 {stats.totalItems} 个项目</span>
            <span>已向量化 {stats.vectorizedItems} 个</span>
            <span>待处理 {stats.pendingItems} 个</span>
            <span className={`px-2 py-1 rounded text-xs ${
              stats.indexHealth === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : stats.indexHealth === 'degraded'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              索引状态: {stats.indexHealth}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索知识库..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center"
              >
                <span>上传文件</span>
              </label>
            </div>
          </div>
        </div>

        {/* Upload confirmation */}
        {uploadFile && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              准备上传文件: {uploadFile.name}
            </p>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => handleFileUpload(uploadFile)}
                disabled={uploadMutation.isPending}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? '上传中...' : '确认上传'}
              </button>
              <button
                onClick={() => setUploadFile(null)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <PersistentTabs id="knowledge-base-tabs" defaultValue="items">
          <PersistentTabsList>
            <PersistentTabsTrigger value="items">
              知识项目
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {stats.totalItems}
              </span>
            </PersistentTabsTrigger>
            <PersistentTabsTrigger value="search">
              搜索结果
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                {searchResults.basicResults.length + searchResults.aiResults.length}
              </span>
            </PersistentTabsTrigger>
            <PersistentTabsTrigger value="platforms">
              平台同步
              <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                {platformStatus.data?.filter(p => p.isConnected).length || 0}
              </span>
            </PersistentTabsTrigger>
            <PersistentTabsTrigger value="analytics">
              分析数据
            </PersistentTabsTrigger>
          </PersistentTabsList>

          <PersistentTabsContent value="items">
            <KnowledgeItemsList 
              items={knowledgeItems}
            />
          </PersistentTabsContent>

          <PersistentTabsContent value="search">
            <SearchResults 
              query={searchQuery}
              basicResults={searchResults.basicResults}
              aiResults={searchResults.aiResults}
              isLoading={searchResults.isLoading}
            />
          </PersistentTabsContent>

          <PersistentTabsContent value="platforms">
            <PlatformSync 
              platforms={platformStatus.data || []}
              isLoading={platformStatus.isLoading}
            />
          </PersistentTabsContent>

          <PersistentTabsContent value="analytics">
            <AnalyticsView 
              insights={analytics.data}
              isLoading={analytics.isLoading}
            />
          </PersistentTabsContent>
        </PersistentTabs>
      </div>
    </Container>
  );
}

// Placeholder components for the tab contents
function KnowledgeItemsList({ items }: any) {
  return (
    <div className="space-y-4">
      {items.data?.pages.map((page: any, pageIndex: number) => (
        <div key={pageIndex} className="space-y-2">
          {page.items.map((item: any) => (
            <div key={item.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{item.title || 'Untitled'}</h3>
              <p className="text-sm text-gray-600 truncate">{item.content}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>来源: {item.sourcePlatform}</span>
                <span>类型: {item.contentType}</span>
                <span>状态: {item.processingStatus}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      {items.hasNextPage && (
        <button
          onClick={() => items.fetchNextPage()}
          disabled={items.isFetchingNextPage}
          className="w-full py-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {items.isFetchingNextPage ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  );
}

function SearchResults({ query, basicResults, aiResults, isLoading }: any) {
  if (!query) {
    return (
      <div className="text-center py-8 text-gray-500">
        请输入搜索关键词
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">基础搜索结果 ({basicResults.length})</h3>
        <div className="space-y-2">
          {basicResults.map((item: any) => (
            <div key={item.id} className="p-3 border rounded">
              <h4 className="font-medium">{item.title || 'Untitled'}</h4>
              <p className="text-sm text-gray-600 truncate">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">AI 搜索结果 ({aiResults.length})</h3>
        <div className="space-y-2">
          {aiResults.map((item: any) => (
            <div key={item.id} className="p-3 border rounded bg-blue-50">
              <h4 className="font-medium">{item.title || 'Untitled'}</h4>
              <p className="text-sm text-gray-600 truncate">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlatformSync({ platforms, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platforms.map((platform: any) => (
        <div key={platform.platform} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{platform.platform}</h3>
              <p className="text-sm text-gray-600">
                状态: {platform.isConnected ? '已连接' : '未连接'}
              </p>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded text-xs ${
                platform.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : platform.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {platform.status}
              </div>
              {platform.lastSync && (
                <p className="text-xs text-gray-500 mt-1">
                  上次同步: {new Date(platform.lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsView({ insights, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-gray-600">总项目数</h3>
          <p className="text-2xl font-bold">{insights?.totalItems || 0}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-gray-600">顶级标签</h3>
          <p className="text-sm">{insights?.topTags?.[0]?.tag || 'N/A'}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-gray-600">主要平台</h3>
          <p className="text-sm">{insights?.platformBreakdown?.[0]?.platform || 'N/A'}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-gray-600">近期活动</h3>
          <p className="text-sm">{insights?.recentActivity?.length || 0} 项</p>
        </div>
      </div>
    </div>
  );
}

export const KnowledgeBasePage = withUniApiAuth(KnowledgeBasePageContent);
