'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useClerk } from '@clerk/nextjs';
import { User, Settings, LogOut } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName && user.firstName.length > 0 && user.lastName.length > 0) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName && user.firstName.length > 0) {
      return user.firstName[0]!.toUpperCase();
    }
    const email = user.emailAddresses[0]?.emailAddress;
    if (email && email.length > 0) {
      return email[0]!.toUpperCase();
    }
    return 'U';
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="p-1 hover:bg-background-ivory-medium focus-visible:ring-2 focus-visible:ring-primary border-0"
                  disabled={!isLoaded}
                  aria-label="User account menu"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.imageUrl} alt={getUserDisplayName()} />
                    <AvatarFallback className="text-xs bg-primary text-white">
                      {isLoaded ? getUserInitials() : '...'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 md:w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {isLoaded ? getUserDisplayName() : 'Loading...'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {isLoaded ? user?.emailAddresses[0]?.emailAddress : 'Loading...'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild disabled={!isLoaded}>
                  <Link href="/dashboard/user-profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!isLoaded}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  variant="destructive"
                  disabled={!isLoaded}
                  className="focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </div>
  );
}