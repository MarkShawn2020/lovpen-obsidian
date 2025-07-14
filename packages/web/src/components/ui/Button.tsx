import React from 'react';
import { cn } from '@/utils/Helpers';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  href?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ ref, className, variant = 'primary', size = 'md', asChild = false, href, children, ...props }: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'text-white bg-primary hover:opacity-90 shadow-sm',
    secondary: 'text-text-main bg-transparent border border-border-default hover:bg-gray-50 shadow-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-md',
    lg: 'px-8 py-4 text-lg rounded-lg',
  };

  const combinedClassName = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    className,
  );

  if (href && !asChild) {
    return (
      <a
        href={href}
        className={combinedClassName}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={combinedClassName}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

export { Button, type ButtonProps };
