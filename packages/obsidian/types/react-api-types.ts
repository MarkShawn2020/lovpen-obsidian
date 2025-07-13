import { TemplateKit, TemplateKitBasicInfo, TemplateKitOperationResult } from "../template-kit-types";

/**
 * 外部React库接口定义
 * 扩展原有的简单接口，添加具体的方法签名和类型安全
 */
export interface ExternalReactLib {
	/** 挂载React组件到指定容器 */
	mount: (container: HTMLElement, props: ReactComponentProps) => void;
	/** 卸载React组件 */
	unmount: (container: HTMLElement) => void;
	/** 更新React组件的props */
	update: (container: HTMLElement, props: ReactComponentProps) => Promise<void>;
}

/**
 * 设置配置接口
 */
export interface ReactSettings {
	defaultStyle: string;
	defaultHighlight: string;
	defaultTemplate: string;
	useTemplate: boolean;
	lastSelectedTemplate: string;
	enableThemeColor: boolean;
	themeColor: string;
	useCustomCss: boolean;
	authKey: string;
	wxInfo: Array<{ name: string; appid: string; secret: string }>;
	expandedAccordionSections: string[];
	showStyleUI: boolean;
	personalInfo: PersonalInfo;
	aiPromptTemplate: string;
	[key: string]: any; // 添加索引签名以支持动态属性访问
}

/**
 * 个人信息接口
 */
export interface PersonalInfo {
	name: string;
	avatar: string;
	bio: string;
	email: string;
	website: string;
}

/**
 * 文章信息接口
 */
export interface ArticleInfo {
	articleTitle?: string;
	author?: string;
	publishDate?: string;
	articleSubtitle?: string;
	seriesName?: string;
	episodeNum?: string;
	tags?: string[];
	[key: string]: any;
}

/**
 * 插件数据接口
 */
export interface PluginData {
	name: string;
	type: 'remark' | 'rehype' | 'unknown';
	description: string;
	enabled: boolean;
	config: Record<string, any>;
	metaConfig: Record<string, any>;
}

/**
 * 持久化存储API接口
 */
export interface PersistentStorageAPI {
	// Template Kit Management
	saveTemplateKit: (kitData: any, customName?: string) => Promise<any>;
	getTemplateKits: () => Promise<any[]>;
	deleteTemplateKit: (id: string) => Promise<any>;

	// Plugin Configuration Management
	savePluginConfig: (pluginName: string, config: any, metaConfig: any) => Promise<any>;
	getPluginConfigs: () => Promise<Record<string, any>>;
	getPluginConfig: (pluginName: string) => Promise<any>;

	// Personal Info Management
	savePersonalInfo: (info: any) => Promise<any>;
	getPersonalInfo: () => Promise<any>;

	// Article Info Management
	saveArticleInfo: (info: any) => Promise<any>;
	getArticleInfo: () => Promise<any>;

	// Style Settings Management
	saveStyleSettings: (settings: any) => Promise<any>;
	getStyleSettings: () => Promise<any>;

	// File and Cover Management
	saveFile: (file: File, customName?: string) => Promise<any>;
	getFiles: () => Promise<any[]>;
	deleteFile: (id: string) => Promise<any>;
	saveCover: (coverData: any) => Promise<any>;
	getCovers: () => Promise<any[]>;
	deleteCover: (id: string) => Promise<any>;

	// Utility functions
	clearAllPersistentData: () => Promise<any>;
	exportAllData: () => Promise<any>;
}

/**
 * React API回调函数接口
 */
export interface ReactAPICallbacks {
	onRefresh: () => Promise<void>;
	onCopy: () => Promise<void>;
	onDistribute: () => Promise<void>;
	onTemplateChange: (template: string) => Promise<void>;
	onThemeChange: (theme: string) => Promise<void>;
	onHighlightChange: (highlight: string) => Promise<void>;
	onThemeColorToggle: (enabled: boolean) => Promise<void>;
	onThemeColorChange: (color: string) => Promise<void>;
	onRenderArticle: () => Promise<void>;
	onSaveSettings: () => void;
	onUpdateCSSVariables: () => void;
	onPluginToggle: (pluginName: string, enabled: boolean) => void;
	onPluginConfigChange: (pluginName: string, key: string, value: string | boolean) => void;
	onExpandedSectionsChange: (sections: string[]) => void;
	onArticleInfoChange: (info: ArticleInfo) => void;
	onPersonalInfoChange: (info: PersonalInfo) => void;
	onSettingsChange: (settingsUpdate: Partial<ReactSettings>) => void;
	onKitApply: (kitId: string) => Promise<void>;
	onKitCreate: (basicInfo: TemplateKitBasicInfo) => Promise<void>;
	onKitDelete: (kitId: string) => Promise<void>;
	loadTemplateKits: () => Promise<TemplateKit[]>;
}

/**
 * React组件Props接口
 */
export interface ReactComponentProps {
	settings: ReactSettings;
	articleHTML: string;
	cssContent: string;
	plugins: PluginData[];
	persistentStorage: PersistentStorageAPI;
	requestUrl: (url: string) => Promise<any>;
}

/**
 * React组件Props包含回调函数
 */
export interface ReactComponentPropsWithCallbacks extends ReactComponentProps, ReactAPICallbacks {}

/**
 * 全局API接口
 */
export interface GlobalReactAPI {
	loadTemplateKits: () => Promise<TemplateKit[]>;
	loadTemplates: () => Promise<string[]>;
	onKitApply: (kitId: string) => Promise<void>;
	onKitCreate: (basicInfo: TemplateKitBasicInfo) => Promise<void>;
	onKitDelete: (kitId: string) => Promise<void>;
	onSettingsChange: (settingsUpdate: Partial<ReactSettings>) => void;
	onPersonalInfoChange: (info: PersonalInfo) => void;
	onArticleInfoChange: (info: ArticleInfo) => void;
	onSaveSettings: () => void;
	persistentStorage: PersistentStorageAPI;
	requestUrl: (url: string) => Promise<any>;
}

/**
 * 类型守卫函数
 */
export function isValidPersonalInfo(obj: any): obj is PersonalInfo {
	return obj && 
		typeof obj.name === 'string' && 
		typeof obj.avatar === 'string' && 
		typeof obj.bio === 'string';
}

export function isValidArticleInfo(obj: any): obj is ArticleInfo {
	return obj && typeof obj === 'object';
}

export function isValidTemplateKitBasicInfo(obj: any): obj is TemplateKitBasicInfo {
	return obj && 
		typeof obj.id === 'string' && 
		typeof obj.name === 'string' && 
		typeof obj.description === 'string';
}