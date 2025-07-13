import {logger} from "../../shared/src/logger";

/**
 * 基础插件管理器 - 提供通用的单例模式实现和插件管理功能
 */
export abstract class BasePluginManager<T> {
	protected plugins: T[] = [];

	/**
	 * 私有构造函数，确保单例模式
	 */
	protected constructor() {
		logger.debug(`初始化${this.getManagerName()}管理器`);
	}

	/**
	 * 注册一个插件
	 * @param plugin 要注册的插件
	 * @returns 当前管理器实例，支持链式调用
	 */
	public registerPlugin(plugin: T): this {
		const pluginName = this.getPluginName(plugin);

		// 检查插件是否已经注册
		const existingPlugin = this.plugins.find(p => this.getPluginName(p) === pluginName);
		if (existingPlugin) {
			logger.debug(`插件 ${pluginName} 已存在，跳过注册`);
			return this;
		}

		logger.debug(`注册${this.getManagerName()}插件: ${pluginName}`);
		this.plugins.push(plugin);
		return this;
	}

	/**
	 * 批量注册插件
	 * @param plugins 要注册的插件数组
	 * @returns 当前管理器实例，支持链式调用
	 */
	public registerPlugins(plugins: T[]): this {
		plugins.forEach(plugin => this.registerPlugin(plugin));
		return this;
	}

	/**
	 * 获取所有已注册的插件
	 * @returns 插件数组
	 */
	public getPlugins(): T[] {
		return [...this.plugins];
	}

	/**
	 * 获取管理器名称 - 子类必须实现
	 */
	protected getManagerName() {
		return "插件"
	}

	/**
	 * 获取插件名称
	 */
	protected getPluginName(plugin: T): string {
		return (plugin as any).getName();
	}
}

/**
 * 插件配置管理mixin - 提供通用的配置管理功能
 */
export interface IPluginConfigurable {
	/**
	 * 获取插件配置
	 */
	getConfig(): any;

	/**
	 * 更新插件配置
	 */
	updateConfig(config: any): any;

	/**
	 * 获取插件配置的元数据
	 */
	getMetaConfig(): any;

	/**
	 * 检查插件是否启用
	 */
	isEnabled(): boolean;

	/**
	 * 设置插件启用状态
	 */
	setEnabled(enabled: boolean): void;
}
