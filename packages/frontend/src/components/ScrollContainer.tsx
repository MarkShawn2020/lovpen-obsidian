import React, { ReactNode } from 'react';

interface ScrollContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 滚动容器组件
 * 使用React.memo优化，但正常比较props
 */
export const ScrollContainer = React.memo<ScrollContainerProps>(
  ({ children, className, style }) => {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
);

ScrollContainer.displayName = 'ScrollContainer';