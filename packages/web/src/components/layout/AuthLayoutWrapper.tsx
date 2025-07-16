'use client';

import { usePathname } from 'next/navigation';
import { AuthNavbar } from './AuthNavbar';

type AuthLayoutWrapperProps = {
  children: React.ReactNode;
};

export function AuthLayoutWrapper({ children }: AuthLayoutWrapperProps) {
  const pathname = usePathname();

  // 只有认证页面有自己的布局，不需要我们的导航栏
  const isAuthPages = pathname.includes('/sign-in') || pathname.includes('/sign-up');

  if (isAuthPages) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background-main">
      <AuthNavbar />
      {children}
    </div>
  );
}
