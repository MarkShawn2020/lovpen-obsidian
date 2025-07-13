import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";
import {logger} from "../../shared/src/logger";

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
		for (const [key, value] of this.cardData.entries()) {
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
			codeWrap: {
				type: "switch" as const,
				title: "代码换行"
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
			const doc = parser.parseFromString(html, "text/html");

			// 查找所有代码块
			const codeBlocks = doc.querySelectorAll("pre code");

			// 获取代码换行配置
			const enableCodeWrap = this.getCodeWrapConfig();

			codeBlocks.forEach((codeBlock) => {
				const pre = codeBlock.parentElement;
				if (!pre) return;

				// 为Obsidian内部渲染优化代码块
				this.optimizeCodeBlock(pre, codeBlock as HTMLElement, settings.lineNumber, enableCodeWrap);
			});

			return doc.body.innerHTML;
		} catch (error) {
			logger.error("处理代码块时出错:", error);
			return html;
		}
	}

	/**
	 * 获取代码换行配置
	 */
	private getCodeWrapConfig(): boolean {
		return this.getConfig().codeWrap as boolean ?? false;
	}

	/**
	 * 优化代码块显示
	 */
	private optimizeCodeBlock(pre: HTMLElement, codeElement: HTMLElement, showLineNumbers: boolean, enableWrap: boolean): void {
		// 应用基础样式
		this.applyBaseStyles(pre, codeElement);

		// 处理行号显示
		if (showLineNumbers) {
			this.addLineNumbers(codeElement);
		}

		// 处理语法高亮
		this.processHighlighting(codeElement);

		// 应用换行设置
		this.applyWrapSettings(pre, codeElement, enableWrap);

		// 添加数据属性
		this.addMetadata(pre, codeElement, enableWrap);
	}

	/**
	 * 应用基础样式
	 */
	private applyBaseStyles(pre: HTMLElement, codeElement: HTMLElement): void {
		// Pre元素样式
		pre.style.background = "var(--code-background)";
		pre.style.padding = "12px";
		pre.style.margin = "0";
		pre.style.fontSize = "14px";
		pre.style.lineHeight = "1.5";
		pre.style.color = "var(--code-normal)";
		pre.style.fontFamily = "var(--font-monospace)";
		pre.style.borderRadius = "4px";
		pre.style.border = "1px solid var(--background-modifier-border)";

		// Code元素样式
		codeElement.style.background = "transparent";
		codeElement.style.padding = "0";
		codeElement.style.margin = "0";
		codeElement.style.fontSize = "inherit";
		codeElement.style.lineHeight = "inherit";
		codeElement.style.color = "inherit";
		codeElement.style.fontFamily = "inherit";
	}

	/**
	 * 添加行号
	 */
	private addLineNumbers(codeElement: HTMLElement): void {
		let content = codeElement.innerHTML;

		// 清理首尾换行符
		content = content.replace(/^\n+/, '').replace(/\n+$/, '');

		const lines = content.split("\n");
		const numberedLines = lines.map((line, index) => {
			const lineNumber = index + 1;
			return `<span style="color: var(--text-faint); display: inline-block; width: 2.5em; text-align: right; padding-right: 1em; margin-right: 0.5em; border-right: 1px solid var(--background-modifier-border); user-select: none;">${lineNumber}</span>${line}`;
		}).join("\n");

		codeElement.innerHTML = numberedLines;
	}

	/**
	 * 处理语法高亮
	 */
	private processHighlighting(codeElement: HTMLElement): void {
		const hasHighlight = codeElement.classList.contains('hljs') ||
			codeElement.innerHTML.includes('<span class="hljs-') ||
			codeElement.innerHTML.includes('class="hljs-');

		if (hasHighlight) {
			this.convertHighlightClasses(codeElement);
			this.optimizeIndentation(codeElement);
		}
	}

	/**
	 * 应用换行设置
	 */
	private applyWrapSettings(pre: HTMLElement, codeElement: HTMLElement, enableWrap: boolean): void {
		const wrapStyles = enableWrap ? {
			whiteSpace: "pre-wrap",
			wordBreak: "break-all",
			overflowX: "visible",
			wordWrap: "break-word"
		} : {
			whiteSpace: "pre",
			wordBreak: "normal",
			overflowX: "auto",
			wordWrap: "normal",
			overflowWrap: "normal"
		};

		// 应用到pre和code元素
		Object.entries(wrapStyles).forEach(([prop, value]) => {
			pre.style.setProperty(prop, value);
			codeElement.style.setProperty(prop, value);
		});
	}

	/**
	 * 添加元数据属性
	 */
	private addMetadata(pre: HTMLElement, codeElement: HTMLElement, enableWrap: boolean): void {
		pre.setAttribute('data-code-block', 'true');
		pre.setAttribute('data-language', this.extractLanguage(codeElement));
		pre.setAttribute('data-wrap-enabled', enableWrap.toString());
	}

	/**
	 * 提取语言标识
	 */
	private extractLanguage(codeElement: HTMLElement): string {
		for (const className of codeElement.classList) {
			if (className.startsWith('language-')) {
				return className.replace('language-', '');
			}
		}
		return 'text';
	}

	/**
	 * 转换highlight.js类为微信原生类
	 */
	private convertHighlightClasses(codeElement: HTMLElement): void {
		const classMap: Record<string, string> = {
			'hljs-comment': 'code-snippet__comment',
			'hljs-quote': 'code-snippet__comment',
			'hljs-keyword': 'code-snippet__keyword',
			'hljs-selector-tag': 'code-snippet__keyword',
			'hljs-addition': 'code-snippet__addition',
			'hljs-number': 'code-snippet__number',
			'hljs-string': 'code-snippet__string',
			'hljs-meta': 'code-snippet__meta',
			'hljs-literal': 'code-snippet__literal',
			'hljs-doctag': 'code-snippet__doctag',
			'hljs-regexp': 'code-snippet__regexp',
			'hljs-title': 'code-snippet__title',
			'hljs-section': 'code-snippet__section',
			'hljs-name': 'code-snippet__name',
			'hljs-selector-id': 'code-snippet__selector-id',
			'hljs-selector-class': 'code-snippet__selector-class',
			'hljs-attribute': 'code-snippet__attribute',
			'hljs-attr': 'code-snippet__attr',
			'hljs-variable': 'code-snippet__variable',
			'hljs-template-variable': 'code-snippet__template-variable',
			'hljs-type': 'code-snippet__type',
			'hljs-symbol': 'code-snippet__symbol',
			'hljs-bullet': 'code-snippet__bullet',
			'hljs-built_in': 'code-snippet__built_in',
			'hljs-builtin-name': 'code-snippet__builtin-name',
			'hljs-link': 'code-snippet__link',
			'hljs-emphasis': 'code-snippet__emphasis',
			'hljs-strong': 'code-snippet__strong',
			'hljs-formula': 'code-snippet__formula',
			'hljs-punctuation': 'code-snippet__punctuation',
		};

		const highlightSpans = codeElement.querySelectorAll('[class*="hljs-"]');
		let convertedCount = 0;

		highlightSpans.forEach((span: Element) => {
			const htmlSpan = span as HTMLElement;
			const classes = htmlSpan.className.split(/\s+/);
			const newClasses: string[] = [];

			for (const className of classes) {
				if (className.startsWith('hljs-')) {
					const mappedClass = classMap[className];
					if (mappedClass) {
						newClasses.push(mappedClass);
						convertedCount++;
					}
				} else {
					newClasses.push(className);
				}
			}

			htmlSpan.className = newClasses.join(' ');
		});

		if (convertedCount > 0) {
			logger.debug(`转换了 ${convertedCount} 个高亮元素为微信原生类`);
		}
	}

	/**
	 * 优化缩进处理
	 */
	private optimizeIndentation(codeElement: HTMLElement): void {
		let html = codeElement.innerHTML;

		// 处理行首空格缩进
		html = html.replace(/^( {2,})/gm, (match) => '&nbsp;'.repeat(match.length));

		// 处理tab缩进
		html = html.replace(/^\t+/gm, (match) => '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(match.length));

		codeElement.innerHTML = html;
		logger.debug("已优化代码缩进处理");
	}
}