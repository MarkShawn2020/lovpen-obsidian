import React, { useMemo } from 'react';

interface ArticleRendererProps {
  html: string;
}

/**
 * 文章渲染组件
 * 使用React.memo和useMemo来优化渲染性能
 * 只有当HTML内容真正变化时才重新渲染
 */
export const ArticleRenderer = React.memo<ArticleRendererProps>(({ html }) => {
  // 使用useMemo缓存渲染内容
  // 只有当html变化时才重新计算
  const content = useMemo(() => ({
    __html: html
  }), [html]);

  // 生成一个稳定的key，基于内容的前100个字符
  // 这确保只有内容真正变化时才会重新挂载组件
  const contentKey = useMemo(() => {
    // 使用内容的哈希或前缀作为key
    // 这样可以避免微小的格式变化导致的重新渲染
    return html.substring(0, 100);
  }, [html]);

  return (
    <div 
      key={contentKey}
      dangerouslySetInnerHTML={content}
      suppressHydrationWarning
    />
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  // 只有当HTML内容真正不同时才重新渲染
  return prevProps.html === nextProps.html;
});

ArticleRenderer.displayName = 'ArticleRenderer';