'use client';

import type { KnowledgeItem } from '@/types/knowledge-base';

type KnowledgeBaseListProps = {
  items: KnowledgeItem[];
  onItemSelect: (item: KnowledgeItem) => void;
  selectedItemId?: string;
};

export function KnowledgeBaseList({ items, onItemSelect, selectedItemId }: KnowledgeBaseListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>暂无内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onItemSelect(item)}
          className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedItemId === item.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        >
          <h3 className="font-medium text-gray-900 mb-2">
            {item.title || '无标题'}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {item.content?.substring(0, 150) || '暂无内容'}
            {item.content && item.content.length > 150 && '...'}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>{item.sourcePlatform}</span>
              <span>•</span>
              <span>{item.contentType}</span>
            </div>
            <span>
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
