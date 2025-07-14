import Link from 'next/link';

export const NotificationBanner = () => (
  <div className="sticky top-0 z-50 bg-background-dark p-4 text-center text-base font-medium text-white border-b border-border-default/20">
    <div className="flex items-center justify-center gap-2 text-sm">
      <span>🚀</span>
      <span>7月19日正式上线 - 敬请期待</span>
      <span>-</span>
      <Link
        href="/sign-up"
        className="text-primary hover:opacity-80 transition-opacity underline underline-offset-2 font-semibold"
      >
        提前体验
      </Link>
    </div>
  </div>
);
