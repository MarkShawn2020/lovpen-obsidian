import { setRequestLocale } from 'next-intl/server';
import { DemoBanner } from '@/components/DemoBanner';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <DemoBanner />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {props.children}
        </main>
        <Footer />
      </div>
    </>
  );
}
