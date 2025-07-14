'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PreviewSection } from './preview-section';

export default function Create() {
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPanels, setPreviewPanels] = useState([
    { id: 'preview-1', platform: 'wechat', title: '微信公众号预览' },
  ]);

  const platforms = {
    wechat: { name: '微信', fullName: '微信公众号', color: 'bg-green-500' },
    zhihu: { name: '知乎', fullName: '知乎专栏', color: 'bg-blue-500' },
    xiaohongshu: { name: '小红书', fullName: '小红书笔记', color: 'bg-pink-500' },
    twitter: { name: 'Twitter', fullName: 'Twitter动态', color: 'bg-sky-500' },
  };

  const addPreviewPanel = (platform: string) => {
    const newId = `preview-${Date.now()}`;
    const newPanel = {
      id: newId,
      platform,
      title: `${platforms[platform].fullName}预览`,
    };
    setPreviewPanels([...previewPanels, newPanel]);
  };

  const removePreviewPanel = (panelId: string) => {
    if (previewPanels.length > 1) {
      setPreviewPanels(previewPanels.filter(panel => panel.id !== panelId));
    }
  };

  const updatePanelPlatform = (panelId: string, platform: string) => {
    setPreviewPanels(previewPanels.map(panel =>
      panel.id === panelId
        ? { ...panel, platform, title: `${platforms[platform].fullName}预览` }
        : panel,
    ));
  };

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
    <div className="min-h-screen bg-background-main">
      {/* 简洁工具栏 */}
      <div className="bg-background-main border-b border-border-default/20 py-4 sticky top-0 z-50">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center u-gap-l">
              <div className="flex items-center u-gap-s">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-medium text-sm">
                  L
                </div>
                <div>
                  <h1 className="u-display-s font-serif">LovPen Studio</h1>
                  <p className="text-sm text-text-faded">智能创作工作台</p>
                </div>
              </div>
            </div>

            <div className="flex items-center u-gap-s">
              <Button
                variant="primary"
                size="md"
                disabled={!generatedContent}
                className="font-medium"
              >
                发布
              </Button>

              {/* 用户头像按钮 */}
              <div className="relative">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium hover:opacity-90 transition-opacity"
                >
                  M
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* 三栏布局主工作区 */}
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
            updatePanelPlatform={updatePanelPlatform}
          />

          {/* 右侧设置面板 */}
          <div className="lg:col-span-3 flex flex-col u-gap-m">
            {/* 创作设置 */}
            <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
              <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
                <h3 className="font-medium text-text-main">
                  创作设置
                </h3>
              </div>

              <div className="p-6 u-gap-m flex flex-col">
                <div>
                  <label htmlFor="article-length" className="block text-sm font-medium text-text-main u-mb-text">文章长度</label>
                  <select id="article-length" className="w-full p-3 border border-border-default/20 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-text-main">
                    <option>短文 (300-500字)</option>
                    <option>中等 (800-1200字)</option>
                    <option>长文 (1500-2500字)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="writing-style" className="block text-sm font-medium text-text-main u-mb-text">写作风格</label>
                  <select id="writing-style" className="w-full p-3 border border-border-default/20 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-text-main">
                    <option>专业严谨</option>
                    <option>轻松幽默</option>
                    <option>深度思考</option>
                    <option>温暖感性</option>
                  </select>
                </div>
                <div>
                  <div className="block text-sm font-medium text-text-main u-mb-text">预览面板</div>
                  <div className="text-sm text-text-faded">
                    当前共有
                    {' '}
                    {previewPanels.length}
                    {' '}
                    个预览面板，每个面板可以独立配置平台和样式。
                  </div>
                </div>
              </div>
            </div>

            {/* 发布设置 */}
            <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
              <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
                <h3 className="font-medium text-text-main">
                  发布设置
                </h3>
              </div>

              <div className="p-6 u-gap-m flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-main">自动配图</span>
                  <button type="button" className="w-10 h-5 bg-primary rounded-full relative transition-opacity hover:opacity-90">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-main">SEO优化</span>
                  <button type="button" className="w-10 h-5 bg-border-default rounded-full relative transition-colors hover:bg-primary">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-main">定时发布</span>
                  <button type="button" className="w-10 h-5 bg-border-default rounded-full relative transition-colors hover:bg-primary">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* AI 助手 */}
            <div className="bg-background-main rounded-lg border border-border-default/20 overflow-hidden">
              <div className="bg-background-ivory-medium px-6 py-4 border-b border-border-default/20">
                <h3 className="font-medium text-text-main">
                  AI 助手
                </h3>
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
          </div>
        </div>
      </Container>
    </div>
  );
};
