'use client';

import type { Platform, PlatformSettings } from '@/types/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ConditionalSection } from './SmartSidebar';

type PlatformControlsProps = {
  platforms: Record<string, Platform>;
  selectedPlatforms: string[];
  platformSettings: Record<string, PlatformSettings>;
  onUpdate: (platform: string, settings: Partial<PlatformSettings>) => void;
  currentMode: 'global' | 'platform' | 'multi-select';
  generatedContentLength?: number;
};

export function PlatformControls({
  platforms,
  selectedPlatforms,
  platformSettings,
  onUpdate,
  currentMode,
  generatedContentLength = 0,
}: PlatformControlsProps) {
  if (selectedPlatforms.length === 0) {
    return null;
  }

  // 单平台模式
  if (currentMode === 'platform' && selectedPlatforms.length === 1) {
    const platformId = selectedPlatforms[0];
    if (!platformId) {
      return null;
    }

    const platform = platforms[platformId];
    const settings = platformSettings[platformId] || {};

    if (!platform) {
      return null;
    }

    const maxChars = platform.constraints?.maxCharacters;
    const isOverLimit = maxChars && generatedContentLength > maxChars;

    return (
      <ConditionalSection when="platform" currentMode={currentMode}>
        {/* 平台设置 */}
        <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
          <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
            <div className="flex items-center u-gap-s">
              <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
              <h3 className="font-medium text-text-main">
                {platform.fullName}
                设置
              </h3>
            </div>
          </div>

          <div className="p-6 u-gap-m flex flex-col">
            {/* 内容设置 */}
            <div>
              <label className="block text-sm font-medium text-text-main u-mb-text">
                文章长度
              </label>
              <Select
                value={settings.articleLength || 'medium'}
                onValueChange={(value: 'short' | 'medium' | 'long') =>
                  onUpdate(platformId, { articleLength: value })}
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
              <label className="block text-sm font-medium text-text-main u-mb-text">
                写作风格
              </label>
              <Select
                value={settings.writingStyle || 'professional'}
                onValueChange={(value: 'professional' | 'casual' | 'thoughtful' | 'warm') =>
                  onUpdate(platformId, { writingStyle: value })}
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

            {/* 字数限制显示 */}
            {maxChars && (
              <div>
                <div className="flex items-center justify-between u-mb-text">
                  <span className="text-sm font-medium text-text-main">字数限制</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    isOverLimit
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                  >
                    {generatedContentLength}
                    /
                    {maxChars}
                  </span>
                </div>
                {isOverLimit && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ 内容超出
                    {' '}
                    {platform.name}
                    {' '}
                    平台字数限制
                  </div>
                )}
              </div>
            )}

            {/* 图片处理 */}
            <div>
              <label className="block text-sm font-medium text-text-main u-mb-text">
                图片处理
              </label>
              <Select
                value={settings.imageCompression || 'medium'}
                onValueChange={(value: 'high' | 'medium' | 'low') =>
                  onUpdate(platformId, { imageCompression: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高压缩 (适合移动端)</SelectItem>
                  <SelectItem value="medium">中等压缩 (平衡质量)</SelectItem>
                  <SelectItem value="low">低压缩 (保持质量)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 链接处理 */}
            <div>
              <label className="block text-sm font-medium text-text-main u-mb-text">
                链接处理
              </label>
              <Select
                value={settings.linkHandling || 'preserve'}
                onValueChange={(value: 'preserve' | 'convert-to-text' | 'footnote') =>
                  onUpdate(platformId, { linkHandling: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preserve">保持链接</SelectItem>
                  <SelectItem value="convert-to-text">转为文本</SelectItem>
                  <SelectItem value="footnote">脚注引用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 平台特性 */}
            {(settings.useHashtags !== undefined || settings.includeCallToAction !== undefined) && (
              <div>
                <div className="block text-sm font-medium text-text-main u-mb-text">平台特性</div>
                <div className="u-gap-s flex flex-col">
                  {settings.useHashtags !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-main">使用标签</span>
                      <button
                        type="button"
                        onClick={() => onUpdate(platformId, { useHashtags: !settings.useHashtags })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          settings.useHashtags ? 'bg-primary' : 'bg-border-default'
                        } hover:opacity-90`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                          settings.useHashtags ? 'right-0.5' : 'left-0.5'
                        }`}
                        >
                        </div>
                      </button>
                    </div>
                  )}
                  {settings.includeCallToAction !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-main">包含行动号召</span>
                      <button
                        type="button"
                        onClick={() => onUpdate(platformId, { includeCallToAction: !settings.includeCallToAction })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          settings.includeCallToAction ? 'bg-primary' : 'bg-border-default'
                        } hover:opacity-90`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                          settings.includeCallToAction ? 'right-0.5' : 'left-0.5'
                        }`}
                        >
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 平台约束信息 */}
            {platform.constraints && (
              <div className="bg-background-ivory-medium p-3 rounded text-xs text-text-faded">
                <div className="font-medium u-mb-text">平台要求：</div>
                {platform.constraints.supportedFormats && (
                  <div>
                    支持格式:
                    {' '}
                    {platform.constraints.supportedFormats.join(', ')}
                  </div>
                )}
                {platform.constraints.imageRequirements && (
                  <div>
                    图片要求:
                    {' '}
                    {platform.constraints.imageRequirements.maxSize}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
          <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
            <h3 className="font-medium text-text-main">快速操作</h3>
          </div>

          <div className="p-6 u-gap-s flex flex-col">
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              🔄 重新生成内容
            </button>
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              ✂️ 智能裁剪字数
            </button>
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              🎨 应用
              {platform.name}
              模板
            </button>
            <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
              📤 导出到
              {platform.name}
            </button>
          </div>
        </div>
      </ConditionalSection>
    );
  }

  // 多选模式
  if (currentMode === 'multi-select' && selectedPlatforms.length > 1) {
    return (
      <ConditionalSection when="multi-select" currentMode={currentMode}>
        {/* 统一调整 */}
        <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
          <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-main">统一调整</h3>
              <div className="text-xs text-text-faded bg-orange-100 text-orange-700 px-2 py-1 rounded">
                {selectedPlatforms.length}
                {' '}
                个平台
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 选中的平台列表 */}
            <div className="u-mb-text">
              <div className="text-sm font-medium text-text-main u-mb-text">已选中：</div>
              <div className="flex flex-wrap u-gap-xs">
                {selectedPlatforms.map((platformId) => {
                  const platform = platforms[platformId];
                  if (!platform) {
                    return null;
                  }
                  return (
                    <div key={platformId} className="flex items-center u-gap-xs bg-background-ivory-medium px-2 py-1 rounded text-xs">
                      <div className={`w-2 h-2 rounded-full ${platform.color}`}></div>
                      <span>{platform.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 快速操作 */}
            <div className="u-gap-s flex flex-col">
              <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
                🔄 重新生成全部
              </button>
              <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
                📤 导出全部
              </button>
              <button type="button" className="w-full text-left p-3 text-sm text-text-main hover:bg-background-ivory-medium rounded-md transition-colors">
                🗑️ 移除全部
              </button>
            </div>
          </div>
        </div>

        {/* 统一设置 */}
        <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
          <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
            <h3 className="font-medium text-text-main">统一设置</h3>
          </div>

          <div className="p-6 u-gap-m flex flex-col">
            <div>
              <label className="block text-sm font-medium text-text-main u-mb-text">
                文章长度
              </label>
              <Select
                onValueChange={(value: 'short' | 'medium' | 'long') => {
                  selectedPlatforms.forEach((platformId) => {
                    onUpdate(platformId, { articleLength: value });
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择文章长度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">短文 (300-500字)</SelectItem>
                  <SelectItem value="medium">中等 (800-1200字)</SelectItem>
                  <SelectItem value="long">长文 (1500-2500字)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main u-mb-text">
                写作风格
              </label>
              <Select
                onValueChange={(value: 'professional' | 'casual' | 'thoughtful' | 'warm') => {
                  selectedPlatforms.forEach((platformId) => {
                    onUpdate(platformId, { writingStyle: value });
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择写作风格" />
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
              <label className="block text-sm font-medium text-text-main u-mb-text">
                图片处理
              </label>
              <Select
                onValueChange={(value: 'high' | 'medium' | 'low') => {
                  selectedPlatforms.forEach((platformId) => {
                    onUpdate(platformId, { imageCompression: value });
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择压缩级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高压缩</SelectItem>
                  <SelectItem value="medium">中等压缩</SelectItem>
                  <SelectItem value="low">低压缩</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main u-mb-text">
                链接处理
              </label>
              <Select
                onValueChange={(value: 'preserve' | 'convert-to-text' | 'footnote') => {
                  selectedPlatforms.forEach((platformId) => {
                    onUpdate(platformId, { linkHandling: value });
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择链接处理" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preserve">保持链接</SelectItem>
                  <SelectItem value="convert-to-text">转为文本</SelectItem>
                  <SelectItem value="footnote">脚注引用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </ConditionalSection>
    );
  }

  return null;
}
