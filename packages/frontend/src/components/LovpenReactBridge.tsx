import React, { useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { articleHTMLAtom, cssContentAtom, staticCallbacksAtom } from '../store/contentAtoms';
import { LovpenReact } from './LovpenReact';
import { LovpenReactProps } from '../types';

/**
 * 桥接组件：分离频繁变化的数据和静态回调
 * 将频繁变化的数据存储在atom中，避免整个组件重新渲染
 */
export const LovpenReactBridge: React.FC<LovpenReactProps> = (props) => {
  const setArticleHTML = useSetAtom(articleHTMLAtom);
  const setCssContent = useSetAtom(cssContentAtom);
  const setStaticCallbacks = useSetAtom(staticCallbacksAtom);
  const isInitialized = useRef(false);
  
  // 在useEffect中初始化，避免渲染期间的副作用
  useEffect(() => {
    if (!isInitialized.current) {
      // 初始化atoms
      setArticleHTML(props.articleHTML);
      setCssContent(props.cssContent);
      setStaticCallbacks({
        onRefresh: props.onRefresh,
        onCopy: props.onCopy,
        onDistribute: props.onDistribute,
        onTemplateChange: props.onTemplateChange,
        onThemeChange: props.onThemeChange,
        onHighlightChange: props.onHighlightChange,
        onThemeColorToggle: props.onThemeColorToggle,
        onThemeColorChange: props.onThemeColorChange,
        onRenderArticle: props.onRenderArticle,
        onSaveSettings: props.onSaveSettings,
        onUpdateCSSVariables: props.onUpdateCSSVariables,
        onPluginToggle: props.onPluginToggle,
        onPluginConfigChange: props.onPluginConfigChange,
        onExpandedSectionsChange: props.onExpandedSectionsChange,
        onArticleInfoChange: props.onArticleInfoChange,
        onPersonalInfoChange: props.onPersonalInfoChange,
        onSettingsChange: props.onSettingsChange,
      });
      isInitialized.current = true;
    }
  }, []); // 只执行一次
  
  // 当articleHTML或cssContent变化时，更新atom而不是传递props
  useEffect(() => {
    setArticleHTML(props.articleHTML);
  }, [props.articleHTML, setArticleHTML]);
  
  useEffect(() => {
    setCssContent(props.cssContent);
  }, [props.cssContent, setCssContent]);
  
  // 传递其他不频繁变化的props
  return <LovpenReact {...props} />;
};