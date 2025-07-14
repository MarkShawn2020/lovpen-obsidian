'use client';

import type { KnowledgeItem } from '@/types/knowledge-base';
import { X } from 'lucide-react';

type KnowledgeBaseDetailProps = {
  item: KnowledgeItem;
  onClose: () => void;
  onUpdate: (item: KnowledgeItem) => void;
  onDelete: (itemId: string) => void;
};

export function KnowledgeBaseDetail({ item, onClose }: KnowledgeBaseDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {item.title || '无标题'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">内容</h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {item.content || '暂无内容'}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {item.tags.length > 0
                ? (
                    item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))
                  )
                : (
                    <span className="text-gray-500 text-sm">暂无标签</span>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
