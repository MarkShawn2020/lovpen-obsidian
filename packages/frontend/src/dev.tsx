import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { LovpenReact } from './components/LovpenReact'
import { JotaiProvider } from './providers/JotaiProvider'
import { logger } from '../../shared/src/logger'
import './index.css'

// Types (we'll need to ensure these are available)
interface ExternalReactLib {
  mount: (container: HTMLElement, props: any) => Promise<void>
  update: (container: HTMLElement, props: any) => Promise<void>
  unmount: (container: HTMLElement) => void
}

// Track mounted roots for HMR
const mountedRoots = new Map<HTMLElement, ReactDOM.Root>()

// Wrapper component to manage props updates without remounting JotaiProvider
const LovpenReactWrapper: React.FC<{ initialProps: any; container?: HTMLElement }> = ({ initialProps, container }) => {
  const [props, setProps] = useState(initialProps);
  
  // Expose update function to parent
  useEffect(() => {
    if (container) {
      (container as any).__updateProps = setProps;
    }
  }, [container]);
  
  return <LovpenReact {...props} />;
}

// Create the external library interface for Obsidian plugin
const LovpenReactLib: ExternalReactLib = {
  mount: async (container: HTMLElement, props: any) => {
    logger.debug('Mounting React component');
    let root = mountedRoots.get(container);
    if (!root) {
      root = ReactDOM.createRoot(container);
      mountedRoots.set(container, root);
    }
    // Store props for HMR updates
    (container as any).__lovpenProps = props;
    root.render(
      <JotaiProvider>
        <LovpenReactWrapper initialProps={props} container={container} />
      </JotaiProvider>
    );
  },

  update: async (container: HTMLElement, props: any) => {
    logger.debug('Updating React component');
    
    // Store new props
    (container as any).__lovpenProps = props;
    
    const root = mountedRoots.get(container);
    if (root && (container as any).__updateProps) {
      // Update props without remounting JotaiProvider
      (container as any).__updateProps(props);
    } else if (!root) {
      // If no root exists, mount it
      await LovpenReactLib.mount(container, props);
    }
  },

  unmount: (container: HTMLElement) => {
    logger.debug('Unmounting React component')
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
  logger.info('Dev Mode initialized with HMR support');
  
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
    onRefresh: () => logger.debug('Refresh clicked'),
    onCopy: () => logger.debug('Copy clicked'),
    onDistribute: () => logger.debug('Distribute clicked'),
    onTemplateChange: (template: string) => logger.debug('Template changed:', template),
    onThemeChange: (theme: string) => logger.debug('Theme changed:', theme),
    onHighlightChange: (highlight: string) => logger.debug('Highlight changed:', highlight),
    onThemeColorToggle: (enabled: boolean) => logger.debug('Theme color toggle:', enabled),
    onThemeColorChange: (color: string) => logger.debug('Theme color changed:', color),
    onRenderArticle: () => logger.debug('Render article'),
    onSaveSettings: () => logger.debug('Save settings'),
    onUpdateCSSVariables: () => logger.debug('CSS variables updated'),
    onPluginToggle: (pluginName: string, enabled: boolean) => logger.debug('Plugin toggle:', pluginName, enabled),
    onPluginConfigChange: (pluginName: string, key: string, value: string | boolean) => logger.debug('Plugin config change:', pluginName, key, value),
    onExpandedSectionsChange: (sections: string[]) => logger.debug('Expanded sections:', sections),
    onArticleInfoChange: (info: any) => logger.debug('Article info:', info),
    onPersonalInfoChange: (info: any) => logger.debug('Personal info:', info),
    onSettingsChange: (settings: any) => logger.debug('Settings change:', settings),
    onKitApply: (kitId: string) => logger.debug('Apply kit:', kitId),
    onKitCreate: (info: any) => logger.debug('Create kit:', info),
    onKitDelete: (kitId: string) => logger.debug('Delete kit:', kitId),
    loadTemplateKits: async () => [],
    loadTemplates: async () => [],
    persistentStorage: {} as any,
    requestUrl: async (url: string) => ({ text: '', json: {}, arrayBuffer: new ArrayBuffer(0), headers: {} }),
  }
  
  root && root.render(
    <JotaiProvider>
      <LovpenReact {...mockProps} />
    </JotaiProvider>
  )
}

// Enable HMR
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept(() => {
    logger.debug('Module updated, re-rendering components');
    
    // Force re-render all mounted components
    mountedRoots.forEach((root, container) => {
      const props = (container as any).__lovpenProps;
      if (props && (container as any).__updateProps) {
        logger.debug('Re-rendering component in container');
        // Just update props, don't remount
        (container as any).__updateProps({...props});
      }
    });
    
    // Notify Obsidian plugin if available
    if ((window as any).__lovpenRefresh) {
      (window as any).__lovpenRefresh();
    }
  });
}