'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SmartNavLinkProps = {
  href: string;
  scrollToId?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function SmartNavLink({ href, scrollToId, children, className, onClick }: SmartNavLinkProps) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }

    // Check if we're on the landing page and have a scrollToId
    if (scrollToId && (pathname === '/' || pathname.match(/^\/[a-z]{2}(-[A-Z]{2})?$/))) {
      e.preventDefault();
      const element = document.getElementById(scrollToId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
