/**
 * Obsidian Plugin Global API Types
 * 定义obsidian插件暴露给frontend的全局API接口
 */

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

// 持久化存储API接口
export interface PersistentStorageAPI {
	saveTemplateKit: (kitData: any, customName?: string) => Promise<void>;
	loadTemplateKit: (kitName: string) => Promise<any>;
	deleteTemplateKit: (kitName: string) => Promise<void>;
	listTemplateKits: () => Promise<string[]>;
	saveFile: (file: File, options?: { name?: string; type?: string }) => Promise<void>;
	getFiles: () => Promise<any[]>;
	getFileUrl: (file: any) => Promise<string>;
	deleteFile: (id: string) => Promise<void>;
	clearFiles: () => Promise<void>;
	savePluginConfig: (pluginName: string, config: any, metaConfig?: any) => Promise<void>;
	getPluginConfig: (pluginName: string) => Promise<any>;
	deletePluginConfig: (pluginName: string) => Promise<void>;
	getAllPluginConfigs: () => Promise<Record<string, any>>;
	saveArticleInfo: (info: any) => Promise<void>;
	getArticleInfo: () => Promise<any>;
	deleteArticleInfo: () => Promise<void>;
	saveSettings: (settings: any) => Promise<void>;
	getSettings: () => Promise<any>;
	deleteSettings: () => Promise<void>;
	exportAllData: () => Promise<any>;
}

// 模板套装相关API
export interface TemplateKitAPI {
	loadTemplateKits: () => Promise<any[]>;
	loadTemplates: () => Promise<string[]>;
	onKitApply: (kitId: string) => Promise<void>;
	onKitCreate: (basicInfo: any) => Promise<void>;
	onKitDelete: (kitId: string) => Promise<void>;
}

// 设置相关API
export interface SettingsAPI {
	onSettingsChange: (settingsUpdate: any) => void;
	onPersonalInfoChange: (info: any) => void;
	onArticleInfoChange: (info: any) => void;
	onSaveSettings: () => void;
}

// 完整的全局API接口
export interface LovpenReactAPI extends TemplateKitAPI, SettingsAPI {
	persistentStorage: PersistentStorageAPI;
	requestUrl: RequestUrlFunction;
}

// 扩展Window接口
declare global {
	interface Window {
		lovpenReactAPI: LovpenReactAPI;
	}
}

export {};