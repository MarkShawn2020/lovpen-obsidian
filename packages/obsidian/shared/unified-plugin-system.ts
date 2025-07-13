import {MarkedExtension} from "marked";
import {App, Vault} from "obsidian";
import {NMPSettings} from "../settings";
import {BasePluginManager} from "./base-plugin-manager";
import {PluginConfigManager, UniversalPluginConfig, UniversalPluginMetaConfig} from "./plugin-config-manager";
import AssetsManager from "../assets";

import {logger} from "../../shared/src/logger";

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

/**
 * 统一插件基类
 */
export abstract class UnifiedPlugin implements IUnifiedPlugin {
	protected configManager: PluginConfigManager | null = null;

	constructor(enabled = true) {
		// 延迟初始化配置管理器
	}

	/**
	 * 获取插件元数据 - 子类必须实现
	 */
	abstract getMetadata(): PluginMetadata;

	/**
	 * 获取插件名称
	 */
	getName(): string {
		return this.getMetadata().name;
	}

	/**
	 * 获取插件类型
	 */
	getType(): PluginType {
		return this.getMetadata().type;
	}

	/**
	 * 获取插件配置
	 */
	getConfig(): UniversalPluginConfig {
		return this.getConfigManager().getConfig();
	}

	/**
	 * 更新插件配置
	 */
	updateConfig(config: UniversalPluginConfig): UniversalPluginConfig {
		return this.getConfigManager().updateConfig(config);
	}

	/**
	 * 获取插件配置的元数据
	 */
	getMetaConfig(): UniversalPluginMetaConfig {
		return {};
	}

	/**
	 * 检查插件是否启用
	 */
	isEnabled(): boolean {
		return this.getConfigManager().isEnabled();
	}

	/**
	 * 设置插件启用状态
	 */
	setEnabled(enabled: boolean): void {
		this.getConfigManager().setEnabled(enabled);
	}

	/**
	 * 获取配置管理器（延迟初始化）
	 */
	protected getConfigManager(): PluginConfigManager {
		if (!this.configManager) {
			this.configManager = new PluginConfigManager(this.getName(), {enabled: true});
		}
		return this.configManager;
	}
}

/**
 * HTML插件基类
 */
export abstract class HtmlPlugin extends UnifiedPlugin implements IHtmlPlugin {
	/**
	 * 获取插件元数据
	 */
	getMetadata(): PluginMetadata {
		return {
			name: this.getPluginName(),
			type: PluginType.HTML,
			description: this.getPluginDescription()
		};
	}

	/**
	 * 获取插件名称 - 子类必须实现
	 */
	abstract getPluginName(): string;

	/**
	 * 获取插件描述 - 子类可选实现
	 */
	getPluginDescription(): string {
		return "";
	}

	/**
	 * 处理HTML内容 - 子类必须实现
	 */
	abstract process(html: string, settings: NMPSettings): string;

	/**
	 * 获取主题色
	 */
	protected getThemeColor(settings: NMPSettings): string {
		let themeAccentColor: string;

		if (settings.enableThemeColor) {
			themeAccentColor = settings.themeColor || "#7852ee";
			logger.debug("使用自定义主题色：", themeAccentColor);
		} else {
			try {
				const testElement = document.createElement("div");
				testElement.style.display = "none";
				testElement.className = "lovpen";
				document.body.appendChild(testElement);

				const computedStyle = window.getComputedStyle(testElement);
				const primaryColor = computedStyle
					.getPropertyValue("--primary-color")
					.trim();

				logger.debug("获取到的主题色：", primaryColor);
				if (primaryColor) {
					themeAccentColor = primaryColor;
				} else {
					themeAccentColor = "#7852ee";
				}

				document.body.removeChild(testElement);
			} catch (e) {
				themeAccentColor = "#7852ee";
				logger.error("无法获取主题色变量，使用默认值", e);
			}
		}

		return themeAccentColor;
	}
}

/**
 * Markdown插件基类
 */
export abstract class MarkdownPlugin extends UnifiedPlugin implements IMarkdownPlugin {
	app: App;
	vault: Vault;
	assetsManager: AssetsManager;
	settings: NMPSettings;
	callback: any;
	marked: any; // 添加 marked 属性

	constructor(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: any) {
		super();
		this.app = app;
		this.vault = app.vault;
		this.settings = settings;
		this.assetsManager = assetsManager;
		this.callback = callback;
	}

	/**
	 * 获取插件元数据
	 */
	getMetadata(): PluginMetadata {
		return {
			name: this.getPluginName(),
			type: PluginType.MARKDOWN,
			description: this.getPluginDescription()
		};
	}

	/**
	 * 获取插件名称 - 子类必须实现
	 */
	abstract getPluginName(): string;

	/**
	 * 获取插件描述 - 子类可选实现
	 */
	getPluginDescription(): string {
		return "";
	}

	/**
	 * 获取Marked扩展 - 子类必须实现
	 */
	abstract markedExtension(): MarkedExtension;

	/**
	 * 准备阶段
	 */
	async prepare(): Promise<void> {
		return;
	}

	/**
	 * 后处理阶段
	 */
	async postprocess(html: string): Promise<string> {
		return html;
	}

	/**
	 * 发布前处理
	 */
	async beforePublish(): Promise<void> {
		return;
	}

	/**
	 * 清理阶段
	 */
	async cleanup(): Promise<void> {
		return;
	}
}

/**
 * 统一插件管理器
 */
export class UnifiedPluginManager extends BasePluginManager<IUnifiedPlugin> {
	private static instance: UnifiedPluginManager;

	private constructor() {
		super();
	}

	/**
	 * 获取管理器单例
	 */
	public static getInstance(): UnifiedPluginManager {
		if (!UnifiedPluginManager.instance) {
			UnifiedPluginManager.instance = new UnifiedPluginManager();
		}
		return UnifiedPluginManager.instance;
	}

	/**
	 * 获取指定类型的插件
	 */
	public getPluginsByType(type: PluginType): IUnifiedPlugin[] {
		return this.plugins.filter(plugin => plugin.getType() === type);
	}

	/**
	 * 获取所有HTML插件
	 */
	public getHtmlPlugins(): IHtmlPlugin[] {
		return this.getPluginsByType(PluginType.HTML) as IHtmlPlugin[];
	}

	/**
	 * 获取所有Markdown插件
	 */
	public getMarkdownPlugins(): IMarkdownPlugin[] {
		return this.getPluginsByType(PluginType.MARKDOWN) as IMarkdownPlugin[];
	}

	/**
	 * 处理HTML内容 - 应用所有启用的HTML插件
	 */
	public processContent(html: string, settings: NMPSettings): string {
		logger.debug("[processContent]", settings)

		const htmlPlugins = this.getHtmlPlugins();
		logger.debug(`开始处理内容，共有 ${htmlPlugins.length} 个HTML插件`);

		let appliedPluginCount = 0;

		const result = htmlPlugins.reduce((processedHtml, plugin) => {
			if (plugin.isEnabled()) {
				logger.debug(`应用HTML插件: ${plugin.getName()}`);
				appliedPluginCount++;
				return plugin.process(processedHtml, settings);
			} else {
				logger.debug(`跳过禁用的HTML插件: ${plugin.getName()}`);
				return processedHtml;
			}
		}, html);

		logger.debug(`内容处理完成，实际应用了 ${appliedPluginCount} 个HTML插件`);
		return result;
	}

	/**
	 * 获取所有启用的Markdown插件扩展
	 */
	public getEnabledMarkdownExtensions(): MarkedExtension[] {
		const markdownPlugins = this.getMarkdownPlugins();
		return markdownPlugins
			.filter(plugin => plugin.isEnabled())
			.map(plugin => plugin.markedExtension());
	}

	protected getManagerName(): string {
		return "统一插件";
	}
}
