import {UnifiedPluginManager} from "./unified-plugin-system";

import {CalloutRenderer} from "../../markdown-plugins/callouts";
import {LocalFile} from "../../markdown-plugins/local-file";
import {CodeHighlight} from "../../markdown-plugins/code-highlight";
import {EmbedBlockMark} from "../../markdown-plugins/embed-block-mark";
import {SVGIcon} from "../../markdown-plugins/icons";
import {LinkRenderer} from "../../markdown-plugins/link";
import {FootnoteRenderer} from "../../markdown-plugins/footnote";
import {TextHighlight} from "../../markdown-plugins/text-highlight";
import {CodeRenderer} from "../../markdown-plugins/code";
import {MathRenderer} from "../../markdown-plugins/math";

import {Images} from "../../html-plugins/images";
import {Blockquotes} from "../../html-plugins/blockquotes";
import {CodeBlocks} from "../../html-plugins/code-blocks";
import {Headings} from "../../html-plugins/headings";
import {Lists} from "../../html-plugins/lists";
import {Tables} from "../../html-plugins/tables";
import {WechatAdapterPlugin} from "../../html-plugins/wechat-adapter";


import {NMPSettings} from "../../settings";
import {App} from "obsidian";
import AssetsManager from "../../assets";

import {logger} from "@lovpen/shared/src/logger";

/**
 * 插件注册器 - 统一管理所有插件的注册
 */
export class PluginRegistry {
	private static instance: PluginRegistry;
	private pluginManager: UnifiedPluginManager;

	private constructor() {
		this.pluginManager = UnifiedPluginManager.getInstance();
	}

	public static getInstance(): PluginRegistry {
		if (!PluginRegistry.instance) {
			PluginRegistry.instance = new PluginRegistry();
		}
		return PluginRegistry.instance;
	}

	/**
	 * 注册所有HTML插件（HTML后处理）
	 */
	public registerHtmlPlugins(): void {
		logger.info("正在注册HTML插件...");

		const htmlPlugins = [
			new Images(),
			new Blockquotes(false),
			new CodeBlocks(),
			new Headings(),
			new Lists(),
			new Tables(),
			new WechatAdapterPlugin(),  // 微信适配插件应该最后执行，整合所有微信相关处理
		];

		this.pluginManager.registerPlugins(htmlPlugins as any);
		logger.info(`HTML插件注册完成，共注册了 ${htmlPlugins.length} 个插件`);
	}

	/**
	 * 注册所有Markdown插件（Markdown解析扩展）
	 */
	public registerMarkdownPlugins(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: any): void {
		logger.info("正在注册Markdown插件...");

		const markdownPlugins = [
			new CalloutRenderer(app, settings, assetsManager, callback),
			new LocalFile(app, settings, assetsManager, callback),
			new CodeHighlight(app, settings, assetsManager, callback),
			new EmbedBlockMark(app, settings, assetsManager, callback),
			new SVGIcon(app, settings, assetsManager, callback),
			new LinkRenderer(app, settings, assetsManager, callback),
			new FootnoteRenderer(app, settings, assetsManager, callback),
			new TextHighlight(app, settings, assetsManager, callback),
			new CodeRenderer(app, settings, assetsManager, callback),
		];

		// 只有在有效授权key时才添加MathRenderer
		if (settings.isAuthKeyVaild()) {
			markdownPlugins.push(new MathRenderer(app, settings, assetsManager, callback));
		}

		this.pluginManager.registerPlugins(markdownPlugins as any);
		logger.info(`Markdown插件注册完成，共注册了 ${markdownPlugins.length} 个插件`);
	}

	/**
	 * 注册所有插件
	 */
	public registerAllPlugins(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: any): void {
		logger.info("开始注册所有插件...");

		// 先注册不需要额外参数的HTML插件（HTML后处理）
		this.registerHtmlPlugins();

		// 再注册需要额外参数的Markdown插件（Markdown解析扩展）
		this.registerMarkdownPlugins(app, settings, assetsManager, callback);

		const totalPlugins = this.pluginManager.getPlugins().length;
		const htmlCount = this.pluginManager.getHtmlPlugins().length;
		const markdownCount = this.pluginManager.getMarkdownPlugins().length;

		logger.info(`所有插件注册完成！总计：${totalPlugins}个，其中 HTML：${htmlCount}个，Markdown：${markdownCount}个`);
	}

	/**
	 * 获取插件管理器
	 */
	public getPluginManager(): UnifiedPluginManager {
		return this.pluginManager;
	}
}

/**
 * 初始化插件系统的便捷函数
 */
let isInitialized = false;

export function initializePluginSystem(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: any): UnifiedPluginManager {
	const registry = PluginRegistry.getInstance();

	if (!isInitialized) {
		registry.registerAllPlugins(app, settings, assetsManager, callback);
		isInitialized = true;
		logger.debug("插件系统初始化完成");
	} else {
		logger.debug("插件系统已初始化，跳过重复初始化");
	}

	return registry.getPluginManager();
}
