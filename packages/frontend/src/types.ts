// 导入全局API类型定义
import './types/global';

export type {LovpenReactAPI} from './types/global';

// Personal info interface
export interface PersonalInfo {
	name: string;
	avatar: string;
	bio: string;
	email?: string;
	website?: string;
}

// Template Kit types
export interface TemplateKit {
	basicInfo: {
		id: string;
		name: string;
		description: string;
		author: string;
		version: string;
		tags: string[];
		previewImage?: string;
	};
	styleConfig: {
		theme: string;
		codeHighlight: string;
		enableCustomThemeColor: boolean;
		customThemeColor?: string;
	};
	templateConfig: {
		templateFileName: string;
		useTemplate: boolean;
	};
	pluginConfig: {
		enabledMarkdownPlugins: string[];
		enabledHtmlPlugins: string[];
		pluginSettings: Record<string, any>;
	};
}


// Settings interface for the Vite React components
export interface ViteReactSettings {
	defaultStyle: string;
	defaultHighlight: string;
	defaultTemplate: string;
	useTemplate: boolean;
	lastSelectedTemplate: string;
	enableThemeColor: boolean;
	themeColor: string;
	useCustomCss: boolean;
	authKey: string;
	wxInfo: Array<{
		appid: string;
		secret: string;
	}>;
	expandedAccordionSections: string[];
	showStyleUI: boolean;
	personalInfo: PersonalInfo;
	aiPromptTemplate?: string;
}

// Configuration option types
export interface ConfigOption {
	value: string;
	text: string;
}

export interface ConfigMeta {
	title: string;
	type: 'switch' | 'select' | 'input';
	options?: ConfigOption[];
	description?: string;
}

export interface ConfigMetaCollection {
	[key: string]: ConfigMeta;
}

// Unified Plugin interfaces
export interface UnifiedPluginData {
	name: string;
	type: 'remark' | 'rehype';
	description?: string;
	enabled: boolean;
	config: any;
	metaConfig: ConfigMetaCollection;
}

// Legacy interfaces (for backward compatibility)
export interface PluginData {
	name: string;
	description?: string;
	enabled: boolean;
	config: any;
	metaConfig: ConfigMetaCollection;
}

export interface RemarkPluginData {
	name: string;
	description?: string;
	enabled: boolean;
	config: any;
	metaConfig: ConfigMetaCollection;
}

// Article info interface
export interface ArticleInfoData {
	author: string;
	publishDate: string;
	articleTitle: string;
	articleSubtitle: string;
	episodeNum: string;
	seriesName: string;
	tags: string[];
}

// Persistent storage interfaces
export interface PersistentFile {
	id: string;
	name: string;
	path: string;
	type: string;
	size: number;
	createdAt: string;
	lastUsed: string;
	blob?: Blob;
	isPinned?: boolean;
	pinnedAt?: string;
}

export interface PersistentCover {
	id: string;
	name: string;
	coverData: any;
	createdAt: string;
	lastUsed: string;
}


// Persistent configuration interfaces
export interface PersistentTemplateKit {
	id: string;
	name: string;
	description: string;
	author: string;
	version: string;
	tags: string[];
	configData: TemplateKit;
	createdAt: string;
	lastUsed: string;
}

export interface PersistentPluginConfig {
	id: string;
	pluginName: string;
	config: any;
	metaConfig: ConfigMetaCollection;
	updatedAt: string;
}

export interface PersistentPersonalInfo {
	id: string;
	data: PersonalInfo;
	updatedAt: string;
}

export interface PersistentArticleInfo {
	id: string;
	data: ArticleInfoData;
	updatedAt: string;
}

export interface PersistentStyleSettings {
	id: string;
	defaultStyle: string;
	defaultHighlight: string;
	defaultTemplate: string;
	useTemplate: boolean;
	enableThemeColor: boolean;
	themeColor: string;
	updatedAt: string;
}

// Props interface for the main component
export interface LovpenReactProps {
	settings: ViteReactSettings;
	articleHTML: string;
	cssContent: string;
	plugins: UnifiedPluginData[];
	onRefresh: () => void;
	onCopy: () => void;
	onDistribute: () => void;
	onTemplateChange: (template: string) => void;
	onThemeChange: (theme: string) => void;
	onHighlightChange: (highlight: string) => void;
	onThemeColorToggle: (enabled: boolean) => void;
	onThemeColorChange: (color: string) => void;
	onRenderArticle: () => void;
	onSaveSettings: () => void;
	onUpdateCSSVariables: () => void;
	onPluginToggle?: (pluginName: string, enabled: boolean) => void;
	onPluginConfigChange?: (pluginName: string, key: string, value: string | boolean) => void;
	onExpandedSectionsChange?: (sections: string[]) => void;
	onArticleInfoChange?: (info: ArticleInfoData) => void;
	onPersonalInfoChange?: (info: PersonalInfo) => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
}

// Global interface for the exported library
export interface LovpenReactLib {
	mount: (container: HTMLElement, props: LovpenReactProps) => void;
	unmount: (container: HTMLElement) => void;
	update: (container: HTMLElement, props: LovpenReactProps) => Promise<void>;
}
