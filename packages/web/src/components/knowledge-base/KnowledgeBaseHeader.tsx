'use client';

import { Plus } from 'lucide-react';

type KnowledgeBaseHeaderProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  totalItems: number;
};

export function KnowledgeBaseHeader({
  onUploadClick,
  totalItems,
}: KnowledgeBaseHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">知识库</h1>
            <div className="text-sm text-gray-500">
              共
              {' '}
              {totalItems}
              {' '}
              个项目
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              添加内容
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
