import { setRequestLocale } from 'next-intl/server';
import { AuthLayoutWrapper } from '@/components/layout/AuthLayoutWrapper';

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <AuthLayoutWrapper>{props.children}</AuthLayoutWrapper>;
}
