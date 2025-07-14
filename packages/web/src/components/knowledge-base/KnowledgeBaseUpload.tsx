'use client';

import type { KnowledgeItem } from '@/types/knowledge-base';
import { X } from 'lucide-react';
import { useState } from 'react';

type KnowledgeBaseUploadProps = {
  onClose: () => void;
  onComplete: (items: KnowledgeItem[]) => void;
};

export function KnowledgeBaseUpload({ onClose, onComplete }: KnowledgeBaseUploadProps) {
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');

  const handleSubmit = async () => {
    // 这里应该调用 API 创建知识库项目
    // 现在只是示例代码
    onComplete([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">添加内容</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题（可选）
              </label>
              <input
                type="text"
                value={textTitle}
                onChange={e => setTextTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="输入或粘贴内容"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!textContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              添加到知识库
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
