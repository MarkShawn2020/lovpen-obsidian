'use client';

import type { Platform } from '@/types/sidebar';
import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { GlobalControls } from '@/components/sidebar/GlobalControls';
import { PlatformControls } from '@/components/sidebar/PlatformControls';
import { SmartSidebar } from '@/components/sidebar/SmartSidebar';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useSidebarContext } from '@/hooks/useSidebarContext';
import { PreviewSection } from './preview-section';

export default function Create() {
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPanels, setPreviewPanels] = useState([
    { id: 'preview-1', platform: 'wechat', title: '微信公众号预览', isSelected: false },
  ]);

  // 智能侧边栏状态管理
  const {
    sidebarContext,
    updateContext,
    updateGlobalSettings,
    updatePlatformSettings,
    selectPanels,
    getSelectedPlatforms,
  } = useSidebarContext();

  const platforms: Record<string, Platform> = {
    wechat: {
      name: '微信',
      fullName: '微信公众号',
      color: 'bg-green-500',
      constraints: {
        maxCharacters: 2000,
        supportedFormats: ['text', 'image', 'video'],
        imageRequirements: { maxSize: '20MB', formats: ['JPG', 'PNG'] },
      },
    },
    zhihu: {
      name: '知乎',
      fullName: '知乎专栏',
      color: 'bg-blue-500',
      constraints: {
        maxCharacters: 5000,
        supportedFormats: ['text', 'image', 'code', 'formula'],
        imageRequirements: { maxSize: '5MB', formats: ['JPG', 'PNG', 'GIF'] },
      },
    },
    xiaohongshu: {
      name: '小红书',
      fullName: '小红书笔记',
      color: 'bg-pink-500',
      constraints: {
        maxCharacters: 1000,
        supportedFormats: ['text', 'image', 'hashtag'],
        imageRequirements: { maxSize: '10MB', formats: ['JPG', 'PNG'] },
      },
    },
    twitter: {
      name: 'Twitter',
      fullName: 'Twitter动态',
      color: 'bg-sky-500',
      constraints: {
        maxCharacters: 280,
        supportedFormats: ['text', 'image', 'video', 'link'],
        imageRequirements: { maxSize: '5MB', formats: ['JPG', 'PNG', 'GIF'] },
      },
    },
  };

  const addPreviewPanel = (platform: string) => {
    const newId = `preview-${Date.now()}`;
    const platformInfo = platforms[platform];
    if (!platformInfo) {
      return;
    }

    const newPanel = {
      id: newId,
      platform,
      title: `${platformInfo.fullName}预览`,
      isSelected: false,
    };
    setPreviewPanels([...previewPanels, newPanel]);
  };

  const removePreviewPanel = (panelId: string) => {
    if (previewPanels.length > 1) {
      setPreviewPanels(previewPanels.filter(panel => panel.id !== panelId));
    }
  };

  const reorderPreviewPanels = (panels: Array<{ id: string; platform: string; title: string; isSelected?: boolean }>) => {
    setPreviewPanels(panels.map(panel => ({ ...panel, isSelected: panel.isSelected ?? false })));
  };

  // 处理面板选择
  const handlePanelSelect = (panelId: string, isCtrlClick = false) => {
    let newSelectedPanels: string[] = [];

    if (!isCtrlClick) {
      // 普通点击：清除其他选择，只选择当前面板
      newSelectedPanels = [panelId];
      setPreviewPanels(panels =>
        panels.map(panel => ({
          ...panel,
          isSelected: panel.id === panelId,
        })),
      );
    } else {
      // Ctrl+点击：切换当前面板选择状态
      const currentlySelected = previewPanels.filter(p => p.isSelected).map(p => p.id);
      const isCurrentlySelected = currentlySelected.includes(panelId);

      if (isCurrentlySelected) {
        newSelectedPanels = currentlySelected.filter(id => id !== panelId);
      } else {
        newSelectedPanels = [...currentlySelected, panelId];
      }

      setPreviewPanels(panels =>
        panels.map(panel => ({
          ...panel,
          isSelected: newSelectedPanels.includes(panel.id),
        })),
      );
    }

    // 直接设置选中的面板，而不是切换
    selectPanels(newSelectedPanels);
  };

  // 处理背景点击（清除选择）
  const handleBackgroundClick = () => {
    setPreviewPanels(panels =>
      panels.map(panel => ({ ...panel, isSelected: false })),
    );
    selectPanels([]); // 使用 selectPanels 而不是 clearSelection
  };

  // 处理侧边栏上下文变更
  const handleContextChange = (updates: Partial<typeof sidebarContext>) => {
    updateContext(updates);

    // 如果切换到全局模式或清除选择，同步面板状态
    if (updates.mode === 'global' || (updates.selectedPanels && updates.selectedPanels.length === 0)) {
      setPreviewPanels(panels =>
        panels.map(panel => ({ ...panel, isSelected: false })),
      );
    }

    // 如果指定了选中的面板，同步面板状态
    if (updates.selectedPanels && updates.selectedPanels.length > 0) {
      setPreviewPanels(panels =>
        panels.map(panel => ({
          ...panel,
          isSelected: updates.selectedPanels!.includes(panel.id),
        })),
      );
    }
  };

  // 获取当前选中的平台
  const selectedPlatforms = getSelectedPlatforms(previewPanels);

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // 模拟语音识别
    if (!isRecording) {
      setTimeout(() => {
        setTextInput('刚才突然想到一个观点，关于AI和人类创作的关系...');
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleGenerate = () => {
    if (!textInput.trim()) {
      return;
    }

    setIsGenerating(true);
    // 模拟内容生成
    setTimeout(() => {
      setGeneratedContent(`# AI与人类创作的共生关系

在当今这个AI技术飞速发展的时代，我们不禁要问：AI会取代人类的创作吗？

## 观点阐述

通过我的观察，我认为AI和人类在创作领域更像是共生关系，而非竞争关系。

AI擅长：
- 快速处理大量信息
- 提供结构化的内容框架  
- 优化语言表达

人类擅长：
- 情感的真实表达
- 独特的观点和洞察
- 创意的突破性思考

## 结论

未来的创作模式应该是人机协作，让AI处理繁重的信息整理工作，而人类专注于更有价值的创意输出。

---
*本文由 LovPen 协助生成*`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <Container>
      <div className="u-grid-desktop u-gap-l u-mt-gutter min-h-[calc(100vh-120px)]">
        {/* 左侧输入面板 */}
        <div className="lg:col-span-3 flex flex-col u-gap-m">
          {/* 输入方式选择 */}
          <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
            <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
              <h3 className="font-medium text-text-main">
                创作输入
              </h3>
            </div>

            <div className="p-6">
              <Tabs defaultValue="voice">
                <TabsList className="flex w-full border-b border-border-default/20">
                  <TabsTrigger value="voice" className="px-4 py-2 font-medium text-sm">
                    语音
                  </TabsTrigger>
                  <TabsTrigger value="text" className="px-4 py-2 font-medium text-sm">
                    文字
                  </TabsTrigger>
                  <TabsTrigger value="file" className="px-4 py-2 font-medium text-sm">
                    文档
                  </TabsTrigger>
                </TabsList>

                {/* 语音输入 */}
                <TabsContent value="voice" className="mt-6">
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto u-mb-text rounded-full flex items-center justify-center text-xl transition-all ${
                      isRecording
                        ? 'bg-primary/20 border-2 border-primary animate-pulse'
                        : 'bg-background-ivory-medium border-2 border-border-default/20 hover:border-primary cursor-pointer'
                    }`}
                    >
                      {isRecording ? '🎙️' : '🎤'}
                    </div>
                    <Button
                      variant={isRecording ? 'secondary' : 'primary'}
                      size="md"
                      onClick={handleVoiceRecord}
                      className="w-full u-mb-text"
                    >
                      {isRecording ? '停止录音' : '开始语音'}
                    </Button>
                    <p className="text-sm text-text-faded">
                      {isRecording ? '正在录音中...' : '点击开始语音输入'}
                    </p>
                  </div>
                </TabsContent>

                {/* 文字输入 */}
                <TabsContent value="text" className="mt-6">
                  <div className="u-gap-m flex flex-col">
                    <textarea
                      placeholder="在这里输入你的想法、观点或灵感..."
                      className="w-full h-32 p-4 border border-border-default/20 rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text-main"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-faded">
                        {textInput.length}
                        {' '}
                        字符
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setTextInput('')}>
                        清空
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* 文档上传 */}
                <TabsContent value="file" className="mt-6">
                  <div className="border-2 border-dashed border-border-default/20 rounded-md p-8 text-center hover:border-primary hover:bg-background-ivory-medium transition-all cursor-pointer">
                    <div className="text-2xl u-mb-text">📎</div>
                    <p className="text-sm text-text-faded u-mb-text">拖拽文件到这里</p>
                    <Button variant="outline" size="sm">
                      选择文件
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* 快速生成按钮 */}
          <div className="bg-background-main rounded-lg border border-border-default/20 p-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={!textInput.trim() || isGenerating}
              className="w-full font-medium"
            >
              {isGenerating
                ? (
                    <div className="flex items-center u-gap-s">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>AI 创作中...</span>
                    </div>
                  )
                : (
                    <span>智能生成文章</span>
                  )}
            </Button>
          </div>

          {/* 历史记录 */}
          <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
            <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
              <h3 className="font-medium text-text-main">最近输入</h3>
            </div>
            <div className="p-6 u-gap-s flex flex-col">
              <div className="text-sm p-3 bg-background-ivory-medium rounded-md cursor-pointer hover:bg-background-oat transition-colors">
                "关于远程工作的思考..."
              </div>
              <div className="text-sm p-3 bg-background-ivory-medium rounded-md cursor-pointer hover:bg-background-oat transition-colors">
                "今天在咖啡店看到..."
              </div>
              <div className="text-sm p-3 bg-background-ivory-medium rounded-md cursor-pointer hover:bg-background-oat transition-colors">
                "AI技术的发展..."
              </div>
            </div>
          </div>
        </div>

        {/* 中间内容预览区域 */}
        <PreviewSection
          previewPanels={previewPanels}
          platforms={platforms}
          generatedContent={generatedContent}
          addPreviewPanel={addPreviewPanel}
          removePreviewPanel={removePreviewPanel}
          reorderPreviewPanels={reorderPreviewPanels}
          onPanelSelect={handlePanelSelect}
          onBackgroundClick={handleBackgroundClick}
        />

        {/* 右侧智能设置面板 */}
        <SmartSidebar
          context={sidebarContext}
          onContextChange={handleContextChange}
        >
          <GlobalControls
            settings={sidebarContext.globalSettings}
            onUpdate={updateGlobalSettings}
            previewPanelsCount={previewPanels.length}
            currentMode={sidebarContext.mode}
          />

          <PlatformControls
            platforms={platforms}
            selectedPlatforms={selectedPlatforms}
            platformSettings={sidebarContext.platformOverrides}
            onUpdate={updatePlatformSettings}
            currentMode={sidebarContext.mode}
            generatedContentLength={generatedContent.length}
          />
        </SmartSidebar>
      </div>
    </Container>
  );
};
