import React from 'react';
import { cn } from '@/utils/Helpers';

type ContainerProps = {
  className?: string;
  children: React.ReactNode;
};

const Container = ({ ref, className, children }: ContainerProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn('u-container', className)}
    >
      {children}
    </div>
  );
};

Container.displayName = 'Container';

export { Container };
