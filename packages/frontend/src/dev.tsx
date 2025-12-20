import ReactDOM from 'react-dom/client'
import { LovpenReactBridge } from './components/LovpenReactBridge'
import { LovpenReactWrapper } from './components/LovpenReactWrapper'
import { JotaiProvider } from './providers/JotaiProvider'
import { logger } from '../../shared/src/logger'
import { webAdapter } from './adapters/web-adapter'
import { domToPng } from 'modern-screenshot'
import { findScreenshotElement, applyCodeBlockScale } from '@lovpen/shared'
// 🔑 使用 ?inline 导入编译后的 CSS 字符串（供 Shadow DOM 使用）
import compiledCSS from './index.css?inline'
import './index.css'

// Types (we'll need to ensure these are available)
interface ShadowMountOptions {
  shadowRoot?: ShadowRoot;
  portalContainer?: HTMLElement;
  styles?: string[];
}

interface ExternalReactLib {
  mount: (container: HTMLElement, props: any, options?: ShadowMountOptions) => Promise<void>
  update: (container: HTMLElement, props: any) => Promise<void>
  unmount: (container: HTMLElement) => void
}

// Track mounted roots for HMR
const mountedRoots = new Map<HTMLElement, ReactDOM.Root>()

// Create the external library interface for Obsidian plugin
const LovpenReactLib: ExternalReactLib = {
  mount: async (container: HTMLElement, props: any, options?: ShadowMountOptions) => {
    console.log('[LovpenReactLib][Dev] mount() called', {
      containerId: container?.id,
      hasShadowRoot: !!options?.shadowRoot,
      hasProps: !!props
    });

    // Clean up existing root if any
    const existingRoot = mountedRoots.get(container);
    if (existingRoot) {
      existingRoot.unmount();
      mountedRoots.delete(container);
    }

    // Determine the actual mount target
    let mountTarget: HTMLElement = container;
    let portalContainer: HTMLElement | null = null;

    if (options?.shadowRoot) {
      console.log('[LovpenReactLib][Dev] Shadow DOM mode - creating containers');

      // Shadow DOM mode: create mount container inside shadow root
      const shadowContainer = document.createElement('div');
      shadowContainer.id = 'lovpen-shadow-mount';

      // 🔑 使用内联样式直接设置，确保最高优先级
      // CSS 变量会穿透 Shadow DOM，所以必须在这里显式覆盖
      shadowContainer.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: #ffffff !important;
        color: #1a1a1a !important;
        --background: #ffffff;
        --foreground: #1a1a1a;
        --background-primary: #ffffff;
        --background-secondary: #fafafa;
        --text-normal: #1a1a1a;
        --text-muted: #737373;
        --card: #ffffff;
        --card-foreground: #1a1a1a;
        --popover: #ffffff;
        --popover-foreground: #1a1a1a;
        --primary: #CC785C;
        --primary-foreground: #ffffff;
        --secondary: #f5f5f5;
        --secondary-foreground: #2d2d2d;
        --muted: #f5f5f5;
        --muted-foreground: #737373;
        --accent: #f5f5f5;
        --accent-foreground: #2d2d2d;
        --destructive: #dc2626;
        --border: #e5e5e5;
        --input: #e5e5e5;
        --ring: #a3a3a3;
        --radius: 0.625rem;
        --tw-border-style: solid;
      `;

      options.shadowRoot.appendChild(shadowContainer);
      mountTarget = shadowContainer;

      // Create portal container for Radix UI
      const portalDiv = document.createElement('div');
      portalDiv.id = 'lovpen-portal-root';
      portalDiv.style.position = 'relative';
      portalDiv.style.zIndex = '9999';
      options.shadowRoot.appendChild(portalDiv);
      portalContainer = options.portalContainer || portalDiv;

      console.log('[LovpenReactLib][Dev] Shadow containers created');
    }

    // Create new root and render component
    const root = ReactDOM.createRoot(mountTarget);
    mountedRoots.set(container, root);

    // Store props, shadow info, and options for updates/remounts
    (container as any).__lovpenProps = props;
    (container as any).__shadowRoot = options?.shadowRoot;
    (container as any).__portalContainer = portalContainer;
    (container as any).__shadowOptions = options;

    console.log('[LovpenReactLib][Dev] Rendering to mountTarget', {
      mountTargetId: mountTarget.id,
      portalContainerId: portalContainer?.id
    });

    try {
      root.render(
        <JotaiProvider portalContainer={portalContainer}>
          <LovpenReactWrapper initialProps={props} container={container} />
        </JotaiProvider>
      );
      console.log('[LovpenReactLib][Dev] render() completed successfully');
    } catch (error) {
      console.error('[LovpenReactLib][Dev] render() failed:', error);
    }
  },

  update: (container: HTMLElement, props: any) => {
    logger.debug('Updating React component');

    return new Promise<void>((resolve) => {
      // Store new props
      (container as any).__lovpenProps = props;

      const root = mountedRoots.get(container);
      if (root && (container as any).__updateProps) {
        // Update props without remounting JotaiProvider
        (container as any).__updateProps(props);
        // Mirror production update flow to keep CSS variables in sync.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (typeof props.onUpdateCSSVariables === 'function') {
              props.onUpdateCSSVariables();
            }
            resolve();
          });
        });
      } else {
        // If no root exists, mount it with stored options
        const storedOptions = (container as any).__shadowOptions;
        LovpenReactLib.mount(container, props, storedOptions);
        resolve();
      }
    });
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
  // 🔑 暴露编译后的 CSS，供 Obsidian Shadow DOM 使用
  (window as any).__LOVPEN_COMPILED_CSS__ = compiledCSS;
  logger.info('Dev Mode initialized with HMR support');
  logger.info('Compiled CSS length:', compiledCSS.length);

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
      logger.debug('🔥 [DEBUG] Copy clicked, mode:', mode, 'type:', typeof mode);
      logger.debug('🔥 [DEBUG] mode === "image":', mode === 'image');
      logger.debug('🔥 [DEBUG] mode === "wechat":', mode === 'wechat');

      try {
        if (mode === 'image') {
          // 图片复制模式
          logger.debug('🖼️ [图片复制] 开始生成图片...');
          new webAdapter.Notice('正在生成图片...');

          // 使用共享的截图元素查找逻辑
          const result = findScreenshotElement(document);
          if (!result) {
            new webAdapter.Notice('未找到文章内容，无法生成图片');
            logger.error('🖼️ [图片复制] 找不到任何可截图的元素');
            return;
          }

          const { element: articleElement, selector, includesTemplate } = result;
          logger.debug(`🖼️ [图片复制] 使用选择器: ${selector}, 包含模板: ${includesTemplate}`);

          // 先对原始元素截图
          logger.debug('🖼️ [图片复制] 开始截图...');

          // 预处理：将外部图片转换为 data URL 以避免 CORS 问题
          const images = articleElement.querySelectorAll('img');
          const imageData = new Map<HTMLImageElement, { originalSrc: string; dataUrl?: string }>();

          // 使用 fetch 获取图片并转换为 data URL
          await Promise.all(
            Array.from(images).map(async (img) => {
              const src = img.src;
              imageData.set(img, { originalSrc: src });

              // 跳过已经是 data URL 的图片
              if (src.startsWith('data:')) {
                return;
              }

              try {
                logger.debug('🖼️ [图片复制] 正在加载图片:', src);
                // 使用 fetch 获取图片（Web 环境）
                const response = await fetch(src);
                const blob = await response.blob();

                // 转换为 data URL
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });

                imageData.get(img)!.dataUrl = dataUrl;
                img.src = dataUrl;
                logger.debug('🖼️ [图片复制] 图片已转换为 data URL:', src);
              } catch (error) {
                logger.warn('🖼️ [图片复制] 图片加载失败，将使用原始 URL:', src, error);
                // 失败也继续，使用原始 URL
              }
            })
          );

          logger.debug('🖼️ [图片复制] 所有图片预处理完成，开始截图');

          // 从 localStorage 读取设置，判断是否需要缩放代码块
          let scaleCodeBlockInImage = true; // 默认开启
          try {
            const savedSettings = await webAdapter.persistentStorage.getItem('lovpen-settings');
            if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              scaleCodeBlockInImage = parsed.scaleCodeBlockInImage ?? true;
            }
          } catch (e) {
            logger.warn('读取设置失败，使用默认值', e);
          }

          // 预处理：根据设置决定是否缩放溢出的代码块
          const codeBlockScale = scaleCodeBlockInImage ? applyCodeBlockScale(articleElement) : null;

          const originalDataUrl = await domToPng(articleElement, {
            quality: 1,
            scale: 2, // 2倍分辨率，提高清晰度
          });
          logger.debug('🖼️ [图片复制] 截图完成，dataUrl 长度:', originalDataUrl.length);

          // 恢复代码块原始样式
          codeBlockScale?.restore();

          // 恢复原始图片 URL
          images.forEach(img => {
            const data = imageData.get(img);
            if (data && data.dataUrl) {
              img.src = data.originalSrc;
            }
          });

          // 创建 Image 对象加载截图
          logger.debug('🖼️ [图片复制] 加载图片到 Image 对象...');
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              logger.debug('🖼️ [图片复制] 图片加载成功，尺寸:', img.width, 'x', img.height);
              resolve();
            };
            img.onerror = (e) => {
              logger.error('🖼️ [图片复制] 图片加载失败:', e);
              reject(e);
            };
            img.src = originalDataUrl;
          });

          // 创建 Canvas 添加 padding
          const padding = 40 * 2; // 2倍分辨率，所以 padding 也要 x2
          const canvas = document.createElement('canvas');
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2;
          logger.debug('🖼️ [图片复制] 创建 Canvas，尺寸:', canvas.width, 'x', canvas.height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('无法创建 Canvas 上下文');
          }

          // 填充白色背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 绘制截图，添加 padding
          ctx.drawImage(img, padding, padding);
          logger.debug('🖼️ [图片复制] 绘制完成');

          // 转换为 data URL
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          logger.debug('🖼️ [图片复制] 转换为 dataURL，长度:', dataUrl.length);

          // 将 data URL 转换为 Blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          logger.debug('🖼️ [图片复制] 创建 Blob，大小:', blob.size, '字节');

          // 复制到剪贴板
          logger.debug('🖼️ [图片复制] 开始写入剪贴板...');
          await navigator.clipboard.write([new ClipboardItem({
            'image/png': blob
          })]);
          logger.debug('🖼️ [图片复制] 写入剪贴板成功');

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
    onSettingsChange: async (settingsUpdate: any) => {
      logger.debug('Settings change:', settingsUpdate);
      // 合并现有设置后持久化到 localStorage
      try {
        const existing = await webAdapter.persistentStorage.getItem('lovpen-settings');
        const currentSettings = existing ? JSON.parse(existing) : {};
        const mergedSettings = { ...currentSettings, ...settingsUpdate };
        await webAdapter.persistentStorage.setItem('lovpen-settings', JSON.stringify(mergedSettings));
        logger.debug('Settings saved:', mergedSettings);
      } catch (e) {
        logger.error('保存设置失败:', e);
      }
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
  (import.meta as any).hot.accept('./index.css?inline', (mod: { default: string }) => {
    (window as any).__LOVPEN_COMPILED_CSS__ = mod.default;
    if ((window as any).__lovpenRefresh) {
      (window as any).__lovpenRefresh();
    }
  });
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
