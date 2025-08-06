import React from 'react'
import ReactDOM from 'react-dom/client'
import { LovpenReact } from './components/LovpenReact'
import { JotaiProvider } from './providers/JotaiProvider'
import './index.css'

// Types (we'll need to ensure these are available)
interface ExternalReactLib {
  mount: (container: HTMLElement, props: any) => Promise<void>
  update: (container: HTMLElement, props: any) => Promise<void>
  unmount: (container: HTMLElement) => void
}

// Track mounted roots for HMR
const mountedRoots = new Map<HTMLElement, ReactDOM.Root>()

// Create the external library interface for Obsidian plugin
const LovpenReactLib: ExternalReactLib = {
  mount: async (container: HTMLElement, props: any) => {
    console.log('[HMR] Mounting React component', { container, props });
    let root = mountedRoots.get(container);
    if (!root) {
      root = ReactDOM.createRoot(container);
      mountedRoots.set(container, root);
    }
    // Store props for HMR updates
    (container as any).__lovpenProps = props;
    root.render(
      <React.StrictMode>
        <JotaiProvider>
          <LovpenReact {...props} />
        </JotaiProvider>
      </React.StrictMode>
    );
  },

  update: async (container: HTMLElement, props: any) => {
    console.log('[HMR] Updating React component', { container });
    let root = mountedRoots.get(container);
    if (!root) {
      root = ReactDOM.createRoot(container);
      mountedRoots.set(container, root);
    }
    // Store props for HMR updates
    (container as any).__lovpenProps = props;
    root.render(
      <React.StrictMode>
        <JotaiProvider>
          <LovpenReact {...props} />
        </JotaiProvider>
      </React.StrictMode>
    );
  },

  unmount: (container: HTMLElement) => {
    console.log('[HMR] Unmounting React component', { container })
    const root = mountedRoots.get(container)
    if (root) {
      root.unmount()
      mountedRoots.delete(container)
    }
  }
}

// Expose to window for Obsidian plugin to access
if (typeof window !== 'undefined') {
  (window as any).LovpenReactLib = LovpenReactLib;
  console.log('[HMR] LovpenReact Dev Mode initialized with HMR support');
  
  // Also expose a flag to indicate HMR mode
  (window as any).__LOVPEN_HMR_MODE__ = true;
}

// For standalone development - render mock component if there's a root element
const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  
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
    onPluginToggle: (pluginName: string, enabled: boolean) => console.log('Plugin toggle:', pluginName, enabled),
    onPluginConfigChange: (pluginName: string, key: string, value: string | boolean) => console.log('Plugin config change:', pluginName, key, value),
    onExpandedSectionsChange: (sections: string[]) => console.log('Expanded sections:', sections),
    onArticleInfoChange: (info: any) => console.log('Article info:', info),
    onPersonalInfoChange: (info: any) => console.log('Personal info:', info),
    onSettingsChange: (settings: any) => console.log('Settings change:', settings),
    onKitApply: (kitId: string) => console.log('Apply kit:', kitId),
    onKitCreate: (info: any) => console.log('Create kit:', info),
    onKitDelete: (kitId: string) => console.log('Delete kit:', kitId),
    loadTemplateKits: async () => [],
    loadTemplates: async () => [],
    persistentStorage: {} as any,
    requestUrl: async (url: string) => ({ text: '', json: {}, arrayBuffer: new ArrayBuffer(0), headers: {} }),
  }
  
  root && root.render(
    <React.StrictMode>
      <JotaiProvider>
        <LovpenReact {...mockProps} />
      </JotaiProvider>
    </React.StrictMode>
  )
}

// Enable HMR
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept(() => {
    console.log('[HMR] Module updated, re-rendering components');
    
    // Force re-render all mounted components
    mountedRoots.forEach((root, container) => {
      const props = (container as any).__lovpenProps;
      if (props) {
        console.log('[HMR] Re-rendering component in container', container);
        root.render(
          <React.StrictMode>
            <JotaiProvider>
              <LovpenReact {...props} />
            </JotaiProvider>
          </React.StrictMode>
        );
      }
    });
    
    // Notify Obsidian plugin if available
    if ((window as any).__lovpenRefresh) {
      (window as any).__lovpenRefresh();
    }
  });
}