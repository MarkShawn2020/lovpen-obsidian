import { SignOutButton } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { LogoWithText } from '@/components/ui/Logo';

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'DashboardLayout',
  });

  return (
    <div className="min-h-screen bg-background-main">
      <header className="bg-white border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              {/* Branding */}
              <Link
                href="/"
                className="text-text-main hover:text-primary transition-colors"
              >
                <LogoWithText size="md" className="hidden sm:flex" />
                <LogoWithText size="sm" className="flex sm:hidden" />
              </Link>
              
              {/* Navigation */}
              <nav className="flex space-x-6">
                <Link
                  href="/"
                  className="text-text-faded hover:text-text-main transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard/"
                  className="text-text-main hover:text-primary transition-colors font-medium"
                >
                  {t('dashboard_link')}
                </Link>
                <Link
                  href="/dashboard/user-profile/"
                  className="text-text-faded hover:text-text-main transition-colors"
                >
                  {t('user_profile_link')}
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <LocaleSwitcher />
              <SignOutButton>
                <button className="text-text-faded hover:text-text-main transition-colors" type="button">
                  {t('sign_out')}
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {props.children}
      </main>
    </div>
  );
}
