import Link from 'next/link';
import React from 'react';
import { Container } from './Container';

const Footer = () => {
  const footerLinks = {
    company: [
      { name: '关于我们', href: '/about' },
      { name: '加入我们', href: '#careers' },
      { name: '媒体报道', href: '#press' },
      { name: '博客', href: '/blog' },
    ],
    product: [
      { name: 'Lovpen 平台', href: '/products/lovpen' },
      { name: '定价方案', href: '/pricing' },
      { name: 'API 文档', href: '/docs/api' },
      { name: '帮助文档', href: '/docs' },
    ],
    support: [
      { name: '帮助中心', href: '/help' },
      { name: '联系我们', href: '#contact' },
      { name: '服务状态', href: '/status' },
      { name: '隐私政策', href: '/privacy' },
    ],
  };

  return (
    <footer className="u-theme-dark">
      <Container>
        <div className="py-16 lg:py-24">
          <div className="u-grid-desktop gap-8 lg:gap-16">
            {/* Logo and Description */}
            <div className="lg:col-span-4">
              <Link href="/" className="flex items-center no-underline mb-4">
                <img
                  src="/assets/images/neurora-logo-white.png"
                  alt="Neurora"
                  className="h-10 w-auto"
                />
              </Link>
              <p className="u-paragraph-m text-gray-300 mb-6">
                让一部分人先机械飞升，最大化思想者的价值。专为知识博主和内容创作者打造的 AI 智能创作平台。
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/neurora-ai" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://weixin.qq.com/r/nHGkUFf" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">微信公众号</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.074-1.915 6.309-1.302-.548-3.328-4.045-5.884-8.052-5.884zM5.785 7.328c.48 0 .869.398.869.889 0 .49-.389.889-.869.889-.48 0-.87-.398-.87-.889 0-.49.39-.889.87-.889zm5.813 0c.48 0 .869.398.869.889 0 .49-.389.889-.869.889-.48 0-.869-.398-.869-.889 0-.49.389-.889.869-.889zM16.759 9.07c-3.717 0-6.73 2.741-6.73 6.12 0 1.78.937 3.4 2.459 4.570a.49.49 0 0 1 .178.550l-.325 1.23c-.016.06-.04.118-.04.177 0 .136.108.246.241.246a.27.27 0 0 0 .139-.045l1.586-.928a.72.72 0 0 1 .598-.082 8.47 8.47 0 0 0 2.364.336c3.717 0 6.73-2.741 6.73-6.12 0-3.379-3.013-6.12-6.73-6.12z" />
                  </svg>
                </a>
                <a href="https://twitter.com/neurora_ai" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                公司
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map(link => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-300 hover:text-white transition-colors no-underline">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                产品
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map(link => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-300 hover:text-white transition-colors no-underline">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                支持
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map(link => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-300 hover:text-white transition-colors no-underline">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                订阅更新
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                获取最新的产品更新和技术资讯。
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="输入您的邮箱"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button type="button" className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity">
                  订阅
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 北京飞脑科技有限公司 (Neurora Technology). 保留所有权利。
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors no-underline">
                  服务条款
                </Link>
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors no-underline">
                  隐私政策
                </Link>
                <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors no-underline">
                  Cookie 政策
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export { Footer };
