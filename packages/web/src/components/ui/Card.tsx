import React from 'react';
import { cn } from '@/utils/Helpers';

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

type CardHeaderProps = {
  className?: string;
  children: React.ReactNode;
};

type CardContentProps = {
  className?: string;
  children: React.ReactNode;
};

type CardIconProps = {
  className?: string;
  children: React.ReactNode;
};

const Card = ({ ref, className, children }: CardProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col h-full gap-6 p-8 bg-background-main rounded-2xl shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
};

const CardIcon = ({ ref, className, children }: CardIconProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn('w-16 h-16 flex-shrink-0', className)}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ ref, className, children }: CardHeaderProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn('', className)}
    >
      {children}
    </div>
  );
};

const CardContent = ({ ref, className, children }: CardContentProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col flex-grow', className)}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';
CardIcon.displayName = 'CardIcon';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';

export { Card, CardContent, CardHeader, CardIcon };
