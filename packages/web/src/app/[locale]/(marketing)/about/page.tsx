import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { SafeLink } from '@/components/ui/SafeLink';
import Link from 'next/link';

type IAboutProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IAboutProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'About',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function About(props: IAboutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'About',
  });

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-6">
            {t('hero_title')}
          </h1>
          <p className="text-xl text-text-faded max-w-3xl mx-auto">
            {t('hero_subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-background-ivory-light p-8 rounded-lg mb-16">
          <h2 className="text-3xl font-semibold text-text-main mb-6 text-center">
            {t('mission_title')}
          </h2>
          <p className="text-lg text-text-faded text-center mb-8">
            {t('mission_description')}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                💡
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('mission_point_1_title')}
              </h3>
              <p className="text-text-faded">
                {t('mission_point_1_description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🤝
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('mission_point_2_title')}
              </h3>
              <p className="text-text-faded">
                {t('mission_point_2_description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🌍
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('mission_point_3_title')}
              </h3>
              <p className="text-text-faded">
                {t('mission_point_3_description')}
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-text-main mb-6 text-center">
            {t('story_title')}
          </h2>
          <div className="space-y-6 text-lg text-text-faded">
            <p>{t('story_paragraph_1')}</p>
            <p>{t('story_paragraph_2')}</p>
            <p>{t('story_paragraph_3')}</p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-text-main mb-8 text-center">
            {t('values_title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-3">
                {t('value_1_title')}
              </h3>
              <p className="text-text-faded">
                {t('value_1_description')}
              </p>
            </div>
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-3">
                {t('value_2_title')}
              </h3>
              <p className="text-text-faded">
                {t('value_2_description')}
              </p>
            </div>
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-3">
                {t('value_3_title')}
              </h3>
              <p className="text-text-faded">
                {t('value_3_description')}
              </p>
            </div>
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-3">
                {t('value_4_title')}
              </h3>
              <p className="text-text-faded">
                {t('value_4_description')}
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-text-main mb-8 text-center">
            {t('team_title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-swatch-cactus rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                👨‍💻
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('team_member_1_name')}
              </h3>
              <p className="text-text-faded mb-2">
                {t('team_member_1_role')}
              </p>
              <p className="text-sm text-text-faded">
                {t('team_member_1_description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-swatch-cactus rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🎨
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('team_member_2_name')}
              </h3>
              <p className="text-text-faded mb-2">
                {t('team_member_2_role')}
              </p>
              <p className="text-sm text-text-faded">
                {t('team_member_2_description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-swatch-cactus rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                📊
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('team_member_3_name')}
              </h3>
              <p className="text-text-faded mb-2">
                {t('team_member_3_role')}
              </p>
              <p className="text-sm text-text-faded">
                {t('team_member_3_description')}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center bg-primary/10 border border-primary/20 rounded-lg p-8">
          <h2 className="text-3xl font-semibold text-text-main mb-4">
            {t('contact_title')}
          </h2>
          <p className="text-lg text-text-faded mb-6">
            {t('contact_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SafeLink href="/contact">
              <Button variant="primary" size="lg">
                {t('contact_button')}
              </Button>
            </SafeLink>
            <Link href="/create">
              <Button variant="secondary" size="lg">
                {t('try_lovpen')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
};
