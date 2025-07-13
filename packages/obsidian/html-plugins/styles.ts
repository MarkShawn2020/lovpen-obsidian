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
				const existingStyle = el.getAttribute("style") || "";

				// 只添加微信必需的样式，保持原有样式
				let additionalStyles = "";

				// 确保关键元素可见性（微信必需）
				additionalStyles += this.getWechatEssentialStyles(el);

				// 只有在现有样式不足时才添加基础样式
				additionalStyles += this.getMinimalRequiredStyles(el, existingStyle);

				// 合并样式，优先保持现有样式
				const mergedStyles = this.mergeStyles(existingStyle, additionalStyles);
				
				if (mergedStyles && mergedStyles !== existingStyle) {
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
	 * 获取基础样式映射（仅作为后备）
	 */
	private getBasicStyleMap(): Record<string, string> {
		return {
			'h1': 'font-weight: bold;',
			'h2': 'font-weight: bold;',
			'h3': 'font-weight: bold;',
			'h4': 'font-weight: bold;',
			'h5': 'font-weight: bold;',
			'h6': 'font-weight: bold;',
			'img': 'max-width: 100%; height: auto;',
			'code': 'font-family: monospace;',
			'pre': 'font-family: monospace;',
			'table': 'border-collapse: collapse;',
		};
	}

	/**
	 * 获取微信必需的样式（仅关键属性）
	 */
	private getWechatEssentialStyles(el: HTMLElement): string {
		let styles = "";
		const tagName = el.tagName.toLowerCase();

		// 确保图片可见性和基本布局
		if (tagName === 'img') {
			const src = el.getAttribute('src');
			if (src) {
				styles += 'visibility: visible; opacity: 1; max-width: 100%; height: auto; ';
			}
		}

		// 确保标题可见性但不强制布局
		if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
			styles += 'visibility: visible; opacity: 1; ';
		}

		return styles;
	}

	/**
	 * 获取最小必需样式（仅在缺失时添加）
	 */
	private getMinimalRequiredStyles(el: HTMLElement, existingStyle: string): string {
		const tagName = el.tagName.toLowerCase();
		const basicStyles = this.getBasicStyleMap();
		let styles = "";

		// 只有在现有样式中没有对应属性时才添加
		if (basicStyles[tagName]) {
			const basicStyleObj = this.parseStyleString(basicStyles[tagName]);
			const existingStyleObj = this.parseStyleString(existingStyle);

			for (const [prop, value] of Object.entries(basicStyleObj)) {
				// 只有在现有样式中没有这个属性时才添加
				if (!existingStyleObj[prop]) {
					styles += `${prop}: ${value}; `;
				}
			}
		}

		return styles;
	}

	/**
	 * 合并样式字符串（保持原有样式优先级）
	 */
	private mergeStyles(existing: string, additional: string): string {
		if (!existing && !additional) return "";
		if (!additional) return existing;
		if (!existing) return additional;
		
		const existingStyles = this.parseStyleString(existing);
		const additionalStyles = this.parseStyleString(additional);
		
		// 合并样式，existing 优先级更高，只添加缺失的样式
		const merged = { ...additionalStyles, ...existingStyles };
		
		const result = Object.entries(merged)
			.map(([prop, value]) => `${prop}: ${value}`)
			.join('; ');
		
		return result ? result + ';' : '';
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
