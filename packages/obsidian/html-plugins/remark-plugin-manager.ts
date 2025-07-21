import {IRemarkPlugin} from "./remark-plugin";
import {NMPSettings} from "../settings";
import {BasePluginManager} from "../shared/plugin/base-plugin-manager";

import {logger} from "../../shared/src/logger";

/**
 * 插件管理器 - 集中管理所有处理插件
 */
export class RemarkPluginManager extends BasePluginManager<IRemarkPlugin> {
	private static instance: RemarkPluginManager;

	/**
	 * 私有构造函数，确保单例模式
	 */
	private constructor() {
		super();
	}

	/**
	 * 获取插件管理器单例
	 * @returns 插件管理器实例
	 */
	public static getInstance(): RemarkPluginManager {
		if (!RemarkPluginManager.instance) {
			RemarkPluginManager.instance = new RemarkPluginManager();
		}
		return RemarkPluginManager.instance;
	}


	/**
	 * 处理HTML内容 - 应用所有启用的插件
	 * @param html 原始HTML内容
	 * @param settings 插件设置
	 * @returns 处理后的HTML内容
	 */
	public processContent(html: string, settings: NMPSettings): string {
		logger.debug(`开始处理内容，共有 ${this.plugins.length} 个已注册插件`);

		// 计数器，记录实际应用的插件数量
		let appliedPluginCount = 0;

		// 通过插件链依次处理HTML内容
		const result = this.plugins.reduce((processedHtml, plugin) => {
			// 检查插件是否启用
			if (plugin.isEnabled()) {
				logger.debug(`应用插件: ${plugin.getName()}`);
				appliedPluginCount++;
				return plugin.process(processedHtml, settings);
			} else {
				logger.debug(`跳过禁用的插件: ${plugin.getName()}`);
				return processedHtml; // 如果插件禁用，直接返回原内容
			}
		}, html);

		logger.debug(`内容处理完成，实际应用了 ${appliedPluginCount} 个插件`);
		return result;
	}
}
