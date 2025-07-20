import React from 'react'
import { createRoot } from 'react-dom/client'
import { LovpenReact } from './components/LovpenReact'
import { JotaiProvider } from './providers/JotaiProvider'
import './index.css'

const container = document.getElementById('root')!
const root = createRoot(container)

// Mock props for development
const mockProps = {
  content: '# 测试标题\n\n这是一个测试内容。',
  onContentChange: (content: string) => console.log('Content changed:', content),
  onUpdateCSSVariables: () => console.log('CSS variables updated'),
}

root.render(
  <JotaiProvider>
    <LovpenReact {...mockProps} />
  </JotaiProvider>
)