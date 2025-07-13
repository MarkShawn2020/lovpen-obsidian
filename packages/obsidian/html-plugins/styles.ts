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

			// 提取所有style标签中的CSS内容
			const styleElements = tempDiv.querySelectorAll('style');
			let combinedCSS = '';
			
			styleElements.forEach(styleEl => {
				const cssContent = styleEl.textContent || '';
				combinedCSS += cssContent + '\n';
			});

			// 解析CSS并提取变量
			const cssVariables = this.extractCSSVariables(combinedCSS);
			const cssRules = this.parseCSSRules(combinedCSS, cssVariables);

			// 获取所有非样式元素
			const allElements = tempDiv.querySelectorAll("*:not(style)");
			logger.debug(`处理微信样式元素数量: ${allElements.length}`);

			// 应用样式到每个元素
			for (let i = 0; i < allElements.length; i++) {
				const el = allElements[i] as HTMLElement;
				this.applyInlineStyles(el, cssRules, cssVariables);
			}

			// 移除所有style标签，因为微信不支持
			styleElements.forEach(styleEl => styleEl.remove());

			const result = tempDiv.innerHTML;
			logger.debug(`微信样式适配完成: ${result.substring(0, 100)}...`);
			return result;
		} catch (error) {
			logger.error("微信样式适配出错:", error);
			return html;
		}
	}

	/**
	 * 提取CSS变量
	 */
	private extractCSSVariables(css: string): Record<string, string> {
		const variables: Record<string, string> = {};
		
		// 提取:root中的CSS变量
		const rootRuleRegex = /:root\s*\{([^}]+)\}/g;
		let match;
		
		while ((match = rootRuleRegex.exec(css)) !== null) {
			const declarations = match[1];
			const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
			let varMatch;
			
			while ((varMatch = varRegex.exec(declarations)) !== null) {
				const varName = varMatch[1];
				const varValue = varMatch[2].trim();
				variables[varName] = varValue;
			}
		}

		// 添加Claude Style主题的默认变量
		const defaultVariables = {
			'primary-color': 'rgb(200, 100, 66)',
			'primary-color-hover': 'rgb(180, 85, 50)',
			'primary-color-light': 'rgba(200, 100, 66, 0.1)',
			'background-primary': 'rgb(250, 249, 245)',
			'background-secondary': 'rgb(255, 255, 255)',
			'background-tertiary': 'rgb(245, 245, 245)',
			'text-primary': 'rgb(34, 34, 34)',
			'text-secondary': 'rgb(63, 63, 63)',
			'text-tertiary': 'rgb(136, 136, 136)',
			'text-on-primary': 'rgb(255, 255, 255)',
			'border-color': 'rgb(229, 229, 229)',
			'font-family': '"PingFang SC", -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif',
			'font-size-base': '15px',
			'font-size-h1': '1.6em',
			'font-size-h2': '1.3em',
			'font-size-h3': '1.2em',
			'font-size-h4': '1.1em',
			'line-height-base': '1.75',
			'line-height-heading': '1.2',
			'spacing-xs': '0.25em',
			'spacing-sm': '0.5em',
			'spacing-md': '1em',
			'spacing-lg': '1.5em',
			'spacing-xl': '2em',
			'spacing-xxl': '4em',
			'border-radius-sm': '6px',
			'border-radius-md': '8px',
			'border-radius-lg': '12px'
		};

		// 合并默认变量和提取的变量
		return { ...defaultVariables, ...variables };
	}

	/**
	 * 解析CSS规则
	 */
	private parseCSSRules(css: string, variables: Record<string, string>): Array<{ selector: string; styles: Record<string, string> }> {
		const rules: Array<{ selector: string; styles: Record<string, string> }> = [];
		
		// 替换CSS变量
		let processedCSS = css;
		Object.entries(variables).forEach(([varName, varValue]) => {
			const varRegex = new RegExp(`var\\(--${varName}\\)`, 'g');
			processedCSS = processedCSS.replace(varRegex, varValue);
		});

		// 简单的CSS规则解析（处理基本选择器）
		const ruleRegex = /([^{]+)\{([^}]+)\}/g;
		let match;

		while ((match = ruleRegex.exec(processedCSS)) !== null) {
			const selectorText = match[1].trim();
			const declarationsText = match[2];
			
			// 跳过@规则和:root
			if (selectorText.startsWith('@') || selectorText === ':root') {
				continue;
			}

			const styles: Record<string, string> = {};
			const declarations = declarationsText.split(';');
			
			declarations.forEach(decl => {
				const colonIndex = decl.indexOf(':');
				if (colonIndex > 0) {
					const prop = decl.substring(0, colonIndex).trim();
					const value = decl.substring(colonIndex + 1).trim();
					if (prop && value) {
						styles[prop] = value;
					}
				}
			});

			if (Object.keys(styles).length > 0) {
				rules.push({ selector: selectorText, styles });
			}
		}

		return rules;
	}

	/**
	 * 应用内联样式到元素
	 */
	private applyInlineStyles(
		element: HTMLElement, 
		cssRules: Array<{ selector: string; styles: Record<string, string> }>,
		variables: Record<string, string>
	): void {
		const tagName = element.tagName.toLowerCase();
		const className = element.className;
		const id = element.id;
		
		// 收集匹配的样式
		const matchedStyles: Record<string, string> = {};

		// 应用通用样式
		cssRules.forEach(rule => {
			if (this.elementMatchesSelector(element, rule.selector)) {
				Object.assign(matchedStyles, rule.styles);
			}
		});

		// 添加元素特定的基础样式
		const elementStyles = this.getElementSpecificStyles(element, variables);
		Object.assign(matchedStyles, elementStyles);

		// 合并现有的内联样式
		const existingStyle = element.getAttribute('style') || '';
		const existingStyles = this.parseStyleString(existingStyle);
		
		// 现有样式优先级更高
		const finalStyles = { ...matchedStyles, ...existingStyles };

		// 应用最终样式
		const styleString = Object.entries(finalStyles)
			.map(([prop, value]) => `${prop}: ${value}`)
			.join('; ');

		if (styleString) {
			element.setAttribute('style', styleString + ';');
		}
	}

	/**
	 * 检查元素是否匹配选择器
	 */
	private elementMatchesSelector(element: HTMLElement, selector: string): boolean {
		try {
			// 处理常见的选择器类型
			const trimmedSelector = selector.trim();
			
			// 标签选择器
			if (/^[a-zA-Z]+[0-9]*$/.test(trimmedSelector)) {
				return element.tagName.toLowerCase() === trimmedSelector.toLowerCase();
			}
			
			// 类选择器
			if (trimmedSelector.startsWith('.')) {
				const className = trimmedSelector.substring(1);
				return element.classList.contains(className);
			}
			
			// ID选择器
			if (trimmedSelector.startsWith('#')) {
				const idName = trimmedSelector.substring(1);
				return element.id === idName;
			}
			
			// 复合选择器（简单处理）
			if (trimmedSelector.includes(' ')) {
				// 对于复合选择器，暂时只处理简单的后代选择器
				const parts = trimmedSelector.split(' ').filter(p => p.trim());
				if (parts.length === 2) {
					const parentSelector = parts[0].trim();
					const childSelector = parts[1].trim();
					
					// 检查当前元素是否匹配子选择器
					if (this.elementMatchesSelector(element, childSelector)) {
						// 检查是否有匹配的父元素
						let parent = element.parentElement;
						while (parent) {
							if (this.elementMatchesSelector(parent, parentSelector)) {
								return true;
							}
							parent = parent.parentElement;
						}
					}
				}
				return false;
			}
			
			// 尝试使用原生matches方法
			return element.matches(trimmedSelector);
		} catch (e) {
			// 如果选择器无效，返回false
			return false;
		}
	}

	/**
	 * 获取元素特定的样式
	 */
	private getElementSpecificStyles(element: HTMLElement, variables: Record<string, string>): Record<string, string> {
		const tagName = element.tagName.toLowerCase();
		const styles: Record<string, string> = {};

		// Claude Style主题的特定样式
		switch (tagName) {
			case 'h1':
				styles['font-size'] = variables['font-size-h1'];
				styles['font-weight'] = 'bold';
				styles['text-align'] = 'center';
				styles['margin'] = `${variables['spacing-xxl']} auto ${variables['spacing-xl']}`;
				styles['display'] = 'table';
				styles['padding'] = `${variables['spacing-sm']} ${variables['spacing-md']}`;
				styles['background'] = variables['primary-color'];
				styles['color'] = variables['text-on-primary'] + ' !important';
				styles['border-radius'] = variables['border-radius-md'];
				styles['box-shadow'] = 'rgba(0, 0, 0, 0.1) 0px 4px 8px';
				break;
			
			case 'h2':
				styles['font-size'] = variables['font-size-h2'];
				styles['font-weight'] = 'bold';
				styles['text-align'] = 'center';
				styles['margin'] = `${variables['spacing-xxl']} auto ${variables['spacing-xl']}`;
				styles['display'] = 'table';
				styles['padding'] = `${variables['spacing-sm']} ${variables['spacing-md']}`;
				styles['background'] = variables['primary-color'];
				styles['color'] = variables['text-on-primary'] + ' !important';
				styles['border-radius'] = variables['border-radius-md'];
				styles['box-shadow'] = 'rgba(0, 0, 0, 0.1) 0px 4px 8px';
				break;
			
			case 'h3':
				styles['font-size'] = variables['font-size-h3'];
				styles['font-weight'] = 'bold';
				styles['border-left'] = `4px solid ${variables['primary-color']}`;
				styles['border-bottom'] = `1px dashed ${variables['primary-color']}`;
				styles['padding-left'] = '12px';
				styles['margin'] = `${variables['spacing-xl']} ${variables['spacing-md']} ${variables['spacing-md']} 0`;
				styles['color'] = variables['text-secondary'];
				break;
			
			case 'h4':
				styles['font-size'] = variables['font-size-h4'];
				styles['font-weight'] = 'bold';
				styles['color'] = variables['primary-color'];
				styles['margin'] = `${variables['spacing-xl']} ${variables['spacing-md']} -${variables['spacing-md']}`;
				break;
			
			case 'p':
				styles['margin'] = `${variables['spacing-lg']} ${variables['spacing-md']}`;
				styles['text-align'] = 'justify';
				styles['line-height'] = variables['line-height-base'];
				styles['font-size'] = variables['font-size-base'];
				styles['color'] = variables['text-primary'];
				break;
			
			case 'strong':
			case 'b':
				styles['font-weight'] = 'bold';
				styles['color'] = variables['primary-color'];
				break;
			
			case 'em':
			case 'i':
				styles['font-style'] = 'italic';
				styles['color'] = variables['primary-color'];
				break;
			
			case 'img':
				styles['display'] = 'block';
				styles['max-width'] = '100%';
				styles['height'] = 'auto';
				styles['margin'] = `${variables['spacing-sm']} auto`;
				styles['border-radius'] = variables['border-radius-md'];
				styles['box-shadow'] = 'rgba(0, 0, 0, 0.1) 0px 4px 8px';
				styles['visibility'] = 'visible';
				styles['opacity'] = '1';
				break;
			
			case 'blockquote':
				styles['margin'] = `${variables['spacing-lg']} ${variables['spacing-md']}`;
				styles['padding'] = variables['spacing-md'];
				styles['background'] = variables['primary-color-light'];
				styles['border-left'] = `4px solid ${variables['primary-color']}`;
				styles['border-radius'] = variables['border-radius-sm'];
				styles['color'] = variables['text-primary'];
				styles['font-style'] = 'italic';
				break;
			
			case 'code':
				styles['background'] = variables['background-tertiary'];
				styles['padding'] = `${variables['spacing-xs']} ${variables['spacing-sm']}`;
				styles['border-radius'] = variables['border-radius-sm'];
				styles['font-family'] = 'Monaco, Menlo, Ubuntu Mono, monospace';
				styles['font-size'] = '0.9em';
				styles['color'] = variables['primary-color'];
				break;
			
			case 'pre':
				styles['background'] = variables['background-tertiary'];
				styles['padding'] = variables['spacing-md'];
				styles['border-radius'] = variables['border-radius-md'];
				styles['overflow-x'] = 'auto';
				styles['margin'] = `${variables['spacing-lg']} ${variables['spacing-md']}`;
				break;
			
			case 'table':
				styles['width'] = '100%';
				styles['border-collapse'] = 'collapse';
				styles['margin'] = `${variables['spacing-lg']} ${variables['spacing-md']}`;
				styles['border-radius'] = variables['border-radius-md'];
				styles['overflow'] = 'hidden';
				styles['box-shadow'] = 'rgba(0, 0, 0, 0.1) 0px 2px 4px';
				break;
			
			case 'th':
				styles['background'] = variables['primary-color'];
				styles['color'] = variables['text-on-primary'];
				styles['font-weight'] = 'bold';
				styles['padding'] = `${variables['spacing-sm']} ${variables['spacing-md']}`;
				styles['text-align'] = 'left';
				styles['border-bottom'] = `1px solid ${variables['border-color']}`;
				break;
			
			case 'td':
				styles['padding'] = `${variables['spacing-sm']} ${variables['spacing-md']}`;
				styles['text-align'] = 'left';
				styles['border-bottom'] = `1px solid ${variables['border-color']}`;
				break;
			
			case 'ul':
			case 'ol':
				styles['margin'] = `${variables['spacing-lg']} ${variables['spacing-md']}`;
				styles['padding-left'] = variables['spacing-xl'];
				styles['color'] = variables['text-primary'];
				break;
			
			case 'li':
				styles['margin'] = `${variables['spacing-sm']} 0`;
				styles['line-height'] = variables['line-height-base'];
				break;
		}

		// 处理包含rich_media_content类的容器
		if (element.classList.contains('rich_media_content')) {
			styles['font-family'] = variables['font-family'];
			styles['font-size'] = variables['font-size-base'];
			styles['line-height'] = variables['line-height-base'];
			styles['color'] = variables['text-primary'];
			styles['background'] = variables['background-primary'] + ' !important';
			styles['border-radius'] = variables['border-radius-lg'];
			styles['padding'] = variables['spacing-md'];
			styles['box-sizing'] = 'border-box';
			styles['margin'] = '0 auto';
			styles['max-width'] = '100%';
		}

		// 处理图片说明文字样式
		if (element.hasAttribute('style') && element.getAttribute('style')?.includes('text-align: center !important')) {
			// 这是图片说明文字，应用特殊样式
			styles['text-align'] = 'center !important';
			styles['color'] = '#666666 !important';
			styles['font-size'] = '14px !important';
			styles['margin-top'] = '8px !important';
			styles['margin-bottom'] = '8px !important';
			styles['font-style'] = 'italic !important';
			styles['line-height'] = '1.5 !important';
			styles['font-family'] = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important';
		}

		// 处理高亮文本
		if (element.classList.contains('note-highlight')) {
			styles['background-color'] = 'rgba(255, 208, 0, 0.4)';
		}

		// 处理引用样式的特殊情况
		if (tagName === 'blockquote' && element.hasAttribute('style')) {
			const existingStyle = element.getAttribute('style') || '';
			if (existingStyle.includes('padding-left: 10px !important')) {
				// 保持现有的微信引用样式
				styles['padding-left'] = '10px !important';
				styles['border-left'] = '3px solid #c86442 !important';
				styles['color'] = 'rgba(0, 0, 0, 0.6) !important';
				styles['font-size'] = '15px !important';
				styles['padding-top'] = '4px !important';
				styles['margin'] = '1em 0 !important';
				styles['text-indent'] = '0 !important';
			}
		}

		// 处理列表样式
		if (tagName === 'li' && element.hasAttribute('style')) {
			const existingStyle = element.getAttribute('style') || '';
			if (existingStyle.includes('color: rgb(200, 100, 66)')) {
				styles['color'] = 'rgb(200, 100, 66)';
			}
		}

		// 处理上标样式
		if (tagName === 'sup') {
			styles['color'] = 'rgb(51, 112, 255)';
			styles['font-size'] = 'smaller';
			styles['vertical-align'] = 'super';
		}

		// 处理代码块样式
		if (tagName === 'section' && element.classList.contains('code-snippet__js')) {
			styles['background'] = variables['background-tertiary'];
			styles['border-radius'] = variables['border-radius-md'];
			styles['margin'] = `${variables['spacing-lg']} ${variables['spacing-md']}`;
			styles['overflow'] = 'hidden';
		}

		return styles;
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
}
