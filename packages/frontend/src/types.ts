// 导入全局API类型定义
import './types/global';

export type {LovpenReactAPI} from './types/global';

// Avatar configuration interface
export interface AvatarConfig {
	type: 'default' | 'uploaded' | 'initials';
	data?: string; // base64 encoded image data
	initials?: string; // user name initials
	backgroundColor?: string; // background color for initials
}

// Social links interface
export interface SocialLinks {
	twitter?: string;
	github?: string;
	zhihu?: string;
	xiaohongshu?: string;
	weibo?: string;
	wechat?: string; // 微信公众号
	linkedin?: string;
}

// Personal info interface
export interface PersonalInfo {
	name: string;
	avatar?: AvatarConfig;
	bio: string;
	email?: string;
	website?: string;
	socialLinks?: SocialLinks;
}

// AI Model interface
export interface AIModel {
	id: string;
	name: string;
	description: string;
	category: 'fast' | 'balanced' | 'powerful';
	pricing: 'low' | 'medium' | 'high';
	recommended?: boolean;
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


// Cloud Storage Settings (Qiniu)
export interface CloudStorageSettings {
	enabled: boolean;
	provider: 'qiniu' | 'local';
	qiniu: {
		accessKey: string;
		secretKey: string;
		bucket: string;
		domain: string; // CDN domain for accessing uploaded files
		region: 'z0' | 'z1' | 'z2' | 'na0' | 'as0'; // Qiniu regions
	};
}

export const defaultCloudStorageSettings: CloudStorageSettings = {
	enabled: false,
	provider: 'local',
	qiniu: {
		accessKey: '',
		secretKey: '',
		bucket: '',
		domain: '',
		region: 'z0', // Default: East China
	},
};

// 已上传图片记录
export interface UploadedImage {
	id: string;
	name: string;
	url: string; // CDN URL
	key: string; // 七牛云文件 key
	size: number;
	type: string;
	uploadedAt: string;
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
	aiModel?: string; // 用户选择的AI模型ID
	// AI Provider settings
	aiProvider?: 'claude' | 'openrouter'; // AI提供商选择
	openRouterApiKey?: string; // OpenRouter API密钥
	openRouterModel?: string; // OpenRouter模型选择
	toolbarPosition?: 'left' | 'right'; // 工具栏位置
	scaleCodeBlockInImage?: boolean; // 复制为图片时是否缩放溢出的代码块
	hideFirstHeading?: boolean; // 是否隐藏一级标题
	// Cloud Storage settings
	cloudStorage?: CloudStorageSettings;
}

// Configuration option types
export interface ConfigOption {
	value: string;
	text: string;
}

export interface ConfigMeta {
	title: string;
	type: 'switch' | 'select' | 'text' | 'number';
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
	onCopy: (mode?: string) => void;
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
	onWidthChange?: (width: number) => void;
}

// Shadow DOM mount options
export interface ShadowMountOptions {
	/** Shadow root to mount into (if using Shadow DOM isolation) */
	shadowRoot?: ShadowRoot;
	/** Portal container for Radix UI components */
	portalContainer?: HTMLElement;
	/** Style sheets to inject into shadow root */
	styles?: string[];
}

// Global interface for the exported library
export interface LovpenReactLib {
	mount: (container: HTMLElement, props: LovpenReactProps, options?: ShadowMountOptions) => void;
	unmount: (container: HTMLElement) => void;
	update: (container: HTMLElement, props: LovpenReactProps) => Promise<void>;
}
