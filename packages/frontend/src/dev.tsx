import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { LovpenReactBridge } from './components/LovpenReactBridge'
import { JotaiProvider } from './providers/JotaiProvider'
import { logger } from '../../shared/src/logger'
import { webAdapter } from './adapters/web-adapter'
import { domToPng } from 'modern-screenshot'
import './index.css'

// Types (we'll need to ensure these are available)
interface ExternalReactLib {
  mount: (container: HTMLElement, props: any) => Promise<void>
  update: (container: HTMLElement, props: any) => Promise<void>
  unmount: (container: HTMLElement) => void
}

// Track mounted roots for HMR
const mountedRoots = new Map<HTMLElement, ReactDOM.Root>()

// Wrapper component to manage props updates without remounting JotaiProvider
const LovpenReactWrapper: React.FC<{ initialProps: any; container?: HTMLElement }> = ({ initialProps, container }) => {
  const [props, setProps] = useState(initialProps);
  
  // Expose update function to parent
  useEffect(() => {
    if (container) {
      (container as any).__updateProps = setProps;
    }
  }, [container]);
  
  return <LovpenReactBridge {...props} />;
}

// Create the external library interface for Obsidian plugin
const LovpenReactLib: ExternalReactLib = {
  mount: async (container: HTMLElement, props: any) => {
    logger.debug('Mounting React component');
    let root = mountedRoots.get(container);
    if (!root) {
      root = ReactDOM.createRoot(container);
      mountedRoots.set(container, root);
    }
    // Store props for HMR updates
    (container as any).__lovpenProps = props;
    root.render(
      <JotaiProvider>
        <LovpenReactWrapper initialProps={props} container={container} />
      </JotaiProvider>
    );
  },

  update: async (container: HTMLElement, props: any) => {
    logger.debug('Updating React component');
    
    // Store new props
    (container as any).__lovpenProps = props;
    
    const root = mountedRoots.get(container);
    if (root && (container as any).__updateProps) {
      // Update props without remounting JotaiProvider
      (container as any).__updateProps(props);
    } else if (!root) {
      // If no root exists, mount it
      await LovpenReactLib.mount(container, props);
    }
  },

  unmount: (container: HTMLElement) => {
    logger.debug('Unmounting React component')
    const root = mountedRoots.get(container)
    if (root) {
      root.unmount()
      mountedRoots.delete(container)
    }
  }
}

// Expose to window for Obsidian plugin to access
if (typeof window !== 'undefined') {
  (window as any).LovpenReactLib = LovpenReactLib;
  logger.info('Dev Mode initialized with HMR support');
  
  // Also expose a flag to indicate HMR mode
  (window as any).__LOVPEN_HMR_MODE__ = true;
}

// For standalone development - render mock component if there's a root element
const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  
  // Mock props for development
  const mockProps = {
    settings: {
      defaultStyle: 'default',
      defaultHighlight: 'default',
      defaultTemplate: 'default',
      useTemplate: false,
      lastSelectedTemplate: '',
      enableThemeColor: false,
      themeColor: '#007acc',
      useCustomCss: false,
      authKey: '',
      wxInfo: [],
      expandedAccordionSections: [],
      showStyleUI: true,
      personalInfo: {
        name: 'LovPen Web',
        avatar: { type: 'default' as const },
        bio: '基于 Web 的 Markdown 格式化工具',
        email: '',
        website: ''
      }
    },
    articleHTML: `
      <div class="lovpen">
        <h1>欢迎使用 LovPen Web 版</h1>
        <p>这是一个独立的 Web 应用，可以将 Markdown 格式化并分发到多个平台。</p>
        <h2>主要功能</h2>
        <ul>
          <li>支持多种主题和代码高亮</li>
          <li>模板系统</li>
          <li>多平台分发</li>
        </ul>
        <h2>代码示例</h2>
        <pre><code class="language-javascript">console.log('Hello, LovPen!');</code></pre>
      </div>
    `,
    cssContent: 'body { font-family: system-ui; padding: 20px; }',
    plugins: [],
    onRefresh: () => {
      logger.debug('Refresh clicked');
      new webAdapter.Notice('刷新成功！');
    },
    onCopy: async (mode?: string) => {
      logger.debug('Copy clicked, mode:', mode);

      try {
        if (mode === 'image') {
          // 图片复制模式
          new webAdapter.Notice('正在生成图片...');

          // 查找要截图的元素 - 尝试多个选择器
          let articleElement = document.querySelector('.lovpen') as HTMLElement;
          if (!articleElement) {
            // 如果找不到 .lovpen，尝试查找内容容器
            articleElement = document.querySelector('.lovpen-content-container') as HTMLElement;
          }
          if (!articleElement) {
            new webAdapter.Notice('未找到文章内容，无法生成图片');
            logger.error('找不到 .lovpen 或 .lovpen-content-container 元素');
            return;
          }

          // 先对原始元素截图
          const originalDataUrl = await domToPng(articleElement, {
            quality: 1,
            scale: 2, // 2倍分辨率，提高清晰度
          });

          // 创建 Image 对象加载截图
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = originalDataUrl;
          });

          // 创建 Canvas 添加 padding
          const padding = 40 * 2; // 2倍分辨率，所以 padding 也要 x2
          const canvas = document.createElement('canvas');
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('无法创建 Canvas 上下文');
          }

          // 填充白色背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 绘制截图，添加 padding
          ctx.drawImage(img, padding, padding);

          // 转换为 data URL
          const dataUrl = canvas.toDataURL('image/png', 1.0);

          // 将 data URL 转换为 Blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          // 复制到剪贴板
          await navigator.clipboard.write([new ClipboardItem({
            'image/png': blob
          })]);

          new webAdapter.Notice('已复制图片到剪贴板！');
        } else {
          // HTML 复制模式
          const articleElement = document.querySelector('.lovpen');
          if (!articleElement) {
            new webAdapter.Notice('未找到文章内容');
            return;
          }

          const htmlContent = articleElement.outerHTML;

          await navigator.clipboard.write([new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
          })]);

          const modeText = mode === 'wechat' ? '（微信公众号格式）' :
                          mode === 'zhihu' ? '（知乎格式）' :
                          mode === 'xiaohongshu' ? '（小红书格式）' :
                          mode === 'html' ? '（HTML格式）' : '';
          new webAdapter.Notice(`已复制到剪贴板${modeText}`);
        }
      } catch (error) {
        logger.error('复制失败:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        new webAdapter.Notice(`复制失败: ${errorMessage}`);
      }
    },
    onDistribute: () => {
      logger.debug('Distribute clicked');
      new webAdapter.Notice('分发功能开发中...');
    },
    onTemplateChange: (template: string) => {
      logger.debug('Template changed:', template);
      new webAdapter.Notice(`模板已切换: ${template}`);
    },
    onThemeChange: (theme: string) => {
      logger.debug('Theme changed:', theme);
      new webAdapter.Notice(`主题已切换: ${theme}`);
    },
    onHighlightChange: (highlight: string) => {
      logger.debug('Highlight changed:', highlight);
      new webAdapter.Notice(`代码高亮已切换: ${highlight}`);
    },
    onThemeColorToggle: (enabled: boolean) => logger.debug('Theme color toggle:', enabled),
    onThemeColorChange: (color: string) => logger.debug('Theme color changed:', color),
    onRenderArticle: () => {
      logger.debug('Render article');
      new webAdapter.Notice('文章渲染完成');
    },
    onSaveSettings: () => {
      logger.debug('Save settings');
      new webAdapter.Notice('设置已保存');
    },
    onUpdateCSSVariables: () => logger.debug('CSS variables updated'),
    onPluginToggle: (pluginName: string, enabled: boolean) => {
      logger.debug('Plugin toggle:', pluginName, enabled);
      new webAdapter.Notice(`插件 ${pluginName} 已${enabled ? '启用' : '禁用'}`);
    },
    onPluginConfigChange: (pluginName: string, key: string, value: string | boolean) => logger.debug('Plugin config change:', pluginName, key, value),
    onExpandedSectionsChange: (sections: string[]) => logger.debug('Expanded sections:', sections),
    onArticleInfoChange: (info: any) => logger.debug('Article info:', info),
    onPersonalInfoChange: (info: any) => logger.debug('Personal info:', info),
    onSettingsChange: (settings: any) => {
      logger.debug('Settings change:', settings);
      // 持久化到 localStorage
      webAdapter.persistentStorage.setItem('lovpen-settings', JSON.stringify(settings));
    },
    onKitApply: (kitId: string) => {
      logger.debug('Apply kit:', kitId);
      new webAdapter.Notice(`应用套装: ${kitId}`);
    },
    onKitCreate: (info: any) => {
      logger.debug('Create kit:', info);
      new webAdapter.Notice('套装创建成功');
    },
    onKitDelete: (kitId: string) => {
      logger.debug('Delete kit:', kitId);
      new webAdapter.Notice('套装已删除');
    },
    loadTemplateKits: async () => [],
    loadTemplates: async () => [],
    persistentStorage: webAdapter.persistentStorage as any,
    requestUrl: webAdapter.requestUrl,
  }
  
  root && root.render(
    <JotaiProvider>
      <LovpenReactBridge {...mockProps} />
    </JotaiProvider>
  )
}

// Enable HMR
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept(() => {
    logger.debug('Module updated, re-rendering components');
    
    // Force re-render all mounted components
    mountedRoots.forEach((root, container) => {
      const props = (container as any).__lovpenProps;
      if (props && (container as any).__updateProps) {
        logger.debug('Re-rendering component in container');
        // Just update props, don't remount
        (container as any).__updateProps({...props});
      }
    });
    
    // Notify Obsidian plugin if available
    if ((window as any).__lovpenRefresh) {
      (window as any).__lovpenRefresh();
    }
  });
}