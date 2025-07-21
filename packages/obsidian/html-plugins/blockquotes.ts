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

			// 获取主题色
			const themeColor = this.getThemeColor(settings);

			// 获取所有引用块
			const blockquotes = container.querySelectorAll("blockquote");
			if (blockquotes.length === 0) {
				return html; // 没有引用块，直接返回
			}

			// 逻辑处理每个引用块
			blockquotes.forEach((blockquote) => {
				// 重新设置引用块的样式，强制覆盖微信默认样式
				blockquote.setAttribute("style", `
                    padding-left: 10px !important; 
                    border-left: 3px solid ${themeColor} !important; 
                    color: rgba(0, 0, 0, 0.6) !important; 
                    font-size: 15px !important; 
                    padding-top: 4px !important; 
                    margin: 1em 0 !important; 
                    text-indent: 0 !important;
                `);

				// 处理引用块内的段落
				const paragraphs = blockquote.querySelectorAll("p");
				paragraphs.forEach((p) => {
					// 确保段落的文本颜色与引用块一致
					p.style.color = "rgba(0, 0, 0, 0.6)";
					p.style.margin = "0";
				});
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理引用块时出错:", error);
			return html;
		}
	}
}
