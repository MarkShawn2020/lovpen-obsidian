import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/utils/Helpers';

type SafeLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  showComingSoon?: boolean;
};

// Define implemented routes - update this list as routes are implemented
const IMPLEMENTED_ROUTES = [
  '/',
  '/features',
  '/docs',
  '/pricing',
  '/about',
  '/sign-in',
  '/sign-up',
  '/create',
  '/dashboard',
  '/knowledge-base',
  '/counter',
  '/portfolio',
];

// Routes that are planned but not yet implemented
const PLANNED_ROUTES = [
  '/docs/installation',
  '/docs/quick-start',
  '/docs/configuration',
  '/docs/writing',
  '/docs/styling',
  '/docs/publishing',
  '/docs/api',
  '/docs/plugins',
  '/docs/integrations',
  '/docs/troubleshooting',
  '/docs/faq',
  '/docs/community',
  '/support',
  '/contact',
  '/privacy',
  '/terms',
  '/blog',
  '/help',
  '/products/lovpen',
  '/status',
  '/cookies',
  '#careers',
  '#press',
  '#contact',
];

function isRouteImplemented(href: string): boolean {
  // Remove locale prefix if present (e.g., /en/features -> /features)
  const cleanHref = href.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
  return IMPLEMENTED_ROUTES.includes(cleanHref) || IMPLEMENTED_ROUTES.includes(href);
}

function isRoutePlanned(href: string): boolean {
  const cleanHref = href.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
  return PLANNED_ROUTES.includes(cleanHref) || PLANNED_ROUTES.includes(href);
}

export function SafeLink({ href, children, className, showComingSoon = true }: SafeLinkProps) {
  const implemented = isRouteImplemented(href);
  const planned = isRoutePlanned(href);

  // Handle hash links (anchors) - these should be treated as "planned" features
  if (href.startsWith('#')) {
    if (showComingSoon) {
      return (
        <span
          className={cn(
            'relative cursor-not-allowed opacity-60 text-text-faded group',
            className,
          )}
          title="Coming soon"
        >
          {children}
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-text-main text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mb-1">
            Coming soon
          </span>
        </span>
      );
    }
    return <span className={className}>{children}</span>;
  }

  if (implemented) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  if (planned && showComingSoon) {
    return (
      <span
        className={cn(
          'relative cursor-not-allowed opacity-60 text-text-faded group',
          className,
        )}
        title="Coming soon"
      >
        {children}
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-text-main text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mb-1">
          Coming soon
        </span>
      </span>
    );
  }

  // Fallback for external links or unplanned routes
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
