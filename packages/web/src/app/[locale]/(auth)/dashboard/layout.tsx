import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <Container>
      <div className="py-8">
        {props.children}
      </div>
    </Container>
  );
}
