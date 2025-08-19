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
				// 检查是否是 admonition 组件（由 callouts.ts 处理）
				if (blockquote.parentElement?.hasAttribute('data-component') && 
					blockquote.parentElement?.getAttribute('data-component') === 'admonition') {
					return; // 跳过 admonition 组件，它们由 callouts.ts 处理
				}

				// 重新设置引用块的样式，使用固定颜色确保一致性
				blockquote.setAttribute("style", `
                    padding-left: 10px !important; 
                    border-left: 3px solid ${themeColor} !important; 
                    color: rgb(102, 102, 102) !important; 
                    font-size: 15px !important; 
                    padding-top: 4px !important; 
                    margin: 1em 0 !important; 
                    text-indent: 0 !important;
                    background: rgba(200, 100, 66, 0.03) !important;
                    border-radius: 4px !important;
                    padding: 8px 10px !important;
                `);

				// 处理引用块内的段落 - 使用固定的深灰色
				const paragraphs = blockquote.querySelectorAll("p");
				paragraphs.forEach((p) => {
					// 使用固定的深灰色，确保在浅色背景上可读
					p.style.color = "rgb(102, 102, 102)";
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
