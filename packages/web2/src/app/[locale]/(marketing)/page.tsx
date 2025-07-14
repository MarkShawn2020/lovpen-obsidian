import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardIcon } from '@/components/ui/Card';
import { PlatformShowcase, FlowDiagram } from '@/components/ui/PlatformShowcase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IIndexProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations('Index');

  const features = [
    {
      icon: '🧠',
      title: 'LovPen 智能写作',
      description: '基于你的想法和知识库，LovPen 自动生成符合你风格的高质量内容，告别写作困难症。',
    },
    {
      icon: '🎭',
      title: '文风学习引擎',
      description: '分析你喜欢的网页、书籍或名人作品，LovPen 学习并模仿他们的写作风格和表达方式。',
    },
    {
      icon: '📚',
      title: '个人知识库',
      description: '整合你的所有资料和灵感，LovPen 在创作时智能引用，让每篇内容都有深度。',
    },
    {
      icon: '🎨',
      title: '智能排版系统',
      description: '根据目标平台和风格偏好，LovPen 自动选择最佳排版方案，让内容视觉效果完美。',
    },
    {
      icon: '🗣️',
      title: '语音创作助手',
      description: '支持语音输入和自然对话，随时随地记录灵感，LovPen 帮你整理成完整文章。',
    },
    {
      icon: '🔄',
      title: 'LovPen 对话编辑',
      description: '通过自然语言告诉 LovPen 你的修改需求，智能调整内容风格、长度和重点。',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-background-main to-background-ivory-medium u-bg-layered-subtle relative overflow-hidden">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="u-display-xl mb-6 text-text-main">
              {t('hero_title')}
            </h1>
            <p className="u-paragraph-l mb-8 text-text-faded max-w-3xl mx-auto">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="primary" size="lg">
                {t('hero_cta_primary')}
              </Button>
              <Button variant="secondary" size="lg">
                {t('hero_cta_secondary')}
              </Button>
            </div>
            
            {/* AI Demo Preview */}
            <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">💭</div>
                  <p className="text-sm text-text-faded">"我想写一篇关于AI发展的分析文章"</p>
                </div>
                <div className="flex justify-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-swatch-cactus lg:rotate-0 rotate-90"></div>
                  <div className="w-0 h-0 border-l-4 border-l-swatch-cactus border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm text-text-faded">LovPen 自动生成 4 个平台的定制内容</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* AI Process Section */}
      <section className="w-full py-16 lg:py-24 bg-white u-bg-subtle-dots relative">
        <Container>
          <div className="text-center mb-16">
            <h2 className="u-display-m mb-4 text-text-main">{t('ai_process_title')}</h2>
            <p className="u-paragraph-l text-text-faded max-w-3xl mx-auto">
              {t('ai_process_subtitle')}
            </p>
          </div>

          <FlowDiagram />
        </Container>
      </section>

      {/* Platform Support Section */}
      <section className="w-full py-16 lg:py-24 u-bg-ivory-medium u-bg-premium-texture relative">
        <Container>
          <div className="text-center mb-16">
            <h2 className="u-display-m mb-4 text-text-main">{t('platforms_title')}</h2>
            <p className="u-paragraph-l text-text-faded max-w-3xl mx-auto">
              {t('platforms_subtitle')}
            </p>
          </div>

          <PlatformShowcase />
        </Container>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 lg:py-24 bg-white u-bg-subtle-waves relative">
        <Container>
          <div className="text-center mb-16">
            <h2 className="u-display-m mb-4 text-text-main">{t('features_title')}</h2>
            <p className="u-paragraph-l text-text-faded max-w-3xl mx-auto">
              {t('features_subtitle')}
            </p>
          </div>

          <div className="u-grid-desktop gap-8">
            {features.map(feature => (
              <div key={feature.title} className="lg:col-span-4">
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardIcon>
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {feature.icon}
                    </div>
                  </CardIcon>
                  <CardContent>
                    <CardHeader>
                      <h3 className="u-display-s mb-2 text-text-main">{feature.title}</h3>
                    </CardHeader>
                    <p className="u-paragraph-m text-text-faded">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Use Cases Section */}
      <section className="w-full py-16 lg:py-24 u-bg-ivory-medium u-bg-premium-texture relative">
        <Container>
          <div className="text-center mb-12">
            <h2 className="u-display-m mb-4 text-text-main">LovPen 让每个人都能成为优秀创作者</h2>
            <p className="u-paragraph-l text-text-faded">
              无论你的写作基础如何，LovPen 都能帮你创作出专业级别的内容
            </p>
          </div>

          <Tabs defaultValue="tech" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tech">技术博主</TabsTrigger>
              <TabsTrigger value="lifestyle">生活博主</TabsTrigger>
              <TabsTrigger value="business">企业团队</TabsTrigger>
              <TabsTrigger value="personal">个人品牌</TabsTrigger>
            </TabsList>

            <TabsContent value="tech" className="mt-8">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="u-display-s text-text-main">LovPen 让技术写作更简单</h3>
                <p className="u-paragraph-m text-text-faded">
                  "我只需要说出技术要点，LovPen 就能基于我的知识库生成专业的技术文章。从算法原理到代码实现，LovPen 都能用我习惯的表达方式完美呈现。"
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-text-faded">
                  <span className="font-medium">张工</span>
                  <span>•</span>
                  <span>全栈开发者</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lifestyle" className="mt-8">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="u-display-s text-text-main">LovPen 学会了我的美学品味</h3>
                <p className="u-paragraph-m text-text-faded">
                  "我让 LovPen 学习了几位知名博主的文风，现在它能用温暖细腻的笔触描述我的生活。旅行感悟、美食体验，LovPen 写得比我自己还动人。"
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-text-faded">
                  <span className="font-medium">小悦</span>
                  <span>•</span>
                  <span>生活方式博主</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business" className="mt-8">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="u-display-s text-text-main">LovPen 团队的内容策略师</h3>
                <p className="u-paragraph-m text-text-faded">
                  "LovPen 学习了我们品牌的语调和客户的偏好，能为不同平台生成精准的营销内容。从严肃的商业分析到轻松的社交媒体文案，风格切换自如。"
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-text-faded">
                  <span className="font-medium">王总</span>
                  <span>•</span>
                  <span>内容营销负责人</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="mt-8">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">💎</div>
                <h3 className="u-display-s text-text-main">LovPen 放大了我的影响力</h3>
                <p className="u-paragraph-m text-text-faded">
                  "有了 LovPen 的帮助，我能保持高频的优质内容输出。LovPen 不仅学会了我的观点表达，还能根据不同平台的用户特点调整内容深度和风格。"
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-text-faded">
                  <span className="font-medium">李老师</span>
                  <span>•</span>
                  <span>知识博主</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-r from-primary/10 to-swatch-cactus/10 u-bg-organic-noise relative">
        <Container>
          <div className="text-center">
            <h2 className="u-display-m text-text-main mb-6">{t('cta_title')}</h2>
            <p className="u-paragraph-l text-text-faded mb-8 max-w-2xl mx-auto">
              {t('cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4">
                {t('cta_button')}
              </Button>
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                查看 GitHub 源码
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-text-faded">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>LovPen 驱动，智能创作</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>个性化学习引擎</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>多平台一键分发</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>语音输入支持</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};
