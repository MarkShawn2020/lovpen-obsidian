/**
 * 模板套装系统类型定义
 * 提供完整的样式配置组合，用户可以一键应用所有相关设置
 */

export interface TemplateKitBasicInfo {
	/** 套装唯一标识 */
	id: string;
	/** 套装名称 */
	name: string;
	/** 套装描述 */
	description: string;
	/** 作者信息 */
	author: string;
	/** 版本号 */
	version: string;
	/** 预览图URL */
	previewImage?: string;
	/** 封面图片路径 */
	coverImage?: string;
	/** 创建时间 */
	createdAt: string;
	/** 更新时间 */
	updatedAt: string;
	/** 标签 */
	tags: string[];
}

export interface TemplateKitStyleConfig {
	/** 主题名称 */
	theme: string;
	/** 代码高亮样式 */
	codeHighlight: string;
	/** 自定义CSS变量 */
	cssVariables: Record<string, string>;
	/** 是否启用自定义主题色 */
	enableCustomThemeColor: boolean;
	/** 自定义主题色 */
	customThemeColor?: string;
	/** 自定义CSS */
	customCSS?: string;
}

export interface TemplateKitTemplateConfig {
	/** 模板文件名 */
	templateFileName: string;
	/** 模板内容 (如果是内联模板) */
	templateContent?: string;
	/** 是否启用模板 */
	useTemplate: boolean;
}

export interface TemplateKitPluginConfig {
	/** 启用的Markdown插件 */
	enabledMarkdownPlugins: string[];
	/** 启用的HTML插件 */
	enabledHtmlPlugins: string[];
	/** 插件特定配置 */
	pluginSettings: Record<string, any>;
}

export interface TemplateKit {
	/** 基本信息 */
	basicInfo: TemplateKitBasicInfo;
	/** 样式配置 */
	styleConfig: TemplateKitStyleConfig;
	/** 模板配置 */
	templateConfig: TemplateKitTemplateConfig;
	/** 插件配置 */
	pluginConfig: TemplateKitPluginConfig;
}

export interface TemplateKitCollection {
	/** 版本信息 */
	version: string;
	/** 套装列表 */
	kits: TemplateKit[];
}

export interface TemplateKitApplyOptions {
	/** 是否覆盖现有设置 */
	overrideExisting: boolean;
	/** 是否应用样式配置 */
	applyStyles: boolean;
	/** 是否应用模板配置 */
	applyTemplate: boolean;
	/** 是否应用插件配置 */
	applyPlugins: boolean;
	/** 是否显示确认对话框 */
	showConfirmDialog: boolean;
}

export interface TemplateKitPreview {
	/** 套装ID */
	kitId: string;
	/** 预览HTML */
	previewHtml: string;
	/** 预览样式 */
	previewCss: string;
	/** 生成时间 */
	generatedAt: string;
}

export interface TemplateKitOperationResult {
	/** 操作是否成功 */
	success: boolean;
	/** 错误消息 */
	error?: string;
	/** 操作结果数据 */
	data?: any;
}

export interface TemplateKitManagerConfig {
	/** 套装存储路径 */
	kitsStoragePath: string;
	/** 是否启用自动备份 */
	enableAutoBackup: boolean;
	/** 备份保留天数 */
	backupRetentionDays: number;
	/** 是否启用套装预览 */
	enablePreview: boolean;
}

export interface TemplateKitExportOptions {
	/** 是否包含模板文件 */
	includeTemplateFiles: boolean;
	/** 是否包含主题文件 */
	includeThemeFiles: boolean;
	/** 是否包含预览图 */
	includePreviewImage: boolean;
	/** 导出格式 */
	exportFormat: 'json' | 'zip';
}

export interface TemplateKitImportOptions {
	/** 是否覆盖同名套装 */
	overrideExisting: boolean;
	/** 是否验证套装完整性 */
	validateIntegrity: boolean;
	/** 是否自动应用导入的套装 */
	autoApply: boolean;
}

/**
 * 模板套装管理器接口
 */
export interface ITemplateKitManager {
	/** 获取所有套装 */
	getAllKits(): Promise<TemplateKit[]>;

	/** 根据ID获取套装 */
	getKitById(id: string): Promise<TemplateKit | null>;

	/** 应用套装 */
	applyKit(kitId: string, options?: TemplateKitApplyOptions): Promise<TemplateKitOperationResult>;

	/** 创建套装 */
	createKit(kit: TemplateKit): Promise<TemplateKitOperationResult>;

	/** 更新套装 */
	updateKit(kitId: string, kit: Partial<TemplateKit>): Promise<TemplateKitOperationResult>;

	/** 删除套装 */
	deleteKit(kitId: string): Promise<TemplateKitOperationResult>;

	/** 导出套装 */
	exportKit(kitId: string, options?: TemplateKitExportOptions): Promise<TemplateKitOperationResult>;

	/** 导入套装 */
	importKit(kitData: any, options?: TemplateKitImportOptions): Promise<TemplateKitOperationResult>;

	/** 生成套装预览 */
	generatePreview(kitId: string, content: string): Promise<TemplateKitPreview>;

	/** 从当前设置创建套装 */
	createKitFromCurrentSettings(basicInfo: TemplateKitBasicInfo): Promise<TemplateKitOperationResult>;
}
