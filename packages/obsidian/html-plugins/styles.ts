import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";


import {logger} from "../../shared/src/logger";

/**
 * 微信样式适配插件 - 为微信公众号内容应用内联样式
 * 由于微信编辑器仅支持内联CSS，需要将关键样式内联到HTML元素上
 */
export class Styles extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "微信样式适配插件";
	}

	getPluginDescription(): string {
		return "将外部CSS转换为内联样式，确保微信公众号兼容性";
	}

	process(html: string, settings: NMPSettings): string {
		try {
			// 使用离线DOM解析，避免影响页面
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
			const tempDiv = doc.body.firstChild as HTMLElement;

			logger.debug("为微信内容进行样式处理（离线模式）");

			// 获取所有非样式元素
			const allElements = tempDiv.querySelectorAll("*:not(style)");
			logger.debug(`处理微信样式元素数量: ${allElements.length}`);

			// 如果没有计算样式可用，使用基础样式映射
			const basicStyleMap = this.getBasicStyleMap();

			// 应用样式到每个元素
			for (let i = 0; i < allElements.length; i++) {
				const el = allElements[i] as HTMLElement;
				const tagName = el.tagName.toLowerCase();
				let inlineStyles = "";

				// 获取基础样式
				if (basicStyleMap[tagName]) {
					inlineStyles += basicStyleMap[tagName];
				}

				// 处理特殊元素
				inlineStyles += this.getElementSpecificStyles(el);

				// 提取和处理现有样式属性
				const existingStyle = el.getAttribute("style") || "";
				const mergedStyles = this.mergeStyles(existingStyle, inlineStyles);
				
				if (mergedStyles) {
					el.setAttribute("style", mergedStyles);
				}
			}

			// 保留重要的style标签，只移除空的或无关的
			this.cleanupStyleTags(tempDiv);

			const result = tempDiv.innerHTML;
			logger.debug(`微信样式适配完成: ${result.substring(0, 100)}...`);
			return result;
		} catch (error) {
			logger.error("微信样式适配出错:", error);
			return html;
		}
	}

	/**
	 * 获取基础样式映射
	 */
	private getBasicStyleMap(): Record<string, string> {
		return {
			'h1': 'font-size: 24px; font-weight: bold; margin: 16px 0 8px 0; line-height: 1.4; display: block;',
			'h2': 'font-size: 20px; font-weight: bold; margin: 14px 0 6px 0; line-height: 1.4; display: block;',
			'h3': 'font-size: 18px; font-weight: bold; margin: 12px 0 4px 0; line-height: 1.4; display: block;',
			'h4': 'font-size: 16px; font-weight: bold; margin: 10px 0 4px 0; line-height: 1.4; display: block;',
			'h5': 'font-size: 14px; font-weight: bold; margin: 8px 0 2px 0; line-height: 1.4; display: block;',
			'h6': 'font-size: 12px; font-weight: bold; margin: 6px 0 2px 0; line-height: 1.4; display: block;',
			'p': 'margin: 8px 0; line-height: 1.6; display: block;',
			'img': 'max-width: 100%; height: auto; display: block; margin: 8px auto;',
			'a': 'color: #1e6bb8; text-decoration: none;',
			'code': 'font-family: Monaco, Consolas, monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px;',
			'pre': 'background-color: #f8f8f8; padding: 12px; border-radius: 6px; overflow-x: auto; display: block; margin: 12px 0;',
			'blockquote': 'border-left: 4px solid #ddd; padding-left: 16px; margin: 12px 0; color: #666; display: block;',
			'ul': 'margin: 12px 0; padding-left: 24px; display: block;',
			'ol': 'margin: 12px 0; padding-left: 24px; display: block;',
			'li': 'margin: 4px 0; line-height: 1.6; display: list-item;',
			'table': 'border-collapse: collapse; width: 100%; margin: 12px 0; display: table;',
			'th': 'border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: left; display: table-cell;',
			'td': 'border: 1px solid #ddd; padding: 8px; display: table-cell;',
		};
	}

	/**
	 * 获取元素特定样式
	 */
	private getElementSpecificStyles(el: HTMLElement): string {
		let styles = "";
		const tagName = el.tagName.toLowerCase();

		// 确保图片可见性
		if (tagName === 'img') {
			const src = el.getAttribute('src');
			if (src) {
				styles += 'visibility: visible; opacity: 1; ';
			}
		}

		// 确保标题可见性
		if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
			styles += 'visibility: visible; opacity: 1; ';
		}

		return styles;
	}

	/**
	 * 合并样式字符串
	 */
	private mergeStyles(existing: string, additional: string): string {
		if (!existing && !additional) return "";
		
		const existingStyles = this.parseStyleString(existing);
		const additionalStyles = this.parseStyleString(additional);
		
		// 合并样式，existing 优先级更高
		const merged = { ...additionalStyles, ...existingStyles };
		
		return Object.entries(merged)
			.map(([prop, value]) => `${prop}: ${value}`)
			.join('; ') + (Object.keys(merged).length > 0 ? ';' : '');
	}

	/**
	 * 解析样式字符串为对象
	 */
	private parseStyleString(styleStr: string): Record<string, string> {
		const styles: Record<string, string> = {};
		if (!styleStr) return styles;
		
		styleStr.split(';').forEach(rule => {
			const colonIndex = rule.indexOf(':');
			if (colonIndex > 0) {
				const prop = rule.substring(0, colonIndex).trim();
				const value = rule.substring(colonIndex + 1).trim();
				if (prop && value) {
					styles[prop] = value;
				}
			}
		});
		
		return styles;
	}

	/**
	 * 清理样式标签
	 */
	private cleanupStyleTags(container: HTMLElement): void {
		const styleElements = container.querySelectorAll('style');
		styleElements.forEach(styleEl => {
			const content = styleEl.textContent?.trim();
			// 只移除空的或者明确无用的样式标签
			if (!content || content.length < 10) {
				styleEl.remove();
			}
		});
	}
}
