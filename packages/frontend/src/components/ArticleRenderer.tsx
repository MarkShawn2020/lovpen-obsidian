import React, { useRef, useEffect } from 'react';
import { domUpdater } from '../utils/domUpdater';

interface ArticleRendererProps {
  html: string;
}

/**
 * 文章渲染组件
 * 初始渲染后，通过domUpdater直接更新DOM
 */
export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ html }) => {
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
  
  // 初始渲染使用props中的HTML
  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
};

ArticleRenderer.displayName = 'ArticleRenderer';