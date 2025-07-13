import {Marked, MarkedExtension} from "marked";
import {App, Vault} from "obsidian";
import {NMPSettings} from "../settings";
import AssetsManager from "../assets";
import {PluginConfigManager, UniversalPluginConfig, UniversalPluginMetaConfig} from "../shared/plugin-config-manager";

export interface MDRendererCallback {
	settings: NMPSettings;

	updateElementByID(id: string, html: string): void;
}

/**
 * Extension配置接口 - 使用统一的配置接口
 */
export type RehypePluginConfig = UniversalPluginConfig;

/**
 * Extension元配置接口 - 使用统一的元配置接口
 */
export type RehypePluginMetaConfig = UniversalPluginMetaConfig;

export abstract class RehypePlugin {
	app: App;
	vault: Vault;
	assetsManager: AssetsManager
	settings: NMPSettings;
	callback: MDRendererCallback;
	marked: Marked;

	/**
	 * 插件配置管理器
	 */
	protected configManager: PluginConfigManager | null = null;

	constructor(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: MDRendererCallback) {
		this.app = app;
		this.vault = app.vault;
		this.settings = settings;
		this.assetsManager = assetsManager;
		this.callback = callback;
	}

	/**
	 * 获取插件名称 - 子类必须实现
	 */
	abstract getName(): string;

	/**
	 * 获取插件配置的元数据 - 子类可以重写
	 */
	getMetaConfig(): RehypePluginMetaConfig {
		// 默认返回空配置，与rehype插件系统保持一致
		// 只有具备额外配置选项的插件才需要重写此方法
		return {};
	}

	/**
	 * 获取插件配置
	 */
	getConfig(): RehypePluginConfig {
		return this.getConfigManager().getConfig();
	}

	/**
	 * 更新插件配置
	 */
	updateConfig(config: RehypePluginConfig): RehypePluginConfig {
		return this.getConfigManager().updateConfig(config);
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

	async prepare() {
		return;
	}

	async postprocess(html: string) {
		return html;
	}

	async beforePublish() {
	}

	async cleanup() {
		return;
	}

	abstract markedExtension(): MarkedExtension

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
