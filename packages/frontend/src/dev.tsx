import React from 'react'
import { createRoot } from 'react-dom/client'
import { LovpenReact } from './components/LovpenReact'
import { JotaiProvider } from './providers/JotaiProvider'
import './index.css'

const container = document.getElementById('root')!
const root = createRoot(container)

// Mock props for development
const mockProps = {
  settings: {
    defaultStyle: 'default',
    defaultHighlight: 'default',
    defaultTemplate: 'default',
    useTemplate: false,
    lastSelectedTemplate: '',
    enableThemeColor: false,
    themeColor: '#007acc',
    useCustomCss: false,
    authKey: '',
    wxInfo: [],
    expandedAccordionSections: [],
    showStyleUI: true,
    personalInfo: {
      name: '',
      avatar: { type: 'default' as const },
      bio: '',
      email: '',
      website: ''
    }
  },
  articleHTML: '<h1>测试标题</h1><p>这是一个测试内容。</p>',
  cssContent: 'body { font-family: system-ui; }',
  plugins: [],
  onRefresh: () => console.log('Refresh clicked'),
  onCopy: () => console.log('Copy clicked'),
  onDistribute: () => console.log('Distribute clicked'),
  onTemplateChange: (template: string) => console.log('Template changed:', template),
  onThemeChange: (theme: string) => console.log('Theme changed:', theme),
  onHighlightChange: (highlight: string) => console.log('Highlight changed:', highlight),
  onThemeColorToggle: (enabled: boolean) => console.log('Theme color toggle:', enabled),
  onThemeColorChange: (color: string) => console.log('Theme color changed:', color),
  onRenderArticle: () => console.log('Render article'),
  onSaveSettings: () => console.log('Save settings'),
  onUpdateCSSVariables: () => console.log('CSS variables updated'),
}

root.render(
  <JotaiProvider>
    <LovpenReact {...mockProps} />
  </JotaiProvider>
)