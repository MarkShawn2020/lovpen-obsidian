'use client';

import type { SearchFilters } from '@/types/knowledge-base';

type KnowledgeBaseFiltersProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
};

export function KnowledgeBaseFilters({ filters: _filters, onFiltersChange: _onFiltersChange }: KnowledgeBaseFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-4">筛选器</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="platform-filters">
            平台来源
          </label>
          <div className="space-y-2" id="platform-filters">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" id="manual-upload" />
              <span className="text-sm">手动上传</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" id="notion" />
              <span className="text-sm">Notion</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="content-type-filters">
            内容类型
          </label>
          <div className="space-y-2" id="content-type-filters">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" id="text-content" />
              <span className="text-sm">文本</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" id="document-content" />
              <span className="text-sm">文档</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
