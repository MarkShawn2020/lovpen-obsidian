import React, { useRef, useLayoutEffect } from 'react';

interface ArticleRendererProps {
  html: string;
}

/**
 * 文章渲染组件
 * 直接操作DOM，绕过React的虚拟DOM机制
 * 这样可以避免滚动位置重置
 */
export const ArticleRenderer = React.memo<ArticleRendererProps>(({ html }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // 首次渲染使用React的方式
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // 后续更新直接操作DOM，避免React重新渲染导致的滚动重置
    containerRef.current.innerHTML = html;
  }, [html]);

  // 初始渲染
  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
});

ArticleRenderer.displayName = 'ArticleRenderer';