'use client';

import type { GlobalSettings, PlatformSettings, SidebarContext, SidebarMode } from '@/types/sidebar';
import { useCallback, useState } from 'react';

const defaultGlobalSettings: GlobalSettings = {
  autoImage: true,
  seoOptimization: false,
  scheduledPublishing: false,
  contentTemplate: 'blog',
  targetAudience: 'general',
};

// 平台默认设置
const defaultPlatformSettings: Record<string, PlatformSettings> = {
  wechat: {
    articleLength: 'medium',
    writingStyle: 'professional',
    imageCompression: 'medium',
    linkHandling: 'convert-to-text',
    includeCallToAction: true,
    adaptTone: true,
  },
  zhihu: {
    articleLength: 'long',
    writingStyle: 'thoughtful',
    imageCompression: 'low',
    linkHandling: 'preserve',
    includeCallToAction: false,
    adaptTone: true,
  },
  xiaohongshu: {
    articleLength: 'short',
    writingStyle: 'casual',
    imageCompression: 'high',
    linkHandling: 'convert-to-text',
    useHashtags: true,
    includeCallToAction: true,
    adaptTone: true,
  },
  twitter: {
    articleLength: 'short',
    writingStyle: 'casual',
    imageCompression: 'high',
    linkHandling: 'preserve',
    useHashtags: true,
    includeCallToAction: false,
    adaptTone: true,
  },
};

export function useSidebarContext() {
  const [sidebarContext, setSidebarContext] = useState<SidebarContext>({
    mode: 'global',
    selectedPanels: [],
    globalSettings: defaultGlobalSettings,
    platformOverrides: defaultPlatformSettings,
  });

  const updateContext = useCallback((updates: Partial<SidebarContext>) => {
    setSidebarContext(prev => ({ ...prev, ...updates }));
  }, []);

  const updateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    setSidebarContext(prev => ({
      ...prev,
      globalSettings: { ...prev.globalSettings, ...settings },
    }));
  }, []);

  const updatePlatformSettings = useCallback((platform: string, settings: Partial<PlatformSettings>) => {
    setSidebarContext(prev => ({
      ...prev,
      platformOverrides: {
        ...prev.platformOverrides,
        [platform]: { ...prev.platformOverrides[platform], ...settings },
      },
    }));
  }, []);

  const selectPanels = useCallback((panelIds: string[]) => {
    const newMode: SidebarMode
      = panelIds.length === 0
        ? 'global'
        : panelIds.length === 1 ? 'platform' : 'multi-select';

    setSidebarContext(prev => ({
      ...prev,
      selectedPanels: panelIds,
      mode: newMode,
    }));
  }, []);

  const togglePanelSelection = useCallback((panelId: string) => {
    setSidebarContext((prev) => {
      const isSelected = prev.selectedPanels.includes(panelId);
      const newSelection = isSelected
        ? prev.selectedPanels.filter(id => id !== panelId)
        : [...prev.selectedPanels, panelId];

      const newMode: SidebarMode
        = newSelection.length === 0
          ? 'global'
          : newSelection.length === 1 ? 'platform' : 'multi-select';

      return {
        ...prev,
        selectedPanels: newSelection,
        mode: newMode,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSidebarContext(prev => ({
      ...prev,
      selectedPanels: [],
      mode: 'global',
    }));
  }, []);

  // 获取当前选中面板的平台信息
  const getSelectedPlatforms = useCallback((panels: Array<{ id: string; platform: string }>) => {
    return sidebarContext.selectedPanels.map((panelId) => {
      const panel = panels.find(p => p.id === panelId);
      return panel?.platform;
    }).filter(Boolean) as string[];
  }, [sidebarContext.selectedPanels]);

  // 获取有效的设置（全局 + 平台覆盖）
  const getEffectiveSettings = useCallback((platform?: string) => {
    const global = sidebarContext.globalSettings;
    if (!platform) {
      return global;
    }

    const platformOverride = sidebarContext.platformOverrides[platform] || {};
    return {
      ...global,
      ...platformOverride,
    };
  }, [sidebarContext.globalSettings, sidebarContext.platformOverrides]);

  return {
    sidebarContext,
    updateContext,
    updateGlobalSettings,
    updatePlatformSettings,
    selectPanels,
    togglePanelSelection,
    clearSelection,
    getSelectedPlatforms,
    getEffectiveSettings,
  };
}
