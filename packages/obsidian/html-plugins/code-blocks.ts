import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";
import {logger} from "../../shared/src/logger";
import AssetsManager, {Highlight} from "../assets";

/**
 * 微信公众号卡片数据管理器
 */
export class CardDataManager {
	private static instance: CardDataManager;
	private cardData: Map<string, string>;

	private constructor() {
		this.cardData = new Map<string, string>();
	}

	public static getInstance(): CardDataManager {
		if (!CardDataManager.instance) {
			CardDataManager.instance = new CardDataManager();
		}
		return CardDataManager.instance;
	}

	public setCardData(id: string, cardData: string): void {
		this.cardData.set(id, cardData);
	}

	public cleanup(): void {
		this.cardData.clear();
	}

	public restoreCard(html: string): string {
		const entries = Array.from(this.cardData.entries());
		for (const [key, value] of entries) {
			const exp = `<section[^>]*\\\\sdata-id="${key}"[^>]*>(.*?)<\\\\/section>`;
			const regex = new RegExp(exp, "gs");
			if (!regex.test(html)) {
				logger.warn(`未能正确替换公众号卡片: ${key}`);
			}
			html = html.replace(regex, value);
		}
		return html;
	}
}

/**
 * 代码块处理插件 - 专注于Obsidian内部的代码块渲染优化
 */
export class CodeBlocks extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "代码块处理插件";
	}

	getPluginDescription(): string {
		return "优化代码块在Obsidian内部的显示效果，支持行号和语法高亮";
	}

	/**
	 * 获取插件配置的元数据
	 */
	getMetaConfig() {
		return {
			showLineNumbers: {
				type: "switch" as const,
				title: "显示行号"
			},
			highlightStyle: {
				type: "select" as const,
				title: "代码高亮样式",
				options: this.getHighlightOptions()
			}
		};
	}

	process(html: string, settings: NMPSettings): string {
		try {
			// 首先处理微信公众号卡片恢复
			html = CardDataManager.getInstance().restoreCard(html);

			// 如果启用了微信代码格式化，跳过此插件的其他处理
			if (settings.enableWeixinCodeFormat) {
				logger.debug("微信代码格式化已启用，跳过代码块处理插件");
				return html;
			}

			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 查找所有代码块
			const codeBlocks = container.querySelectorAll("pre code");

			// 获取插件配置
			const showLineNumbers = this.getShowLineNumbersConfig();
			const highlightStyle = this.getHighlightStyleConfig();

			codeBlocks.forEach((codeBlock) => {
				const pre = codeBlock.parentElement;
				if (!pre) return;

				// 渲染代码块
				this.renderCodeBlock(pre, codeBlock as HTMLElement, showLineNumbers, highlightStyle, settings);
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理代码块时出错:", error);
			return html;
		}
	}

	/**
	 * 获取高亮样式选项（从 highlights.json 动态读取）
	 */
	private getHighlightOptions() {
		const options = [
			{value: "none", text: "无高亮"}
		];

		// 从 AssetsManager 获取所有可用的高亮样式
		const assetsManager = this.getAssetsManager();
		if (!assetsManager || !assetsManager.highlights) {
			throw new Error("无法获取高亮样式配置，AssetsManager 不可用");
		}

		// 使用Set去重，避免重复的value导致React键重复警告
		const seenValues = new Set<string>();
		seenValues.add("none");

		assetsManager.highlights.forEach((highlight: Highlight) => {
			if (!seenValues.has(highlight.name)) {
				seenValues.add(highlight.name);
				options.push({
					value: highlight.name,
					text: this.formatHighlightName(highlight.name)
				});
			}
		});

		return options;
	}

	/**
	 * 格式化高亮样式名称显示
	 */
	private formatHighlightName(name: string): string {
		// 将 kebab-case 转换为更友好的显示名称
		return name
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	/**
	 * 获取 AssetsManager 实例
	 */
	private getAssetsManager(): AssetsManager | null {
		return AssetsManager.getInstance();
	}

	/**
	 * 获取行号显示配置
	 */
	private getShowLineNumbersConfig(): boolean {
		return this.getConfig().showLineNumbers as boolean ?? false;
	}

	/**
	 * 获取代码高亮样式配置
	 */
	private getHighlightStyleConfig(): string {
		return this.getConfig().highlightStyle as string ?? "默认";
	}

	/**
	 * 渲染代码块 - 单一函数处理所有渲染逻辑
	 *
	 * 转换步骤：
	 * 1. 提取代码内容和语言
	 * 2. 处理语法高亮
	 * 3. 添加行号（如果启用）
	 * 4. 应用样式
	 * 5. 设置元数据
	 */
	private renderCodeBlock(pre: HTMLElement, codeElement: HTMLElement, showLineNumbers: boolean, highlightStyle: string, settings: NMPSettings): void {
		// 步骤1: 提取代码内容和语言
		const codeContent = codeElement.textContent || codeElement.innerText || '';
		const language = this.extractLanguage(codeElement);

		// 步骤2: 处理语法高亮
		let processedContent = codeContent;
		if (highlightStyle !== "none") {
			// 保持现有的高亮HTML结构（如果存在）
			processedContent = codeElement.innerHTML;
			// 更新全局高亮样式设置并触发重新渲染
			this.updateGlobalHighlightStyle(highlightStyle, settings);
		} else {
			// 移除高亮，使用纯文本
			processedContent = codeContent;
		}

		// 步骤3: 添加行号（如果启用）
		if (showLineNumbers) {
			processedContent = this.addLineNumbersToHighlightedCode(processedContent);
		}

		// 步骤4: 应用样式
		this.applyCodeBlockStyles(pre, codeElement, showLineNumbers, highlightStyle);

		// 步骤5: 设置处理后的内容
		codeElement.innerHTML = processedContent;

		// 步骤6: 设置元数据
		this.setMetadata(pre, language, showLineNumbers, highlightStyle);

		logger.debug(`代码块渲染完成: 语言=${language}, 行号=${showLineNumbers}, 高亮=${highlightStyle}`);
	}

	/**
	 * 提取语言标识
	 */
	private extractLanguage(codeElement: HTMLElement): string {
		const classList = Array.from(codeElement.classList);
		for (const className of classList) {
			if (className.startsWith('language-')) {
				return className.replace('language-', '');
			}
		}
		return 'text';
	}

	/**
	 * 为已高亮的代码添加行号，保持highlight.js结构
	 */
	private addLineNumbersToHighlightedCode(content: string): string {
		// 清理首尾换行符
		content = content.replace(/^\n+/, '').replace(/\n+$/, '');

		const lines = content.split("\n");
		const numberedLines = lines.map((line, index) => {
			const lineNumber = index + 1;
			const lineNumberSpan = `<span class="line-number" style="color: var(--text-faint); display: inline-block; width: 2.5em; text-align: right; padding-right: 1em; margin-right: 0.5em; border-right: 1px solid var(--background-modifier-border); user-select: none;">${lineNumber}</span>`;
			return lineNumberSpan + line;
		}).join("\n");

		return numberedLines;
	}

	/**
	 * 应用代码块样式
	 */
	private applyCodeBlockStyles(pre: HTMLElement, codeElement: HTMLElement, showLineNumbers: boolean, highlightStyle: string): void {
		console.warn(`applyCodeBlockStyles: `, {highlightStyle});
		// Pre元素样式
		pre.style.background = "var(--code-background)";
		pre.style.padding = showLineNumbers ? "12px 12px 12px 12px" : "12px";
		pre.style.margin = "0";
		pre.style.fontSize = "14px";
		pre.style.lineHeight = "1.5";
		pre.style.color = "var(--code-normal)";
		pre.style.fontFamily = "var(--font-monospace)";
		pre.style.borderRadius = "4px";
		pre.style.border = "1px solid var(--background-modifier-border)";
		pre.style.whiteSpace = "pre";
		pre.style.overflowX = "auto";

		// Code元素样式
		codeElement.style.background = "transparent";
		codeElement.style.padding = "0";
		codeElement.style.margin = "0";
		codeElement.style.fontSize = "inherit";
		codeElement.style.lineHeight = "inherit";
		codeElement.style.color = "inherit";
		codeElement.style.fontFamily = "inherit";
		codeElement.style.whiteSpace = "pre";
		codeElement.style.overflowX = "auto";

		// 添加CSS类以支持更好的样式选择器
		if (highlightStyle !== "none") {
			// 确保highlight.js类存在
			if (!codeElement.classList.contains("hljs")) {
				codeElement.classList.add("hljs");
			}
			// 添加特定的高亮样式类
			codeElement.classList.add(`hljs-${highlightStyle}`);
		}
	}


	/**
	 * 更新全局高亮样式设置并触发重新渲染
	 */
	private updateGlobalHighlightStyle(highlightStyle: string, settings: NMPSettings): void {
		// 只有当插件配置的高亮样式与全局设置不同时才更新
		if (settings.defaultHighlight !== highlightStyle) {
			settings.defaultHighlight = highlightStyle;
			logger.debug(`已更新全局高亮样式为: ${highlightStyle}`);

			// 触发设置保存，确保React组件能够重新渲染
			this.triggerSettingsUpdate(settings);
		}
	}

	/**
	 * 触发设置更新，确保React组件重新渲染
	 */
	private triggerSettingsUpdate(settings: NMPSettings): void {
		try {
			// 获取主插件实例并触发设置保存
			const app = (window as any).app;
			if (app && app.plugins && app.plugins.plugins) {
				const plugin = app.plugins.plugins["lovpen"];
				if (plugin && typeof plugin.saveSettings === "function") {
					plugin.saveSettings();
					logger.debug("已触发插件设置保存，将重新渲染React组件");
				}
			}
		} catch (error) {
			logger.error("触发设置更新失败:", error);
		}
	}

	/**
	 * 设置元数据属性
	 */
	private setMetadata(pre: HTMLElement, language: string, showLineNumbers: boolean, highlightStyle: string): void {
		pre.setAttribute('data-code-block', 'true');
		pre.setAttribute('data-language', language);
		pre.setAttribute('data-show-line-numbers', showLineNumbers.toString());
		pre.setAttribute('data-highlight-style', highlightStyle);
	}

}
