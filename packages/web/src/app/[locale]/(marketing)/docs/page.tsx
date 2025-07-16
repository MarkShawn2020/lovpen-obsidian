import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';
import { SafeLink } from '@/components/ui/SafeLink';

type IDocsProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IDocsProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Docs',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Docs(props: IDocsProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Docs',
  });

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-main mb-4">
            {t('hero_title')}
          </h1>
          <p className="text-xl text-text-faded">
            {t('hero_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-background-ivory-light p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              {t('getting_started_title')}
            </h2>
            <ul className="space-y-2 text-text-faded">
              <li>
                <SafeLink href="/docs/installation" className="hover:text-primary transition-colors">
                  {t('installation_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/quick-start" className="hover:text-primary transition-colors">
                  {t('quick_start_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/configuration" className="hover:text-primary transition-colors">
                  {t('configuration_guide')}
                </SafeLink>
              </li>
            </ul>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              {t('features_title')}
            </h2>
            <ul className="space-y-2 text-text-faded">
              <li>
                <SafeLink href="/docs/writing" className="hover:text-primary transition-colors">
                  {t('writing_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/styling" className="hover:text-primary transition-colors">
                  {t('styling_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/publishing" className="hover:text-primary transition-colors">
                  {t('publishing_guide')}
                </SafeLink>
              </li>
            </ul>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              {t('api_title')}
            </h2>
            <ul className="space-y-2 text-text-faded">
              <li>
                <SafeLink href="/docs/api" className="hover:text-primary transition-colors">
                  {t('api_reference')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/plugins" className="hover:text-primary transition-colors">
                  {t('plugins_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/integrations" className="hover:text-primary transition-colors">
                  {t('integrations_guide')}
                </SafeLink>
              </li>
            </ul>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              {t('support_title')}
            </h2>
            <ul className="space-y-2 text-text-faded">
              <li>
                <SafeLink href="/docs/troubleshooting" className="hover:text-primary transition-colors">
                  {t('troubleshooting_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/faq" className="hover:text-primary transition-colors">
                  {t('faq_guide')}
                </SafeLink>
              </li>
              <li>
                <SafeLink href="/docs/community" className="hover:text-primary transition-colors">
                  {t('community_guide')}
                </SafeLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('help_title')}
            </h3>
            <p className="text-text-faded mb-4">
              {t('help_description')}
            </p>
            <SafeLink
              href="/support"
              className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              {t('contact_support')}
            </SafeLink>
          </div>
        </div>
      </div>
    </Container>
  );
}
