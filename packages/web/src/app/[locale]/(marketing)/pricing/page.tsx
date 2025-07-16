import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

type IPricingProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IPricingProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Pricing',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Pricing(props: IPricingProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Pricing',
  });

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-main mb-4">
            {t('hero_title')}
          </h1>
          <p className="text-xl text-text-faded">
            {t('hero_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-background-ivory-light p-8 rounded-lg border-2 border-transparent max-w-sm mx-auto md:max-w-none">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-text-main mb-2">
                {t('free_plan_name')}
              </h3>
              <div className="text-4xl font-bold text-text-main mb-2">
                {t('free_plan_price')}
              </div>
              <p className="text-text-faded">
                {t('free_plan_description')}
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('free_plan_feature_1')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('free_plan_feature_2')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('free_plan_feature_3')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('free_plan_feature_4')}
              </li>
            </ul>
            <Link href="/sign-up" className="block">
              <Button variant="outline" size="lg" className="w-full">
                {t('get_started')}
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-background-ivory-light p-8 rounded-lg border-2 border-primary relative max-w-sm mx-auto md:max-w-none">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                {t('popular_badge')}
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-text-main mb-2">
                {t('pro_plan_name')}
              </h3>
              <div className="text-4xl font-bold text-text-main mb-2">
                {t('pro_plan_price')}
              </div>
              <p className="text-text-faded">
                {t('pro_plan_description')}
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('pro_plan_feature_1')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('pro_plan_feature_2')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('pro_plan_feature_3')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('pro_plan_feature_4')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('pro_plan_feature_5')}
              </li>
            </ul>
            <Link href="/sign-up" className="block">
              <Button variant="primary" size="lg" className="w-full">
                {t('upgrade_to_pro')}
              </Button>
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-background-ivory-light p-8 rounded-lg border-2 border-transparent max-w-sm mx-auto md:max-w-none">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-text-main mb-2">
                {t('enterprise_plan_name')}
              </h3>
              <div className="text-4xl font-bold text-text-main mb-2">
                {t('enterprise_plan_price')}
              </div>
              <p className="text-text-faded">
                {t('enterprise_plan_description')}
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('enterprise_plan_feature_1')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('enterprise_plan_feature_2')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('enterprise_plan_feature_3')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('enterprise_plan_feature_4')}
              </li>
              <li className="flex items-center text-text-faded">
                <span className="text-green-500 mr-2">✓</span>
                {t('enterprise_plan_feature_5')}
              </li>
            </ul>
            <Link href="/contact" className="block">
              <Button variant="outline" size="lg" className="w-full">
                {t('contact_sales')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-text-main mb-8">
            {t('faq_title')}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('faq_1_question')}
              </h3>
              <p className="text-text-faded">
                {t('faq_1_answer')}
              </p>
            </div>
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('faq_2_question')}
              </h3>
              <p className="text-text-faded">
                {t('faq_2_answer')}
              </p>
            </div>
            <div className="bg-background-ivory-light p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-text-main mb-2">
                {t('faq_3_question')}
              </h3>
              <p className="text-text-faded">
                {t('faq_3_answer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
