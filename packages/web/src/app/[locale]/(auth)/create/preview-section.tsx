'use client';

import { Button } from '@/components/ui/Button';

type PreviewPanel = {
  id: string;
  platform: string;
  title: string;
};

type Platform = {
  name: string;
  fullName: string;
  color: string;
};

type PreviewSectionProps = {
  previewPanels: PreviewPanel[];
  platforms: Record<string, Platform>;
  generatedContent: string;
  addPreviewPanel: (platform: string) => void;
  removePreviewPanel: (panelId: string) => void;
  updatePanelPlatform: (panelId: string, platform: string) => void;
};

export function PreviewSection({
  previewPanels,
  platforms,
  generatedContent,
  addPreviewPanel,
  removePreviewPanel,
  updatePanelPlatform,
}: PreviewSectionProps) {
  return (
    <div className="lg:col-span-6 flex flex-col u-gap-m">
      {/* 全局工具栏 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-text-main">内容预览区</h2>
          <div className="flex items-center u-gap-s">
            {/* 添加预览面板按钮 */}
            <div className="flex items-center bg-background-ivory-medium rounded-md border border-border-default/20 p-1">
              {Object.entries(platforms).map(([id, platform]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addPreviewPanel(id)}
                  className="px-2 py-1 text-xs font-medium text-text-main hover:bg-background-main rounded-sm transition-colors"
                  title={`添加${platform.fullName}预览`}
                >
                  + {platform.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 预览面板列表 */}
      <div className="flex-1 u-gap-m flex flex-col overflow-auto">
        {previewPanels.map((panel) => (
          <div key={panel.id} className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden flex flex-col min-h-[400px]">
            {/* 单个预览面板工具栏 */}
            <div className="bg-background-ivory-medium px-6 py-3 border-b border-border-default/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center u-gap-s">
                  <div className={`w-3 h-3 rounded-full ${platforms[panel.platform]?.color}`}></div>
                  <h3 className="font-medium text-text-main text-sm">{panel.title}</h3>
                </div>
                
                <div className="flex items-center u-gap-s">
                  {/* 平台切换选择器 */}
                  <select
                    value={panel.platform}
                    onChange={(e) => updatePanelPlatform(panel.id, e.target.value)}
                    className="text-xs p-1 border border-border-default/20 rounded bg-background-main text-text-main"
                  >
                    {Object.entries(platforms).map(([id, platform]) => (
                      <option key={id} value={id}>{platform.fullName}</option>
                    ))}
                  </select>
                  
                  {/* 面板操作按钮 */}
                  <button
                    type="button"
                    className="text-xs text-text-faded hover:text-text-main transition-colors"
                    title="定制此平台"
                  >
                    ⚙️
                  </button>
                  
                  {previewPanels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePreviewPanel(panel.id)}
                      className="text-xs text-text-faded hover:text-red-500 transition-colors"
                      title="删除此预览"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 单个预览内容区 */}
            <div className="flex-1 p-6">
              {generatedContent ? (
                <div className="bg-background-ivory-medium rounded-md border border-border-default/20 p-6">
                  <pre className="whitespace-pre-wrap font-sans text-text-main leading-relaxed text-sm">
                    {generatedContent}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-text-faded">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-sm">等待内容生成</p>
                  </div>
                </div>
              )}
            </div>

            {/* 单个面板底部操作栏 */}
            {generatedContent && (
              <div className="border-t border-border-default/20 p-4 bg-background-ivory-medium">
                <div className="flex items-center justify-between">
                  <div className="flex items-center u-gap-l text-xs text-text-faded">
                    <span>字数: {generatedContent.length}</span>
                    <span>预计阅读: 2分钟</span>
                  </div>
                  <div className="flex items-center u-gap-s">
                    <Button variant="outline" size="sm" className="text-xs">
                      重新生成
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      编辑
                    </Button>
                    <Button variant="primary" size="sm" className="text-xs">
                      发布到{platforms[panel.platform]?.name}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}