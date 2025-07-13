import {RehypePlugin} from "./rehype-plugin";
import {MarkedParser} from "./parser";
import {BasePluginManager} from "../shared/base-plugin-manager";

import {logger} from "../../shared/src/logger";

/**
 * Extension管理器 - 为remark扩展系统提供类似rehype插件管理器的功能
 */
export class RehypePluginManager extends BasePluginManager<RehypePlugin> {
	private static instance: RehypePluginManager;
	private parser: MarkedParser | null = null;

	/**
	 * 私有构造函数，确保单例模式
	 */
	private constructor() {
		super();
	}

	/**
	 * 获取管理器单例
	 * @returns Extension管理器实例
	 */
	public static getInstance(): RehypePluginManager {
		if (!RehypePluginManager.instance) {
			RehypePluginManager.instance = new RehypePluginManager();
		}
		return RehypePluginManager.instance;
	}

	/**
	 * 设置MarkedParser实例
	 * @param parser MarkedParser实例
	 */
	public setParser(parser: MarkedParser): void {
		this.parser = parser;
		// 从 parser 中获取所有插件并注册到管理器
		const extensions = parser.getExtensions();
		this.registerPlugins(extensions as any);
		logger.debug("设置MarkedParser实例到Extension管理器");
	}

}
