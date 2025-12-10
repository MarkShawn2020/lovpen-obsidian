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

      // 清理旧按钮
      container.querySelectorAll('.lovpen-code-copy-btn, .lovpen-code-copy-img-btn').forEach(el => el.remove());

      const preElements = container.querySelectorAll('pre');

      preElements.forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code) return;

        // 设置 pre 为 relative 定位
        (pre as HTMLElement).style.position = 'relative';

        // 创建并添加复制按钮
        const copyBtn = createCopyButton(code as HTMLElement);
        const imgBtn = createCopyAsImageButton(pre as HTMLElement);
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