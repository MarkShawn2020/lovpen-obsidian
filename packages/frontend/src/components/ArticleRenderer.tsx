import React, { useRef, useEffect, memo } from 'react';
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
      container.querySelectorAll('.lovpen-code-copy-btn').forEach(el => el.remove());

      const preElements = container.querySelectorAll('pre');

      preElements.forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code) return;

        // 设置 pre 为 relative 定位
        (pre as HTMLElement).style.position = 'relative';

        // 创建并添加复制按钮
        const btn = createCopyButton(code as HTMLElement);
        pre.appendChild(btn);
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