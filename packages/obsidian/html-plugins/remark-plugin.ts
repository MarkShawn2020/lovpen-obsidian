import {NMPSettings} from "../settings";
import {App} from "obsidian";
import {PluginConfigManager, UniversalPluginConfig, UniversalPluginMetaConfig} from "../shared/plugin/plugin-config-manager";

import {logger} from "../../shared/src/logger";

// 为 window 接口扩展，添加 app 属性
declare global {
	interface Window {
		app: App;
	}
}

/**
 * 插件元配置接口 - 使用统一的元配置接口
 */
export type RemarkPluginMetaConfig = UniversalPluginMetaConfig;


/**
 * 微信处理插件接口 - 定义处理HTML内容的插件接口
 */
export interface IRemarkPlugin {
	/**
	 * 获取插件名称
	 * @returns 插件名称
	 */
	getName(): string;

	/**
	 * 处理HTML内容
	 * @param html 待处理的HTML内容
	 * @param settings 当前设置
	 * @returns 处理后的HTML内容
	 */
	process(html: string, settings: NMPSettings): string;

	/**
	 * 获取插件配置
	 * @returns 插件的当前配置
	 */
	getConfig(): UniversalPluginConfig;

	/**
	 * 更新插件配置
	 * @param config 新的配置对象
	 * @returns 更新后的配置
	 */
	updateConfig(config: UniversalPluginConfig): UniversalPluginConfig;

	/**
	 * 获取插件配置的元数据
	 * 包含控件类型、标题、选项等UI交互相关信息
	 * @returns 插件配置的元数据
	 */
	getMetaConfig(): RemarkPluginMetaConfig;

	/**
	 * 检查插件是否启用
	 * @returns 插件是否启用
	 */
	isEnabled(): boolean;

	/**
	 * 设置插件启用状态
	 * @param enabled 是否启用
	 */
	setEnabled(enabled: boolean): void;
}

/**
 * 基础插件类，提供通用功能
 */
export abstract class RemarkPlugin implements IRemarkPlugin {
	/**
	 * 插件配置管理器
	 */
	protected configManager: PluginConfigManager | null = null;

	/**
	 * 插件构造函数
	 */
	constructor(enabled = true) {
		// 配置管理器将在第一次调用时延迟初始化
	}

	/**
	 * 获取插件配置
	 * @returns 插件的当前配置
	 */
	getConfig(): UniversalPluginConfig {
		return this.getConfigManager().getConfig();
	}

	/**
	 * 更新插件配置
	 * @param config 新的配置对象
	 * @returns 更新后的配置
	 */
	updateConfig(config: UniversalPluginConfig): UniversalPluginConfig {
		return this.getConfigManager().updateConfig(config);
	}

	/**
	 * 获取插件配置的元数据
	 * 包含控件类型、标题、选项等UI交互相关信息
	 * @returns 插件配置的元数据
	 */
	getMetaConfig(): RemarkPluginMetaConfig {
		// 默认返回空元配置，子类可以重写该方法以提供特定的元配置
		return {};
	}

	/**
	 * 插件名称，子类必须实现
	 */
	abstract getName(): string;

	/**
	 * 处理HTML内容，子类必须实现
	 */
	abstract process(html: string, settings: NMPSettings): string;

	/**
	 * 检查插件是否启用
	 * @returns 插件是否启用
	 */
	isEnabled(): boolean {
		return this.getConfigManager().isEnabled();
	}

	/**
	 * 设置插件启用状态
	 * @param enabled 是否启用
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

	/**
	 * 获取主题色
	 */
	protected getThemeColor(settings: NMPSettings): string {
		// 动态获取当前主题颜色
		let themeAccentColor: string;

		// 如果启用了自定义主题色，使用用户设置的颜色
		if (settings.enableThemeColor) {
			themeAccentColor = settings.themeColor || "#7852ee";
			logger.debug("使用自定义主题色：", themeAccentColor);
		} else {
			// 从当前激活的DOM中获取实际使用的主题颜色
			try {
				// 尝试从文档中获取计算后的CSS变量值
				const testElement = document.createElement("div");
				testElement.style.display = "none";
				testElement.className = "lovpen";
				document.body.appendChild(testElement);

				// 获取计算后的样式
				const computedStyle = window.getComputedStyle(testElement);
				const primaryColor = computedStyle
					.getPropertyValue("--primary-color")
					.trim();

				logger.debug("获取到的主题色：", primaryColor);
				if (primaryColor) {
					themeAccentColor = primaryColor;
				} else {
					// 如果无法获取，默认使用紫色
					themeAccentColor = "#7852ee";
				}

				// 清理测试元素
				document.body.removeChild(testElement);
			} catch (e) {
				// 如果出错，回退到默认值
				themeAccentColor = "#7852ee";
				logger.error("无法获取主题色变量，使用默认值", e);
			}
		}

		return themeAccentColor;
	}

}
