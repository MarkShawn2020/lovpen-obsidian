import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

type ICreateProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ICreateProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Create',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Create(props: ICreateProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations('Create');

  const inputMethods = [
    {
      icon: '💭',
      title: '语音输入',
      description: '随时说出你的想法，LovPen 自动转文字并整理',
      features: ['实时语音识别', '自动标点优化', '方言识别支持']
    },
    {
      icon: '📝',
      title: '文字记录',
      description: '像 flomo 一样记录灵感碎片，积少成多',
      features: ['快速记录', '标签分类', '智能关联']
    },
    {
      icon: '📊',
      title: '文档导入',
      description: '上传报告、PPT、表格，智能提取核心观点',
      features: ['多格式支持', '内容解析', '要点提取']
    },
    {
      icon: '🎤',
      title: '对话创作',
      description: '与 LovPen 对话，边聊边完善你的文章',
      features: ['交互式创作', '实时反馈', '风格调整']
    }
  ];

  const creationSteps = [
    {
      step: 1,
      title: '选择输入方式',
      description: '语音、文字、文档或对话，选择最适合的方式开始',
      icon: '🎯'
    },
    {
      step: 2,
      title: '输入你的想法',
      description: '不需要完整，碎片化的观点和灵感都可以',
      icon: '💡'
    },
    {
      step: 3,
      title: 'LovPen 智能整合',
      description: '基于你的知识库和文风偏好，生成初稿',
      icon: '🧠'
    },
    {
      step: 4,
      title: '交互式完善',
      description: '与 LovPen 对话调整，直到满意为止',
      icon: '✨'
    },
    {
      step: 5,
      title: '美化分发',
      description: '自动配图排版，一键分发到各大平台',
      icon: '🚀'
    }
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
            
            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-8 text-center">
                  <div className="text-5xl mb-4">🎤</div>
                  <h3 className="text-xl font-bold text-text-main mb-2">语音快速开始</h3>
                  <p className="text-text-faded mb-6">点击说话，立即开始创作</p>
                  <Button variant="primary" size="lg" className="w-full">
                    🎙️ 开始语音创作
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-8 text-center">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-text-main mb-2">文字输入</h3>
                  <p className="text-text-faded mb-6">输入想法，让 LovPen 帮你成文</p>
                  <Button variant="secondary" size="lg" className="w-full">
                    ✍️ 开始文字创作
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Input Methods Section */}
      <section className="w-full py-16 lg:py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="u-display-m mb-4 text-text-main">选择你喜欢的创作方式</h2>
            <p className="u-paragraph-l text-text-faded max-w-3xl mx-auto">
              LovPen 支持多种输入方式，让创作变得随心所欲
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inputMethods.map((method, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{method.icon}</div>
                  <h3 className="font-bold text-lg text-text-main mb-2">{method.title}</h3>
                  <p className="text-sm text-text-faded mb-4">{method.description}</p>
                  
                  <div className="space-y-2">
                    {method.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="text-xs bg-background-ivory-light rounded-full px-3 py-1 text-text-main">
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    立即尝试
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Creation Process */}
      <section className="w-full py-16 lg:py-24 u-bg-ivory-medium u-bg-premium-texture relative">
        <Container>
          <div className="text-center mb-16">
            <h2 className="u-display-m mb-4 text-text-main">5 步完成专业创作</h2>
            <p className="u-paragraph-l text-text-faded max-w-3xl mx-auto">
              从想法到发布，LovPen 全程陪伴你的创作之旅
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {creationSteps.map((step, index) => (
              <div key={step.step} className="flex items-center mb-8 last:mb-0">
                {/* Step Number */}
                <div className="flex-shrink-0 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mr-6">
                  {step.step}
                </div>
                
                {/* Step Content */}
                <div className="flex-grow bg-white rounded-2xl p-6 shadow-sm border border-white/20">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{step.icon}</div>
                    <div>
                      <h3 className="font-bold text-lg text-text-main mb-1">{step.title}</h3>
                      <p className="text-text-faded">{step.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Connector */}
                {index < creationSteps.length - 1 && (
                  <div className="absolute left-8 mt-20 w-0.5 h-8 bg-gradient-to-b from-primary to-swatch-cactus opacity-40"></div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-r from-primary/10 to-swatch-cactus/10 u-bg-organic-noise relative">
        <Container>
          <div className="text-center">
            <h2 className="u-display-m text-text-main mb-6">准备好开始创作了吗？</h2>
            <p className="u-paragraph-l text-text-faded mb-8 max-w-2xl mx-auto">
              加入 LovPen，让每一个想法都能变成精彩的内容
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4">
                🎙️ 语音创作
              </Button>
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                ✍️ 文字创作
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                📊 文档导入
              </Button>
            </div>
            
            {/* Demo hint */}
            <div className="text-center">
              <p className="text-sm text-text-faded">
                🎯 提示：这是演示页面，真实创作功能将在 7月19日 正式上线
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};