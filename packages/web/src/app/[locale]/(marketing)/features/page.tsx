import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';

type IFeaturesProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IFeaturesProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Features',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Features(props: IFeaturesProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Features',
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-background-ivory-light p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
              ⚡
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('feature_1_title')}
            </h3>
            <p className="text-text-faded">
              {t('feature_1_description')}
            </p>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
              🎯
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('feature_2_title')}
            </h3>
            <p className="text-text-faded">
              {t('feature_2_description')}
            </p>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
              🔄
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('feature_3_title')}
            </h3>
            <p className="text-text-faded">
              {t('feature_3_description')}
            </p>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
              🎨
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('feature_4_title')}
            </h3>
            <p className="text-text-faded">
              {t('feature_4_description')}
            </p>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
              🌐
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('feature_5_title')}
            </h3>
            <p className="text-text-faded">
              {t('feature_5_description')}
            </p>
          </div>

          <div className="bg-background-ivory-light p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
              💡
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              {t('feature_6_title')}
            </h3>
            <p className="text-text-faded">
              {t('feature_6_description')}
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}