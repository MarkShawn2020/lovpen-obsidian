import {UniversalPluginConfig, UniversalPluginMetaConfig} from "./plugin-config-manager";
import {NMPSettings} from "../../settings";
import {MarkedExtension} from "marked";

/**
 * 插件类型枚举
 */
export enum PluginType {
	HTML = "html",
	MARKDOWN = "markdown"
}

/**
 * 插件元数据接口
 */
export interface PluginMetadata {
	name: string;
	type: PluginType;
	version?: string;
	description?: string;
	author?: string;
}

/**
 * 统一插件接口
 */
export interface IUnifiedPlugin {
	/**
	 * 获取插件元数据
	 */
	getMetadata(): PluginMetadata;

	/**
	 * 获取插件名称
	 */
	getName(): string;

	/**
	 * 获取插件类型
	 */
	getType(): PluginType;

	/**
	 * 获取插件配置
	 */
	getConfig(): UniversalPluginConfig;

	/**
	 * 更新插件配置
	 */
	updateConfig(config: UniversalPluginConfig): UniversalPluginConfig;

	/**
	 * 获取插件配置的元数据
	 */
	getMetaConfig(): UniversalPluginMetaConfig;

	/**
	 * 检查插件是否启用
	 */
	isEnabled(): boolean;

	/**
	 * 设置插件启用状态
	 */
	setEnabled(enabled: boolean): void;
}

/**
 * HTML插件接口（用于HTML后处理）
 */
export interface IHtmlPlugin extends IUnifiedPlugin {
	/**
	 * 处理HTML内容
	 */
	process(html: string, settings: NMPSettings): string;
}

/**
 * Markdown插件接口（用于Markdown解析扩展）
 */
export interface IMarkdownPlugin extends IUnifiedPlugin {
	/**
	 * 获取Marked扩展
	 */
	markedExtension(): MarkedExtension;

	/**
	 * 准备阶段
	 */
	prepare(): Promise<void>;

	/**
	 * 后处理阶段
	 */
	postprocess(html: string): Promise<string>;

	/**
	 * 发布前处理
	 */
	beforePublish(): Promise<void>;

	/**
	 * 清理阶段
	 */
	cleanup(): Promise<void>;
}
