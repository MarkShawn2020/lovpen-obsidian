'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function Create() {
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* 专业工具栏 */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 py-3 sticky top-0 z-50">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  L
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">LovPen Studio</h1>
                  <p className="text-xs text-gray-500">智能创作工作台</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-1 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-orange-700 font-medium">7月19日正式上线</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>保存草稿</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!generatedContent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>发布</span>
              </Button>
              
              {/* 用户头像按钮 */}
              <div className="relative">
                <button 
                  type="button"
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg transition-all duration-200"
                >
                  M
                </button>
                {/* 下拉菜单 (可以后续添加) */}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* 三栏布局主工作区 */}
      <Container>
        <div className="grid lg:grid-cols-12 gap-6 mt-6 h-[calc(100vh-120px)]">
          {/* 左侧输入面板 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 输入方式选择 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200/60">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>创作输入</span>
                </h3>
              </div>

              <div className="p-4">
                <Tabs defaultValue="voice">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="voice" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      语音
                    </TabsTrigger>
                    <TabsTrigger value="text" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      文字
                    </TabsTrigger>
                    <TabsTrigger value="file" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      文档
                    </TabsTrigger>
                  </TabsList>

                  {/* 语音输入 */}
                  <TabsContent value="voice" className="mt-4">
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                        isRecording
                          ? 'bg-gradient-to-br from-red-100 to-red-200 border-3 border-red-300 animate-pulse'
                          : 'bg-gradient-to-br from-blue-100 to-blue-200 border-3 border-blue-300 hover:from-blue-200 hover:to-blue-300 cursor-pointer'
                      }`}
                      >
                        {isRecording ? '🎙️' : '🎤'}
                      </div>
                      <Button
                        variant={isRecording ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={handleVoiceRecord}
                        className="w-full mb-3 text-xs"
                      >
                        {isRecording ? '⏹️ 停止录音' : '🎙️ 开始语音'}
                      </Button>
                      <p className="text-xs text-gray-500">
                        {isRecording ? '正在录音中...' : '点击开始语音输入'}
                      </p>
                    </div>
                  </TabsContent>

                  {/* 文字输入 */}
                  <TabsContent value="text" className="mt-4">
                    <div className="space-y-3">
                      <textarea
                        placeholder="在这里输入你的想法、观点或灵感..."
                        className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {textInput.length}
                          {' '}
                          字符
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setTextInput('')} className="text-xs">
                          清空
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 文档上传 */}
                  <TabsContent value="file" className="mt-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer">
                      <div className="text-2xl mb-2">📎</div>
                      <p className="text-xs text-gray-600 mb-2">拖拽文件到这里</p>
                      <Button variant="outline" size="sm" className="text-xs">
                        选择文件
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* 快速生成按钮 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                disabled={!textInput.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10 text-sm font-medium"
              >
                {isGenerating
                  ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>AI 创作中...</span>
                      </div>
                    )
                  : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>智能生成文章</span>
                      </div>
                    )}
              </Button>
            </div>

            {/* 历史记录 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200/60">
                <h3 className="font-semibold text-gray-900 text-sm">最近输入</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                  "关于远程工作的思考..."
                </div>
                <div className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                  "今天在咖啡店看到..."
                </div>
                <div className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                  "AI技术的发展..."
                </div>
              </div>
            </div>
          </div>

          {/* 中间内容预览区 */}
          <div className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden flex flex-col">
            {/* 预览工具栏 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>内容预览</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                    <button type="button" className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md flex items-center space-x-1">
                      <span>📱</span>
                      <span>微信</span>
                    </button>
                    <button type="button" className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md flex items-center space-x-1">
                      <span>🎓</span>
                      <span>知乎</span>
                    </button>
                    <button type="button" className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md flex items-center space-x-1">
                      <span>🌸</span>
                      <span>小红书</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 内容预览区 */}
            <div className="flex-1 p-6 overflow-auto">
              {generatedContent
                ? (
                    <div className="prose max-w-none">
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-6">
                        <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm">
                          {generatedContent}
                        </pre>
                      </div>
                    </div>
                  )
                : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">等待内容生成</h3>
                        <p className="text-sm text-gray-500">输入你的想法，然后点击"智能生成文章"</p>
                      </div>
                    </div>
                  )}
            </div>

            {/* 底部操作栏 */}
            {generatedContent && (
              <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>
                      字数:
                      {generatedContent.length}
                    </span>
                    <span>预计阅读: 2分钟</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      🔄 重新生成
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      ✏️ 编辑
                    </Button>
                    <Button variant="primary" size="sm" className="text-xs bg-gradient-to-r from-purple-600 to-purple-700">
                      🎨 美化排版
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧设置面板 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 创作设置 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200/60">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>创作设置</span>
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="article-length" className="block text-xs font-medium text-gray-700 mb-2">文章长度</label>
                  <select id="article-length" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option>📝 短文 (300-500字)</option>
                    <option>📄 中等 (800-1200字)</option>
                    <option>📚 长文 (1500-2500字)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="writing-style" className="block text-xs font-medium text-gray-700 mb-2">写作风格</label>
                  <select id="writing-style" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option>🎯 专业严谨</option>
                    <option>😊 轻松幽默</option>
                    <option>🤔 深度思考</option>
                    <option>❤️ 温暖感性</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="target-platform" className="block text-xs font-medium text-gray-700 mb-2">目标平台</label>
                  <select id="target-platform" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option>📱 微信公众号</option>
                    <option>🎓 知乎专栏</option>
                    <option>🌸 小红书笔记</option>
                    <option>🐦 Twitter动态</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 发布设置 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200/60">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>发布设置</span>
                </h3>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">自动配图</span>
                  <button type="button" className="w-8 h-4 bg-blue-500 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">SEO优化</span>
                  <button type="button" className="w-8 h-4 bg-gray-300 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">定时发布</span>
                  <button type="button" className="w-8 h-4 bg-gray-300 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* AI 助手 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200/60">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>AI 助手</span>
                </h3>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  <button type="button" className="w-full text-left p-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    💡 优化标题
                  </button>
                  <button type="button" className="w-full text-left p-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    🎯 提取关键词
                  </button>
                  <button type="button" className="w-full text-left p-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    📊 内容分析
                  </button>
                  <button type="button" className="w-full text-left p-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    🎨 风格建议
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
