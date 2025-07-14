import { UserProfile } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type IUserProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IUserProfilePageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'UserProfile',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function UserProfilePage(props: IUserProfilePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="flex justify-center py-8">
      <div className="w-full">
        <UserProfile
          path={getI18nPath('/dashboard/user-profile', locale)}
          appearance={{
            elements: {
              rootBox: "mx-auto max-w-4xl",
              card: "shadow-lg border border-border-default",
            },
            variables: {
              colorPrimary: "#d97757", // 使用系统主色
              colorBackground: "#f9f9f7", // 使用系统背景色
              colorText: "#181818", // 使用系统文本色
              borderRadius: "0.75rem", // 使用系统圆角
            }
          }}
        />
      </div>
    </div>
  );
};
