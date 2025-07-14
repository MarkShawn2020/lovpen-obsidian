'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

const navigationItems = [
  {
    name: '创作',
    href: '/create',
  },
  {
    name: '知识库',
    href: '/knowledge-base',
  },
  {
    name: '数据',
    href: '/dashboard',
  },
];

export function AuthNavbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  return (
    <div className="bg-background-main border-b border-border-default/20 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center u-gap-s hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-medium text-xs">
              L
            </div>
            <span className="font-medium text-text-main">LovPen</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center u-gap-l">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-primary font-medium'
                    : 'text-text-faded hover:text-text-main'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center u-gap-s">
            {isActive('/create') && (
              <Button
                variant="primary"
                size="sm"
                disabled={true}
              >
                发布
              </Button>
            )}
            
            <button
              type="button"
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs hover:opacity-90"
            >
              M
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}