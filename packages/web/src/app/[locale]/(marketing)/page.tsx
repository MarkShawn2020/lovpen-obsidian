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
      icon: '💭',
      title: '碎片化思考收集',
      description: '类似flomo的灵感捕捉，支持语音、文字、图片等多种输入。随时记录观点，LovPen帮你汇聚成完整文章。',
    },
    {
      icon: '🔗',
      title: '观点智能整合',
      description: '将零散的想法、会议记录、读书笔记智能串联，自动发现关联性，组织成逻辑清晰的文章结构。',
    },
    {
      icon: '📊',
      title: '多格式内容输入',
      description: '支持报告文档、PPT大纲、表格数据等多种格式输入，智能解析并转化为优质图文内容。',
    },
    {
      icon: '✨',
      title: '美丽图文生成',
      description: '自动配图、智能排版、优雅字体，生成值得信赖的专业级图文内容，让每一份作品都赏心悦目。',
    },
    {
      icon: '🌐',
      title: '全平台精准适配',
      description: '支持微信公众号、知乎、小红书、Twitter、LinkedIn等20+平台，根据平台特性自动优化内容格式。',
    },
    {
      icon: '🎯',
      title: '风格学习引擎',
      description: '学习你喜欢的作者风格和表达习惯，确保输出内容既保持个人特色，又符合平台调性。',
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
                <div className="text-center space-y-3">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="space-y-2 text-xs">
                    <p className="text-text-faded bg-gray-50 p-2 rounded">"刚读完一本书，有个观点..."</p>
                    <p className="text-text-faded bg-gray-50 p-2 rounded">"会议记录：用户反馈分析"</p>
                    <p className="text-text-faded bg-gray-50 p-2 rounded">"语音备忘：今天的思考"</p>
                  </div>
                  <p className="text-xs text-text-muted">多样化输入：观点、报告、语音...</p>
                </div>
                <div className="flex justify-center items-center lg:flex-row flex-col">
                  <div className="w-16 h-1 bg-gradient-to-r from-primary to-swatch-cactus lg:rotate-0 rotate-90 lg:mb-0 mb-2"></div>
                  <div className="w-0 h-0 border-l-8 border-l-swatch-cactus border-t-4 border-b-4 border-t-transparent border-b-transparent lg:ml-2"></div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm text-text-faded">智能生成美丽图文</p>
                  <p className="text-xs text-text-muted">多平台精准分发</p>
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
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-text-faded max-w-4xl mx-auto">
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <span className="text-green-600 text-lg">✨</span>
                <span>专业级美丽图文</span>
              </div>
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <span className="text-green-600 text-lg">🎯</span>
                <span>值得信赖的内容质量</span>
              </div>
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <span className="text-green-600 text-lg">🌐</span>
                <span>20+平台精准适配</span>
              </div>
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <span className="text-green-600 text-lg">💭</span>
                <span>碎片化思考整合</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};
