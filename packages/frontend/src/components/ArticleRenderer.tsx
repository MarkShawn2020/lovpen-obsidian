import React, { useRef, useEffect, memo } from 'react';
import { domToPng } from 'modern-screenshot';
import { domUpdater } from '../utils/domUpdater';

interface ArticleRendererProps {
  html: string;
}

/**
 * 创建复制按钮（原生 DOM）
 */
function createCopyButton(codeElement: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'lovpen-code-copy-btn';
  btn.title = '复制代码';
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

  Object.assign(btn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.8)',
    transition: 'all 0.2s',
    zIndex: '20',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    btn.style.color = '#fff';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.3)';
    btn.style.color = 'rgba(255,255,255,0.8)';
  });

  btn.addEventListener('click', async () => {
    const text = codeElement.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      btn.title = '已复制';
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        btn.title = '复制代码';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });

  return btn;
}

/**
 * 创建复制为图片按钮（原生 DOM）
 */
function createCopyAsImageButton(preElement: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'lovpen-code-copy-img-btn';
  btn.title = '复制为图片';
  // 图片图标
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

  Object.assign(btn.style, {
    position: 'absolute',
    top: '8px',
    right: '40px', // 在复制按钮左边
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.8)',
    transition: 'all 0.2s',
    zIndex: '20',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    btn.style.color = '#fff';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.3)';
    btn.style.color = 'rgba(255,255,255,0.8)';
  });

  btn.addEventListener('click', async () => {
    try {
      // 检查是否有 zoom 缩放
      const zoomValue = preElement.style.getPropertyValue('zoom');
      const zoomRatio = zoomValue ? parseFloat(zoomValue) : 1;
      const hasZoom = zoomValue && zoomRatio < 1;

      // 克隆元素到隐藏容器进行截图，避免抖动
      const clone = preElement.cloneNode(true) as HTMLElement;

      // 移除克隆元素中的按钮
      clone.querySelectorAll('.lovpen-code-copy-btn, .lovpen-code-copy-img-btn').forEach(el => el.remove());

      // 如果有 zoom，在克隆元素上移除并展开
      if (hasZoom) {
        clone.style.removeProperty('zoom');
        clone.style.overflow = 'visible';
        clone.style.width = 'fit-content';
        clone.style.maxWidth = 'none';
      }

      // 创建不可见容器（opacity: 0 保证可渲染但不可见）
      const container = document.createElement('div');
      Object.assign(container.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '-1',
      });
      container.appendChild(clone);
      document.body.appendChild(container);

      // 截图克隆元素
      const dataUrl = await domToPng(clone, {
        scale: 2,
        backgroundColor: null,
      });

      // 清理
      document.body.removeChild(container);

      let finalBlob: Blob;

      if (hasZoom) {
        // 用 Canvas 缩放图片以模拟 zoom 效果
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });

        const canvas = document.createElement('canvas');
        const targetWidth = Math.round(img.width * zoomRatio);
        const targetHeight = Math.round(img.height * zoomRatio);
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        finalBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/png');
        });
      } else {
        // 无缩放，直接使用原图
        const res = await fetch(dataUrl);
        finalBlob = await res.blob();
      }

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': finalBlob })
      ]);

      // 成功反馈
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      btn.title = '已复制';
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
        btn.title = '复制为图片';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy as image:', err);
    }
  });

  return btn;
}

/**
 * 创建信息查看按钮（原生 DOM）
 * 显示代码块的语言、行数、字符数等信息
 */
function createInfoButton(codeElement: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'lovpen-code-info-btn';
  btn.title = '查看信息';
  // info 图标
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  Object.assign(btn.style, {
    position: 'absolute',
    top: '8px',
    right: '104px', // 在上传按钮左边
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.8)',
    transition: 'all 0.2s',
    zIndex: '20',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    btn.style.color = '#fff';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.3)';
    btn.style.color = 'rgba(255,255,255,0.8)';
  });

  // 创建 tooltip 弹窗
  let tooltip: HTMLDivElement | null = null;

  const showTooltip = () => {
    if (tooltip) return;

    // 获取代码信息
    const text = codeElement.textContent || '';
    const lines = text.split('\n');
    const lineCount = lines.length;
    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    // 从 class 获取语言（如 language-javascript）
    const langClass = Array.from(codeElement.classList).find(c => c.startsWith('language-'));
    const language = langClass ? langClass.replace('language-', '') : 'plain text';

    tooltip = document.createElement('div');
    tooltip.className = 'lovpen-code-info-tooltip';
    tooltip.innerHTML = `
      <div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;">代码信息</div>
      <div style="display:flex;justify-content:space-between;gap:16px;"><span>语言</span><span>${language}</span></div>
      <div style="display:flex;justify-content:space-between;gap:16px;"><span>行数</span><span>${lineCount}</span></div>
      <div style="display:flex;justify-content:space-between;gap:16px;"><span>字符</span><span>${charCount}</span></div>
      <div style="display:flex;justify-content:space-between;gap:16px;"><span>单词</span><span>${wordCount}</span></div>
    `;

    Object.assign(tooltip.style, {
      position: 'absolute',
      top: '36px',
      right: '104px',
      padding: '8px 12px',
      borderRadius: '6px',
      backgroundColor: 'rgba(0,0,0,0.85)',
      color: '#fff',
      fontSize: '12px',
      lineHeight: '1.6',
      zIndex: '30',
      minWidth: '120px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    });

    btn.parentElement?.appendChild(tooltip);
  };

  const hideTooltip = () => {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  };

  btn.addEventListener('mouseenter', showTooltip);
  btn.addEventListener('mouseleave', hideTooltip);

  return btn;
}

/**
 * 创建上传为图片按钮（原生 DOM）
 * 截图代码块并上传到云存储，替换源Markdown
 */
function createUploadAsImageButton(preElement: HTMLElement, codeElement: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'lovpen-code-upload-btn';
  btn.title = '上传为图片';
  // 上传图标
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

  Object.assign(btn.style, {
    position: 'absolute',
    top: '8px',
    right: '72px', // 在复制为图片按钮左边
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.8)',
    transition: 'all 0.2s',
    zIndex: '20',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    btn.style.color = '#fff';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = 'rgba(0,0,0,0.3)';
    btn.style.color = 'rgba(255,255,255,0.8)';
  });

  btn.addEventListener('click', async () => {
    try {
      // 检查API是否可用
      const api = (window as any).lovpenReactAPI;
      if (!api?.uploadCodeBlockAsImage) {
        console.error('uploadCodeBlockAsImage API not available');
        return;
      }

      // 显示加载状态
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`;
      btn.title = '上传中...';

      // 克隆元素截图
      const clone = preElement.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.lovpen-code-copy-btn, .lovpen-code-copy-img-btn, .lovpen-code-upload-btn, .lovpen-code-info-btn, .lovpen-code-info-tooltip').forEach(el => el.remove());

      // 处理 zoom
      const zoomValue = preElement.style.getPropertyValue('zoom');
      const zoomRatio = zoomValue ? parseFloat(zoomValue) : 1;
      const hasZoom = zoomValue && zoomRatio < 1;

      if (hasZoom) {
        clone.style.removeProperty('zoom');
        clone.style.overflow = 'visible';
        clone.style.width = 'fit-content';
        clone.style.maxWidth = 'none';
      }

      const container = document.createElement('div');
      Object.assign(container.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '-1',
      });
      container.appendChild(clone);
      document.body.appendChild(container);

      let dataUrl = await domToPng(clone, { scale: 2, backgroundColor: null });
      document.body.removeChild(container);

      // 如果有 zoom，缩放图片
      if (hasZoom) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * zoomRatio);
        canvas.height = Math.round(img.height * zoomRatio);
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/png');
      }

      // 获取代码内容用于匹配
      const codeContent = codeElement.textContent || '';

      // 调用API上传并替换
      const result = await api.uploadCodeBlockAsImage(codeContent, dataUrl);

      if (result.success) {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        btn.title = result.error || '已上传';
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        btn.title = result.error || '上传失败';
      }

      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
        btn.title = '上传为图片';
      }, 3000);
    } catch (err) {
      console.error('Failed to upload as image:', err);
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      btn.title = '上传失败';
    }
  });

  return btn;
}

/**
 * 文章渲染组件
 * 初始渲染后，通过domUpdater直接更新DOM
 * 使用 memo 避免父组件状态变化导致不必要的重渲染（会清除注入的按钮）
 */
export const ArticleRenderer: React.FC<ArticleRendererProps> = memo(({ html }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      // 注册容器到domUpdater
      domUpdater.setArticleContainer(containerRef.current);

      // 如果不是首次渲染，不更新（让domUpdater处理）
      if (isInitialized.current) {
        return;
      }

      // 标记为已初始化
      isInitialized.current = true;
    }

    // 清理函数
    return () => {
      domUpdater.setArticleContainer(null);
    };
  }, []);

  // 注入复制按钮到代码块（使用原生 DOM，避免 React 重渲染清除按钮）
  useEffect(() => {
    if (!containerRef.current) return;

    const injectCopyButtons = () => {
      const container = containerRef.current;
      if (!container) return;

      // 清理旧按钮和 tooltip
      container.querySelectorAll('.lovpen-code-copy-btn, .lovpen-code-copy-img-btn, .lovpen-code-upload-btn, .lovpen-code-info-btn, .lovpen-code-info-tooltip').forEach(el => el.remove());

      const preElements = container.querySelectorAll('pre');

      preElements.forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code) return;

        // 设置 pre 为 relative 定位
        (pre as HTMLElement).style.position = 'relative';

        // 创建并添加按钮（从右到左：复制代码、复制为图片、上传为图片、查看信息）
        const copyBtn = createCopyButton(code as HTMLElement);
        const imgBtn = createCopyAsImageButton(pre as HTMLElement);
        const uploadBtn = createUploadAsImageButton(pre as HTMLElement, code as HTMLElement);
        const infoBtn = createInfoButton(code as HTMLElement);
        pre.appendChild(infoBtn);
        pre.appendChild(uploadBtn);
        pre.appendChild(imgBtn);
        pre.appendChild(copyBtn);
      });
    };

    // 初始注入（使用 rAF 确保 DOM 已渲染）
    const rafId = requestAnimationFrame(injectCopyButtons);

    // 订阅 domUpdater 更新事件
    const unsubscribe = domUpdater.onUpdate(injectCopyButtons);

    return () => {
      cancelAnimationFrame(rafId);
      unsubscribe();
    };
  }, [html]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
});

ArticleRenderer.displayName = 'ArticleRenderer';