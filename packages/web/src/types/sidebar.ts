export type SidebarMode = 'global' | 'platform' | 'multi-select';

export interface GlobalSettings {
  articleLength: 'short' | 'medium' | 'long';
  writingStyle: 'professional' | 'casual' | 'thoughtful' | 'warm';
  autoImage: boolean;
  seoOptimization: boolean;
  scheduledPublishing: boolean;
}

export interface PlatformSettings {
  characterLimit?: number;
  imageCompression?: 'high' | 'medium' | 'low';
  linkHandling?: 'preserve' | 'convert-to-text' | 'footnote';
  customStyles?: Record<string, string>;
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