import {NMPSettings} from "../settings";


import {logger} from "../../shared/src/logger";

/**
 * 通用插件配置接口
 */
export interface UniversalPluginConfig {
	enabled?: boolean;

	[key: string]: string | number | boolean | null | undefined | string[] | number[] | Record<string, unknown>;
}

/**
 * 通用插件元配置选项接口
 */
export interface UniversalPluginMetaConfigOption {
	value: string;
	text: string;
}

/**
 * 通用插件元配置项接口
 */
export interface UniversalPluginMetaConfigItem {
	type: "switch" | "select" | "text" | "number";
	title: string;
	options?: UniversalPluginMetaConfigOption[];
}

/**
 * 通用插件元配置接口
 */
export interface UniversalPluginMetaConfig {
	[key: string]: UniversalPluginMetaConfigItem;
}

/**
 * 插件配置管理器 - 提供统一的配置管理功能
 */
export class PluginConfigManager {
	private _config: UniversalPluginConfig = {enabled: true};
	private pluginName: string;

	constructor(pluginName: string, defaultConfig?: UniversalPluginConfig) {
		this.pluginName = pluginName;
		if (defaultConfig) {
			this._config = {...this._config, ...defaultConfig};
		}
		this.loadConfigFromSettings();
	}

	/**
	 * 获取插件配置
	 */
	getConfig(): UniversalPluginConfig {
		return {...this._config};
	}

	/**
	 * 更新插件配置
	 */
	updateConfig(config: UniversalPluginConfig): UniversalPluginConfig {
		this._config = {...this._config, ...config};
		this.saveConfigToSettings();
		return this.getConfig();
	}

	/**
	 * 检查插件是否启用
	 */
	isEnabled(): boolean {
		return this._config.enabled !== false;
	}

	/**
	 * 设置插件启用状态
	 */
	setEnabled(enabled: boolean): void {
		this._config.enabled = enabled;
		this.saveConfigToSettings();
		logger.debug(`插件 ${this.pluginName} 的启用状态已更改为: ${enabled}`);
	}

	/**
	 * 从用户设置中加载插件配置
	 */
	private loadConfigFromSettings(): void {
		try {
			const settings = NMPSettings.getInstance();

			// 如果设置中有该插件的配置，使用它
			if (settings.pluginsConfig && settings.pluginsConfig[this.pluginName]) {
				this._config = {...this._config, ...settings.pluginsConfig[this.pluginName]};
				logger.debug(`从设置中加载了 ${this.pluginName} 插件配置:`, this._config);
			}
		} catch (error) {
			logger.error(`加载插件配置失败:`, error);
		}
	}

	/**
	 * 保存插件配置到用户设置
	 */
	private saveConfigToSettings(): void {
		try {
			const settings = NMPSettings.getInstance();

			// 确保pluginsConfig对象存在
			if (!settings.pluginsConfig) {
				settings.pluginsConfig = {};
			}

			// 保存当前插件配置
			settings.pluginsConfig[this.pluginName] = this.getConfig();
			logger.debug(`保存了 ${this.pluginName} 插件配置:`, this._config);

			// 触发设置保存
			this.triggerSettingsSave();
		} catch (error) {
			logger.error(`保存插件配置失败:`, error);
		}
	}

	/**
	 * 触发设置保存
	 */
	private triggerSettingsSave(): void {
		try {
			const app = (window as any).app;
			if (app) {
				const pluginManager = app as any;
				if (pluginManager.plugins) {
					const plugin = pluginManager.plugins.plugins["lovpen"];
					if (plugin && typeof plugin.saveSettings === "function") {
						plugin.saveSettings();
						logger.debug(`已触发插件的 saveSettings 方法`);
					}
				}
			}
		} catch (e) {
			logger.error(`触发设置保存时出错:`, e);
		}
	}
}
