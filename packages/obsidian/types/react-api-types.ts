import {TemplateKit, TemplateKitBasicInfo} from "../template-kit-types";
import {PersistentStorageAPI, RequestUrlFunction, SettingsAPI, TemplateKitAPI} from "@lovpen/shared";

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
	aiModel: string;

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
 * UI特定的回调函数接口 - 仅包含UI交互相关的回调
 */
export interface UISpecificCallbacks {
	onRefresh: () => Promise<void>;
	onCopy: () => Promise<void>;
	onDistribute: () => Promise<void>;
	onTemplateChange: (template: string) => Promise<void>;
	onThemeChange: (theme: string) => Promise<void>;
	onHighlightChange: (highlight: string) => Promise<void>;
	onThemeColorToggle: (enabled: boolean) => Promise<void>;
	onThemeColorChange: (color: string) => Promise<void>;
	onRenderArticle: () => Promise<void>;
	onUpdateCSSVariables: () => void;
	onPluginToggle: (pluginName: string, enabled: boolean) => void;
	onPluginConfigChange: (pluginName: string, key: string, value: string | boolean) => void;
	onExpandedSectionsChange: (sections: string[]) => void;
}

/**
 * 类型增强的模板套装API - 提供更具体的TypeScript类型
 * 扩展shared包的基础类型，提供obsidian包特有的详细类型
 */
export interface EnhancedTemplateKitAPI extends TemplateKitAPI {
	// 重写以提供更具体的类型
	loadTemplateKits: () => Promise<TemplateKit[]>;
	onKitCreate: (basicInfo: TemplateKitBasicInfo) => Promise<void>;
}

/**
 * 类型增强的设置API - 提供更具体的TypeScript类型
 * 扩展shared包的基础类型，提供obsidian包特有的详细类型
 */
export interface EnhancedSettingsAPI extends SettingsAPI {
	// 重写以提供更具体的类型
	onSettingsChange: (settingsUpdate: Partial<ReactSettings>) => void;
	onPersonalInfoChange: (info: PersonalInfo) => void;
	onArticleInfoChange: (info: ArticleInfo) => void;
}

/**
 * React API回调函数接口 - 组合UI回调和增强的业务API
 */
export interface ReactAPICallbacks extends UISpecificCallbacks, EnhancedTemplateKitAPI, EnhancedSettingsAPI {
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
export interface ReactComponentPropsWithCallbacks extends ReactComponentProps, ReactAPICallbacks {
}

/**
 * 全局API接口
 * 专门用于window.lovpenReactAPI，只包含核心业务方法和存储/请求功能
 * 与ReactAPICallbacks分离，避免UI回调污染全局API
 */
export interface GlobalReactAPI {
	// 模板套装相关API (更具体的类型)
	loadTemplateKits: () => Promise<TemplateKit[]>;
	loadTemplates: () => Promise<string[]>;
	onKitApply: (kitId: string) => Promise<void>;
	onKitCreate: (basicInfo: TemplateKitBasicInfo) => Promise<void>;
	onKitDelete: (kitId: string) => Promise<void>;

	// 设置相关API (更具体的类型)
	onSettingsChange: (settingsUpdate: Partial<ReactSettings>) => void;
	onPersonalInfoChange: (info: PersonalInfo) => void;
	onArticleInfoChange: (info: ArticleInfo) => void;
	onSaveSettings: () => void;

	// 全局API特有的功能
	persistentStorage: PersistentStorageAPI;
	requestUrl: RequestUrlFunction;
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
