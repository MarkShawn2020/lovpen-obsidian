'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

const navigationItems = [
  {
    name: '创作工作台',
    href: '/create',
    icon: '✍️',
    description: '智能写作与多平台发布',
  },
  {
    name: '知识库',
    href: '/knowledge-base',
    icon: '📚',
    description: '知识管理与智能检索',
  },
  {
    name: '数据中心',
    href: '/dashboard',
    icon: '📊',
    description: '数据分析与统计',
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
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center u-gap-s">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-medium text-sm">
              L
            </div>
            <div>
              <h1 className="u-display-s font-serif">LovPen</h1>
              <p className="text-xs text-text-faded">智能创作平台</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center u-gap-m">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-faded hover:text-text-main hover:bg-background-ivory-medium'
                }`}
              >
                <div className="flex items-center u-gap-s">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs opacity-75">{item.description}</span>
                  </div>
                </div>
                
                {/* Active indicator */}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Action section */}
          <div className="flex items-center u-gap-s">
            {/* Show publish button only on create page */}
            {isActive('/create') && (
              <Button
                variant="primary"
                size="md"
                className="font-medium"
                disabled={true} // TODO: 连接到页面状态
              >
                发布
              </Button>
            )}

            {/* Notifications */}
            <button
              type="button"
              className="p-2 text-text-faded hover:text-text-main transition-colors"
            >
              🔔
            </button>
            
            {/* Settings */}
            <button
              type="button"
              className="p-2 text-text-faded hover:text-text-main transition-colors"
            >
              ⚙️
            </button>

            {/* User avatar */}
            <div className="relative">
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                M
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}