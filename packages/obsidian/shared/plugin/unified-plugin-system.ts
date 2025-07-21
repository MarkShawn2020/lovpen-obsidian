import {NMPSettings} from "../../settings";
import {BasePluginManager} from "./base-plugin-manager";
import {PluginConfigManager, UniversalPluginConfig, UniversalPluginMetaConfig} from "./plugin-config-manager";

import {logger} from "@lovpen/shared/src/logger";
import postcss from 'postcss'
// @ts-ignore - postcss-custom-properties doesn't have TypeScript declarations
import postcssCustomProperties from 'postcss-custom-properties'
import {IHtmlPlugin, IMarkdownPlugin, IUnifiedPlugin, PluginMetadata, PluginType} from "./types";

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
		console.log("🔌 [插件管理器] 开始处理内容", {
			inputLength: html.length,
			inputPreview: html.substring(0, 200) + '...',
		});
		logger.debug("[processContent]", settings);

		const htmlPlugins = this.getHtmlPlugins();
		console.log("🔌 [插件管理器] 获取HTML插件列表", {
			totalCount: htmlPlugins.length,
			pluginNames: htmlPlugins.map(p => p.getName())
		});
		logger.debug(`开始处理内容，共有 ${htmlPlugins.length} 个HTML插件`);

		// CSS预处理: 在微信模式下，使用PostCSS处理CSS变量
		// 这必须在所有HTML插件处理之前执行，因为其他插件可能生成包含CSS变量的样式
		// 检查是否启用了微信代码格式化（表示微信模式）或有微信配置信息
		const isWechatMode = settings.enableWeixinCodeFormat ||
			(settings.wxInfo && settings.wxInfo.length > 0) ||
			(settings as any).platform === 'wechat' ||
			(settings as any).wechatModeEnabled ||
			// 检查是否启用了微信公众号适配插件
			this.getHtmlPlugins().some(plugin =>
				plugin.getName() === "微信公众号适配插件" && plugin.isEnabled()
			);

		console.log("🔍 [插件管理器] 微信模式检测", {
			enableWeixinCodeFormat: settings.enableWeixinCodeFormat,
			hasWxInfo: settings.wxInfo && settings.wxInfo.length > 0,
			platform: (settings as any).platform,
			wechatModeEnabled: (settings as any).wechatModeEnabled,
			hasWechatPlugin: this.getHtmlPlugins().some(plugin =>
				plugin.getName() === "微信公众号适配插件" && plugin.isEnabled()
			),
			isWechatMode
		});

		if (isWechatMode) {
			console.log("🎨 [插件管理器] 检测到微信模式，开始CSS预处理");

			// 1. 注入代码高亮CSS（必须在CSS变量处理之前）
			html = this.injectHighlightCSS(html, settings);
			console.log("✅ [插件管理器] Highlight CSS注入完成", {
				length: html.length
			});

			// 2. 处理CSS变量
			html = this.resolveCSSVariables(html);
			console.log("✅ [插件管理器] CSS预处理完成", {
				length: html.length,
				hasStyleTags: html.includes('<style')
			});
		}

		let appliedPluginCount = 0;

		let result = htmlPlugins.reduce((processedHtml, plugin, index) => {
			if (plugin.isEnabled()) {
				console.log(`🔧 [插件管理器] 应用插件 ${index + 1}/${htmlPlugins.length}: ${plugin.getName()}`, {
					beforeLength: processedHtml.length,
					beforeHasParagraphs: processedHtml.includes('<p')
				});

				logger.debug(`应用HTML插件: ${plugin.getName()}`);
				appliedPluginCount++;

				const pluginResult = plugin.process(processedHtml, settings);

				console.log(`✅ [插件管理器] 插件 ${plugin.getName()} 处理完成`, {
					afterLength: pluginResult.length,
					changed: pluginResult !== processedHtml,
					lengthDiff: pluginResult.length - processedHtml.length
				});

				return pluginResult;
			} else {
				console.log(`⏭️ [插件管理器] 跳过禁用插件: ${plugin.getName()}`);
				logger.debug(`跳过禁用的HTML插件: ${plugin.getName()}`);
				return processedHtml;
			}
		}, html);

		// CSS后处理: 在微信模式下，处理插件生成的内联样式中的CSS变量
		// 这必须在所有HTML插件处理之后执行，因为插件可能生成包含CSS变量的内联样式
		if (isWechatMode) {
			console.log("🎨 [插件管理器] 开始CSS后处理（内联样式）");
			result = this.resolveInlineStyleVariables(result);
			console.log("✅ [插件管理器] CSS后处理完成", {
				length: result.length,
				hasInlineVars: result.includes('var(')
			});
		}

		console.log("✅ [插件管理器] 所有插件处理完成", {
			appliedPluginCount,
			finalLength: result.length,
			totalChanged: result !== html,
			finalPreview: result.substring(0, 300) + '...'
		});

		logger.debug(`内容处理完成，实际应用了 ${appliedPluginCount} 个HTML插件`);
		return result;
	}

	protected getManagerName(): string {
		return "统一插件";
	}

	/**
	 * 使用PostCSS处理CSS变量，将var()函数替换为实际值
	 * 仅在微信模式下运行，作为所有插件处理前的预处理步骤
	 */
	private resolveCSSVariables(html: string): string {
		try {
			logger.debug("开始PostCSS处理CSS变量（插件系统预处理）");

			// 直接解析HTML，不额外包装
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			// 查找所有style标签（可能在任何层级）
			const styleElements = doc.querySelectorAll('style');

			if (styleElements.length === 0) {
				logger.debug("没有找到style标签，跳过CSS变量处理");
				return html;
			}

			// 配置PostCSS处理器
			const processor = postcss([
				postcssCustomProperties({
					preserve: false, // 不保留原始的CSS变量
					enableCustomPropertySets: false, // 禁用自定义属性集
					warnings: false // 禁用警告
				})
			]);

			// 处理每个style标签
			styleElements.forEach(styleElement => {
				const cssText = styleElement.textContent || '';
				if (cssText.trim()) {
					try {
						// 使用PostCSS处理CSS变量
						const result = processor.process(cssText, {from: undefined});
						styleElement.textContent = result.css;
						logger.debug(`已处理CSS变量，原始长度: ${cssText.length}, 处理后长度: ${result.css.length}`);
					} catch (cssError) {
						logger.warn(`PostCSS处理CSS变量时出错，保留原始CSS:`, cssError);
						// 如果处理失败，保留原始CSS
					}
				}
			});

			logger.debug("PostCSS CSS变量处理完成");
			// 返回body中的内容（保持原有HTML结构）
			return doc.body.innerHTML;

		} catch (error) {
			logger.error("处理CSS变量时出错:", error);
			return html; // 如果处理失败，返回原始HTML
		}
	}

	/**
	 * 处理内联样式中的CSS变量，将var()函数替换为实际值
	 * 处理元素的style属性中的CSS变量（PostCSS后处理步骤）
	 */
	private resolveInlineStyleVariables(html: string): string {
		try {
			logger.debug("开始PostCSS处理内联样式CSS变量（插件系统后处理）");

			// 直接解析HTML，不额外包装
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			// 查找所有包含CSS变量的style属性（可能在任何层级）
			const elementsWithVars = doc.querySelectorAll('[style*="var("]');

			if (elementsWithVars.length === 0) {
				logger.debug("没有找到包含CSS变量的内联样式，跳过处理");
				return html;
			}

			// 配置PostCSS处理器（与前处理使用相同配置）
			const processor = postcss([
				postcssCustomProperties({
					preserve: false, // 不保留原始的CSS变量
					enableCustomPropertySets: false, // 禁用自定义属性集
					warnings: false // 禁用警告
				})
			]);

			// 处理每个包含CSS变量的元素
			elementsWithVars.forEach(element => {
				const htmlElement = element as HTMLElement;
				const styleAttribute = htmlElement.getAttribute('style');

				if (styleAttribute && styleAttribute.includes('var(')) {
					try {
						// 将内联样式包装成CSS规则进行处理
						const cssRule = `.temp { ${styleAttribute} }`;
						const result = processor.process(cssRule, {from: undefined});

						// 提取处理后的样式声明（移除.temp包装）
						const processedCSS = result.css
							.replace(/\.temp\s*\{\s*/, '')  // 移除开头的.temp {
							.replace(/\s*\}\s*$/, '')       // 移除结尾的}
							.trim();

						htmlElement.setAttribute('style', processedCSS);
						logger.debug(`已处理内联样式CSS变量，原始长度: ${styleAttribute.length}, 处理后长度: ${processedCSS.length}`);
					} catch (cssError) {
						logger.warn(`PostCSS处理内联样式CSS变量时出错，保留原始样式:`, cssError);
						// 如果处理失败，保留原始样式
					}
				}
			});

			logger.debug(`PostCSS内联样式CSS变量处理完成，处理了 ${elementsWithVars.length} 个元素`);
			// 返回body中的内容（保持原有HTML结构）
			return doc.body.innerHTML;

		} catch (error) {
			logger.error("处理内联样式CSS变量时出错:", error);
			return html; // 如果处理失败，返回原始HTML
		}
	}

	/**
	 * 注入代码高亮CSS到HTML中（微信模式专用）
	 */
	private injectHighlightCSS(html: string, settings: NMPSettings): string {
		try {
			// 获取当前代码高亮样式
			const assetsManager = (global as any).AssetsManager?.getInstance?.() ||
				(window as any).AssetsManager?.getInstance?.();

			if (!assetsManager) {
				logger.warn("无法获取AssetsManager实例，跳过highlight CSS注入");
				return html;
			}

			const highlightStyle = settings.defaultHighlight || '默认';
			const highlight = assetsManager.getHighlight(highlightStyle);

			if (!highlight || !highlight.css) {
				logger.warn(`无法获取highlight CSS: ${highlightStyle}`);
				return html;
			}

			// 检查是否已经包含highlight CSS
			if (html.includes(`data-highlight-style="${highlightStyle}"`)) {
				logger.debug("HTML中已包含highlight CSS，跳过注入");
				return html;
			}

			// 创建包含highlight CSS的style标签
			const styleTag = `<style type="text/css" data-highlight-style="${highlightStyle}">
${highlight.css}
</style>`;

			// 将style标签插入到HTML开头
			const wrappedHtml = html.startsWith('<div') ?
				html.replace(/^<div/, `${styleTag}<div`) :
				`${styleTag}${html}`;

			logger.debug(`已注入highlight CSS: ${highlightStyle}，CSS长度: ${highlight.css.length}`);
			return wrappedHtml;

		} catch (error) {
			logger.error("注入highlight CSS时出错:", error);
			return html;
		}
	}
}
