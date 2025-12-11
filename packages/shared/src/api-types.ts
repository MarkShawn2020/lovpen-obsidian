/**
 * 跨包共享的API类型定义
 * 供frontend和obsidian包共同使用，确保类型一致性和IDE导航
 */

// 共享的基础数据类型
export interface BasicTemplateKit {
	basicInfo: {
		id: string;
		name: string;
		description: string;
		author?: string;
		version?: string;
		tags?: string[];
		previewImage?: string;
	};
	styleConfig?: {
		theme?: string;
		codeHighlight?: string;
		enableCustomThemeColor?: boolean;
		customThemeColor?: string;
	};
	templateConfig?: {
		templateFileName?: string;
		useTemplate?: boolean;
	};
	pluginConfig?: {
		enabledMarkdownPlugins?: string[];
		enabledHtmlPlugins?: string[];
		pluginSettings?: Record<string, any>;
	};
}

export interface BasicTemplateKitInfo {
	id: string;
	name: string;
	description: string;
	author?: string;
	version?: string;
	tags?: string[];
}

export interface AvatarConfig {
	type: 'default' | 'uploaded' | 'initials';
	data?: string;
	initials?: string;
	backgroundColor?: string;
}

export interface SocialLinks {
	twitter?: string;
	github?: string;
	zhihu?: string;
	xiaohongshu?: string;
	weibo?: string;
	wechat?: string;
	linkedin?: string;
}

export interface BasicPersonalInfo {
	name: string;
	avatar?: AvatarConfig;
	bio: string;
	email?: string;
	website?: string;
	socialLinks?: SocialLinks;
}

export interface BasicArticleInfo {
	articleTitle?: string;
	author?: string;
	publishDate?: string;
	articleSubtitle?: string;
	seriesName?: string;
	episodeNum?: string;
	tags?: string[];

	[key: string]: any;
}

export interface BasicSettingsUpdate {
	defaultStyle?: string;
	defaultHighlight?: string;
	defaultTemplate?: string;
	useTemplate?: boolean;
	enableThemeColor?: boolean;
	themeColor?: string;

	[key: string]: any;
}

// Obsidian requestUrl function type
export interface RequestUrlOptions {
	url: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	headers?: Record<string, string>;
	body?: string | ArrayBuffer;
}

export interface RequestUrlResponse {
	status: number;
	headers: Record<string, string>;
	text: string;
	json: any;
	arrayBuffer: ArrayBuffer;
}

export type RequestUrlFunction = (options: RequestUrlOptions) => Promise<RequestUrlResponse>;

// 持久化存储API接口 - 基于实际实现定义
export interface PersistentStorageAPI {
	// Template Kit Management
	saveTemplateKit: (kitData: any, customName?: string) => Promise<any>;
	getTemplateKits: () => Promise<any[]>;
	deleteTemplateKit: (id: string) => Promise<void>;

	// Plugin Configuration Management  
	savePluginConfig: (pluginName: string, config: any, metaConfig: any) => Promise<any>;
	getPluginConfigs: () => Promise<any[]>;
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
	getFileUrl: (file: any) => Promise<string>;
	deleteFile: (id: string) => Promise<void>;
	saveCover: (coverData: any) => Promise<any>;
	getCovers: () => Promise<any[]>;
	deleteCover: (id: string) => Promise<void>;

	// Utility functions
	clearAllPersistentData: () => Promise<void>;
	exportAllData: () => Promise<any>;
}

// 模板套装相关API
export interface TemplateKitAPI {
	/**
	 * 加载所有模板套装
	 * @implementation @packages/obsidian/services/ReactAPIService.ts#loadTemplateKits
	 */
	loadTemplateKits: () => Promise<BasicTemplateKit[]>;
	/**
	 * 加载所有模板
	 * @implementation @packages/obsidian/services/ReactAPIService.ts#loadTemplates
	 */
	loadTemplates: () => Promise<string[]>;
	/**
	 * 应用指定的套装
	 * @implementation @packages/obsidian/note-preview-external.tsx#handleKitApply
	 */
	onKitApply: (kitId: string) => Promise<void>;
	/**
	 * 创建新的套装
	 * @implementation @packages/obsidian/note-preview-external.tsx#handleKitCreate
	 */
	onKitCreate: (basicInfo: BasicTemplateKitInfo) => Promise<void>;
	/**
	 * 删除指定的套装
	 * @implementation @packages/obsidian/note-preview-external.tsx#handleKitDelete
	 */
	onKitDelete: (kitId: string) => Promise<void>;
}

// 设置相关API
export interface SettingsAPI {
	onSettingsChange: (settingsUpdate: BasicSettingsUpdate) => void;
	onPersonalInfoChange: (info: BasicPersonalInfo) => void;
	onArticleInfoChange: (info: BasicArticleInfo) => void;
	onSaveSettings: () => void;
}

// 代码块图片化结果
export interface CodeBlockImageResult {
	success: boolean;
	imageUrl?: string;
	error?: string;
}

// 代码块操作API
export interface CodeBlockAPI {
	/**
	 * 将代码块截图上传并替换源Markdown
	 * @param codeContent 代码块内容（用于匹配源Markdown）
	 * @param imageDataUrl 截图的data URL
	 */
	uploadCodeBlockAsImage: (codeContent: string, imageDataUrl: string) => Promise<CodeBlockImageResult>;
}

// 完整的全局API接口
export interface LovpenReactAPI extends TemplateKitAPI, SettingsAPI, CodeBlockAPI {
	persistentStorage: PersistentStorageAPI;
	requestUrl: RequestUrlFunction;
}

// Window全局类型扩展
export interface LovpenGlobalAPI {
	lovpenReactAPI: LovpenReactAPI;
}

declare global {
	interface Window extends LovpenGlobalAPI {
	}
}
