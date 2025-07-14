'use client';

import { GlobalSettings } from '@/types/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ConditionalSection } from './SmartSidebar';

interface GlobalControlsProps {
  settings: GlobalSettings;
  onUpdate: (settings: Partial<GlobalSettings>) => void;
  previewPanelsCount: number;
  currentMode: 'global' | 'platform' | 'multi-select';
}

export function GlobalControls({ 
  settings, 
  onUpdate, 
  previewPanelsCount, 
  currentMode 
}: GlobalControlsProps) {
  return (
    <ConditionalSection when="global" currentMode={currentMode}>
      {/* 创作设置 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
        <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-main">创作设置</h3>
            <div className="text-xs text-text-faded bg-blue-100 text-blue-700 px-2 py-1 rounded">
              全局
            </div>
          </div>
        </div>

        <div className="p-6 u-gap-m flex flex-col">
          <div>
            <label htmlFor="article-length" className="block text-sm font-medium text-text-main u-mb-text">
              文章长度
            </label>
            <Select 
              value={settings.articleLength} 
              onValueChange={(value: 'short' | 'medium' | 'long') => 
                onUpdate({ articleLength: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">短文 (300-500字)</SelectItem>
                <SelectItem value="medium">中等 (800-1200字)</SelectItem>
                <SelectItem value="long">长文 (1500-2500字)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="writing-style" className="block text-sm font-medium text-text-main u-mb-text">
              写作风格
            </label>
            <Select 
              value={settings.writingStyle} 
              onValueChange={(value: 'professional' | 'casual' | 'thoughtful' | 'warm') => 
                onUpdate({ writingStyle: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">专业严谨</SelectItem>
                <SelectItem value="casual">轻松幽默</SelectItem>
                <SelectItem value="thoughtful">深度思考</SelectItem>
                <SelectItem value="warm">温暖感性</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="block text-sm font-medium text-text-main u-mb-text">预览面板</div>
            <div className="text-sm text-text-faded">
              当前共有 {previewPanelsCount} 个预览面板，全局设置将应用到所有平台。
            </div>
          </div>
        </div>
      </div>

      {/* 发布设置 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
        <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-main">发布设置</h3>
            <div className="text-xs text-text-faded bg-blue-100 text-blue-700 px-2 py-1 rounded">
              全局
            </div>
          </div>
        </div>

        <div className="p-6 u-gap-m flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-main">自动配图</span>
            <button 
              type="button" 
              onClick={() => onUpdate({ autoImage: !settings.autoImage })}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                settings.autoImage ? 'bg-primary' : 'bg-border-default'
              } hover:opacity-90`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                settings.autoImage ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-main">SEO优化</span>
            <button 
              type="button" 
              onClick={() => onUpdate({ seoOptimization: !settings.seoOptimization })}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                settings.seoOptimization ? 'bg-primary' : 'bg-border-default'
              } hover:opacity-90`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                settings.seoOptimization ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-main">定时发布</span>
            <button 
              type="button" 
              onClick={() => onUpdate({ scheduledPublishing: !settings.scheduledPublishing })}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                settings.scheduledPublishing ? 'bg-primary' : 'bg-border-default'
              } hover:opacity-90`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                settings.scheduledPublishing ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* AI 助手 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
        <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-main">AI 助手</h3>
            <div className="text-xs text-text-faded bg-blue-100 text-blue-700 px-2 py-1 rounded">
              全局
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="u-gap-s flex flex-col">
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              优化标题
            </button>
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              提取关键词
            </button>
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              内容分析
            </button>
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              风格建议
            </button>
          </div>
        </div>
      </div>
    </ConditionalSection>
  );
}