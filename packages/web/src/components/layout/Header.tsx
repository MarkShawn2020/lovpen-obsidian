import { SignOutButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getI18nPath } from '@/utils/Helpers';
import { Button } from '../ui/Button';
import { LogoWithText } from '../ui/Logo';
import { Container } from './Container';
import { HeaderClient } from './HeaderClient';

const Header = async () => {
  const { userId } = await auth();
  const locale = await getLocale();
  const t = await getTranslations('Header');

  const navigation = [
    { name: t('features'), href: '/features' },
    { name: t('docs'), href: '/docs' },
    { name: t('pricing'), href: '/pricing' },
    { name: t('about'), href: '/about' },
  ];

  const signInUrl = getI18nPath('/sign-in', locale);
  const signUpUrl = getI18nPath('/sign-up', locale);
  const dashboardUrl = getI18nPath('/dashboard', locale);

  return (
    <header className="w-full bg-background-main border-b border-border-default/20">
      <Container>
        <div className="flex items-center justify-between py-4 lg:py-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center no-underline text-text-main hover:text-primary transition-colors">
              <LogoWithText size="md" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="text-text-main hover:text-primary transition-colors no-underline"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {userId
              ? (
                  // Authenticated user actions
                  <>
                    <Link href={dashboardUrl}>
                      <Button variant="secondary" size="md">
                        {t('dashboard')}
                      </Button>
                    </Link>
                    <SignOutButton>
                      <Button variant="primary" size="md">
                        {t('sign_out')}
                      </Button>
                    </SignOutButton>
                  </>
                )
              : (
                  // Unauthenticated user actions
                  <>
                    <Link href={signInUrl}>
                      <Button variant="secondary" size="md">
                        {t('sign_in')}
                      </Button>
                    </Link>
                    <Link href={signUpUrl}>
                      <Button variant="primary" size="md">
                        {t('download_plugin')}
                      </Button>
                    </Link>
                  </>
                )}
          </div>

          {/* Mobile Menu Button */}
          <HeaderClient
            navigation={navigation}
            isAuthenticated={!!userId}
            urls={{
              signIn: signInUrl,
              signUp: signUpUrl,
              dashboard: dashboardUrl,
            }}
            translations={{
              signIn: t('sign_in'),
              getStarted: t('download_plugin'),
              dashboard: t('dashboard'),
              signOut: t('sign_out'),
            }}
          />
        </div>
      </Container>
    </header>
  );
};

export { Header };
