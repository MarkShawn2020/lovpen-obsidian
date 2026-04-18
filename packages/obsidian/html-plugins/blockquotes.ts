import {NMPSettings} from "../settings";


import {logger} from "../../shared/src/logger";

import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/plugin/html-plugin";

/**
 * 引用块处理插件 - 处理微信公众号中的引用块格式
 * 微信公众号编辑器对blockquote有固定样式，需要强制设置样式以覆盖
 */
export class Blockquotes extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "引用块处理插件";
	}

	getPluginDescription(): string {
		return "处理微信公众号中的引用块格式，强制设置样式以覆盖微信编辑器的默认样式";
	}

	process(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			const themeColor = this.getThemeColor(settings);

			const blockquotes = container.querySelectorAll("blockquote");
			if (blockquotes.length === 0) {
				return html;
			}

			// 根据当前主题确定引用块样式
			const styles = this.getBlockquoteStyles(settings, themeColor);

			blockquotes.forEach((blockquote) => {
				if (blockquote.parentElement?.getAttribute('data-component') === 'admonition') {
					return;
				}

				blockquote.setAttribute("style", styles.blockquote);

				const paragraphs = blockquote.querySelectorAll("p");
				paragraphs.forEach((p) => {
					p.style.color = styles.textColor;
					p.style.margin = "0";
				});
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理引用块时出错:", error);
			return html;
		}
	}

	private getBlockquoteStyles(settings: NMPSettings, themeColor: string): {
		blockquote: string;
		textColor: string;
	} {
		const theme = settings.defaultStyle;

		// 各主题的引用块样式配置
		switch (theme) {
			case 'typora-newsprint':
				return {
					blockquote: `
						font-style: italic !important;
						border-left: 5px solid #bababa !important;
						margin-left: 2em !important;
						margin-bottom: 1.5em !important;
						padding-left: 1em !important;
						color: #656565 !important;
						text-indent: 0 !important;
					`,
					textColor: '#656565'
				};

			case 'wabi-sabi':
				return {
					blockquote: `
						padding: 8px 10px !important;
						border-left: 3px solid ${themeColor} !important;
						color: rgb(102, 102, 102) !important;
						font-size: 15px !important;
						margin: 1em 0 !important;
						text-indent: 0 !important;
						border-radius: 4px !important;
					`,
					textColor: 'rgb(102, 102, 102)'
				};

			default:
				// 默认样式（兼容 Anthropic 等主题）
				return {
					blockquote: `
						padding: 8px 10px !important;
						border-left: 3px solid ${themeColor} !important;
						color: rgb(102, 102, 102) !important;
						font-size: 15px !important;
						margin: 1em 0 !important;
						text-indent: 0 !important;
						background: rgba(200, 100, 66, 0.03) !important;
						border-radius: 4px !important;
					`,
					textColor: 'rgb(102, 102, 102)'
				};
		}
	}
}
