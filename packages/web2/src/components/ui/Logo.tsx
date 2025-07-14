import React from 'react';
import { cn } from '@/utils/Helpers';

type LogoProps = {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const Logo = ({ variant = 'full', size = 'md', className }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // 钢笔与爱心融合的主 Logo
  const FullLogo = () => (
    <svg
      viewBox="0 0 40 40"
      className={cn(sizeClasses[size], "transition-all duration-200", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>LovPen Logo</title>
      {/* 爱心形状的笔身 */}
      <path
        d="M20 35c-8-6-15-12-15-20 0-4.5 3.5-8 8-8 2.5 0 4.5 1 6 2.5C20.5 8 22.5 7 25 7c4.5 0 8 3.5 8 8 0 8-7 14-15 20z"
        fill="url(#heartGradient)"
        opacity="0.9"
        className="transition-opacity duration-300"
      />
      {/* 钢笔笔尖 */}
      <path
        d="M20 7L18 15h4L20 7z"
        fill="currentColor"
        className="text-text-main transition-colors duration-200"
      />
      {/* 笔尖金属部分 */}
      <ellipse
        cx="20"
        cy="12"
        rx="1.5"
        ry="3"
        fill="#87867f"
        opacity="0.7"
        className="transition-opacity duration-200"
      />
      {/* 写作轨迹线条 */}
      <path
        d="M25 25c3-1 6-3 8-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-primary opacity-60 transition-all duration-200"
        strokeDasharray="3 3"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;6;0"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>
      
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97757" />
          <stop offset="100%" stopColor="#cc785c" />
        </linearGradient>
      </defs>
    </svg>
  );

  // 简化的图标版本
  const IconLogo = () => (
    <svg
      viewBox="0 0 24 24"
      className={cn(sizeClasses[size], "transition-colors duration-200", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>LovPen Icon</title>
      {/* 简化的爱心笔身 */}
      <path
        d="M12 21c-6-4-10-8-10-14 0-3 2-5 5-5 2 0 3 1 4 2 1-1 2-2 4-2 3 0 5 2 5 5 0 6-4 10-10 14z"
        fill="currentColor"
        className="text-primary transition-colors duration-200"
      />
      {/* 简化笔尖 */}
      <path
        d="M12 3L11 9h2L12 3z"
        fill="currentColor"
        className="text-text-main transition-colors duration-200"
      />
      {/* 简化写作线条 */}
      <path
        d="M16 16c2-1 3-2 4-3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="text-text-faded transition-all duration-200"
        opacity="0.6"
        strokeDasharray="2 2"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;4;0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );

  // 纯文字版本
  const TextLogo = () => (
    <span className={cn(
      "font-bold tracking-tight",
      size === 'sm' && "text-lg",
      size === 'md' && "text-xl", 
      size === 'lg' && "text-2xl",
      className
    )}>
      LovPen
    </span>
  );

  switch (variant) {
    case 'icon':
      return <IconLogo />;
    case 'text':
      return <TextLogo />;
    default:
      return <FullLogo />;
  }
};

// 组合 Logo（图标 + 文字）
const LogoWithText = ({ size = 'md', className }: Omit<LogoProps, 'variant'>) => {
  return (
    <div className={cn(
      "flex items-center space-x-2 group transition-all duration-200",
      "hover:scale-105 hover:opacity-90",
      className
    )}>
      <div className="transition-transform duration-200 group-hover:rotate-3">
        <Logo variant="icon" size={size} />
      </div>
      <div className="transition-all duration-200 group-hover:tracking-wide">
        <Logo variant="text" size={size} />
      </div>
    </div>
  );
};

Logo.displayName = 'Logo';
LogoWithText.displayName = 'LogoWithText';

export { Logo, LogoWithText, type LogoProps };