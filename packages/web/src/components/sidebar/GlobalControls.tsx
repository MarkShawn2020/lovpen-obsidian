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
          <h3 className="font-medium text-text-main">创作设置</h3>
        </div>

        <div className="p-6 u-gap-m flex flex-col">
          <div>
            <label htmlFor="content-template" className="block text-sm font-medium text-text-main u-mb-text">
              内容模板
            </label>
            <Select 
              value={settings.contentTemplate} 
              onValueChange={(value: 'custom' | 'blog' | 'news' | 'tutorial' | 'review') => 
                onUpdate({ contentTemplate: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">博客文章</SelectItem>
                <SelectItem value="news">新闻报道</SelectItem>
                <SelectItem value="tutorial">教程指南</SelectItem>
                <SelectItem value="review">评测分析</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="target-audience" className="block text-sm font-medium text-text-main u-mb-text">
              目标受众
            </label>
            <Select 
              value={settings.targetAudience} 
              onValueChange={(value: 'general' | 'professional' | 'academic' | 'casual') => 
                onUpdate({ targetAudience: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">普通读者</SelectItem>
                <SelectItem value="professional">专业人士</SelectItem>
                <SelectItem value="academic">学术受众</SelectItem>
                <SelectItem value="casual">休闲阅读</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="block text-sm font-medium text-text-main u-mb-text">预览面板</div>
            <div className="text-sm text-text-faded whitespace-nowrap overflow-hidden text-ellipsis">
              当前 {previewPanelsCount} 个面板，点击可专门设置
            </div>
          </div>
        </div>
      </div>

      {/* 发布设置 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
        <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
          <h3 className="font-medium text-text-main">发布设置</h3>
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
          <h3 className="font-medium text-text-main">AI 助手</h3>
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