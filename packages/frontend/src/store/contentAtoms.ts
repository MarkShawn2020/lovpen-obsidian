import { atom } from 'jotai';

/**
 * 文章HTML内容原子
 * 用于存储当前的文章HTML，可以被任何组件订阅
 */
export const articleHTMLAtom = atom<string>('');

/**
 * CSS内容原子
 * 用于存储当前的CSS样式
 */
export const cssContentAtom = atom<string>('');

/**
 * 静态回调函数原子
 * 这些函数在整个生命周期中保持不变
 */
export interface StaticCallbacks {
  onRefresh?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
  onDistribute?: () => void | Promise<void>;
  onTemplateChange?: (template: string) => void | Promise<void>;
  onThemeChange?: (theme: string) => void | Promise<void>;
  onHighlightChange?: (highlight: string) => void | Promise<void>;
  onThemeColorToggle?: (enabled: boolean) => void | Promise<void>;
  onThemeColorChange?: (color: string) => void | Promise<void>;
  onRenderArticle?: () => void | Promise<void>;
  onSaveSettings?: () => void;
  onUpdateCSSVariables?: () => void;
  onPluginToggle?: (pluginName: string, enabled: boolean) => void | Promise<void>;
  onPluginConfigChange?: (pluginName: string, key: string, value: string | boolean) => void | Promise<void>;
  onExpandedSectionsChange?: (sections: string[]) => void;
  onArticleInfoChange?: (info: any) => void;
  onPersonalInfoChange?: (info: any) => void;
  onSettingsChange?: (settings: any) => void;
}

export const staticCallbacksAtom = atom<StaticCallbacks>({});

/**
 * 更新文章内容的函数
 * 只更新HTML，不触发其他props变化
 */
export const updateArticleHTMLAtom = atom(
  null,
  (get, set, newHTML: string) => {
    set(articleHTMLAtom, newHTML);
  }
);

/**
 * 更新CSS内容的函数
 */
export const updateCSSContentAtom = atom(
  null,
  (get, set, newCSS: string) => {
    set(cssContentAtom, newCSS);
  }
);