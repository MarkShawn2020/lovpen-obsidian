export type SidebarMode = 'global' | 'platform' | 'multi-select';

export interface GlobalSettings {
  // 文档级别设置
  autoImage: boolean;
  seoOptimization: boolean;
  scheduledPublishing: boolean;
  contentTemplate: 'custom' | 'blog' | 'news' | 'tutorial' | 'review';
  targetAudience: 'general' | 'professional' | 'academic' | 'casual';
}

export interface PlatformSettings {
  // 平台特定的内容设置
  articleLength?: 'short' | 'medium' | 'long';
  writingStyle?: 'professional' | 'casual' | 'thoughtful' | 'warm';
  
  // 技术设置
  characterLimit?: number;
  imageCompression?: 'high' | 'medium' | 'low';
  linkHandling?: 'preserve' | 'convert-to-text' | 'footnote';
  customStyles?: Record<string, string>;
  
  // 平台优化
  useHashtags?: boolean;
  includeCallToAction?: boolean;
  adaptTone?: boolean;
}

export interface SidebarContext {
  mode: SidebarMode;
  selectedPanels: string[];
  globalSettings: GlobalSettings;
  platformOverrides: Record<string, PlatformSettings>;
}

export interface PreviewPanel {
  id: string;
  platform: string;
  title: string;
  isSelected?: boolean;
}

export interface Platform {
  name: string;
  fullName: string;
  color: string;
  constraints?: {
    maxCharacters?: number;
    supportedFormats?: string[];
    imageRequirements?: {
      maxSize?: string;
      formats?: string[];
    };
  };
}