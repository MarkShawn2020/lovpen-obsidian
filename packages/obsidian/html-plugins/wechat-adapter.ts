import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";
import {logger} from "../../shared/src/logger";

/**
 * 微信公众号适配插件 - 整合所有微信平台相关的处理功能
 * 包括链接转脚注、样式内联化、平台兼容性处理等
 */
export class WechatAdapterPlugin extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "微信公众号适配插件";
	}

	getPluginDescription(): string {
		return "整合所有微信公众号平台适配功能，包括链接处理、样式内联、兼容性优化";
	}

	process(html: string, settings: NMPSettings): string {
		try {
			logger.debug("开始微信公众号适配处理");

			// 依次执行各个适配步骤
			html = this.processLinks(html, settings);
			html = this.inlineStyles(html, settings);
			html = this.preserveStructure(html, settings);
			html = this.optimizeForWechat(html, settings);

			logger.debug("微信公众号适配处理完成");
			return html;
		} catch (error) {
			logger.error("微信公众号适配处理出错:", error);
			return html;
		}
	}

	/**
	 * 处理链接转换为脚注
	 */
	private processLinks(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 查找所有链接
			const links = container.querySelectorAll("a");
			const footnotes: string[] = [];

			links.forEach((link) => {
				const href = link.getAttribute("href");
				if (!href) return;

				// 检查是否已经是脚注格式的链接
				const isFootnoteRef = href.startsWith('#fn-');
				const isFootnoteBackRef = href.startsWith('#fnref-');
				const parentIsSup = link.parentElement?.tagName === 'SUP';
				const hasFootnoteClass = link.classList.contains('footnote-ref') ||
					link.classList.contains('footnote-backref');

				// 如果已经是脚注相关的链接，去除a标签但保留上标效果
				if (isFootnoteRef || isFootnoteBackRef || hasFootnoteClass || parentIsSup) {
					if (parentIsSup) {
						// 如果父元素是sup，保留sup但去除a标签
						const supElement = link.parentElement;
						const linkText = link.textContent;
						link.replaceWith(linkText || '');

						// 确保还是sup样式
						if (supElement && linkText) {
							supElement.textContent = linkText;
						}
					} else {
						// 直接将自身转为上标
						const supElement = container.ownerDocument.createElement('sup');
						supElement.textContent = link.textContent || '';
						link.replaceWith(supElement);
					}
					return;
				}

				// 判断是否需要转换此链接
				const shouldConvert = !href.includes("weixin.qq.com");

				if (shouldConvert) {
					// 创建脚注标记
					const footnoteRef = container.ownerDocument.createElement("sup");
					footnoteRef.textContent = `[${footnotes.length + 1}]`;
					footnoteRef.style.color = "#3370ff";

					// 替换链接为脚注引用
					link.after(footnoteRef);

					// 根据设置决定脚注内容格式
					let footnoteContent = "";
					if (settings.linkDescriptionMode === "raw") {
						footnoteContent = `[${footnotes.length + 1}] ${
							link.textContent
						}: ${href}`;
					} else {
						footnoteContent = `[${footnotes.length + 1}] ${href}`;
					}

					footnotes.push(footnoteContent);

					// 移除链接标签，保留内部文本
					const linkText = link.textContent;
					link.replaceWith(linkText || "");
				}
			});

			// 如果有脚注，添加到文档末尾
			if (footnotes.length > 0) {
				const hr = container.ownerDocument.createElement("hr");
				const footnoteSection = container.ownerDocument.createElement("section");
				footnoteSection.style.fontSize = "14px";
				footnoteSection.style.color = "#888";
				footnoteSection.style.marginTop = "30px";

				footnotes.forEach((note) => {
					const p = container.ownerDocument.createElement("p");
					p.innerHTML = note;
					footnoteSection.appendChild(p);
				});

				container.appendChild(hr);
				container.appendChild(footnoteSection);
			}

			return container.innerHTML;
		} catch (error) {
			logger.error("处理链接时出错:", error);
			return html;
		}
	}

	/**
	 * CSS样式内联化处理
	 * 保留样式表，只处理微信平台的兼容性问题
	 */
	private inlineStyles(html: string, settings: NMPSettings): string {
		try {
			// 使用离线DOM解析，避免影响页面
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
			const container = doc.body.firstChild as HTMLElement;

			logger.debug("为微信内容进行样式处理（保留样式表模式）");

			// 清理CSS中可能导致微信显示问题的属性
			const styleElements = container.querySelectorAll('style');
			styleElements.forEach(styleEl => {
				if (styleEl.textContent) {
					// 清理可能导致微信问题的CSS属性
					let cssContent = styleEl.textContent;
					
					// 移除可能导致问题的CSS属性
					cssContent = cssContent.replace(/user-select\s*:\s*[^;]+;?/gi, '');
					cssContent = cssContent.replace(/-webkit-user-select\s*:\s*[^;]+;?/gi, '');
					cssContent = cssContent.replace(/pointer-events\s*:\s*[^;]+;?/gi, '');
					
					styleEl.textContent = cssContent;
				}
			});

			// 获取所有元素，应用微信兼容性的内联样式
			const allElements = container.querySelectorAll("*:not(style)");
			logger.debug(`处理微信兼容性元素数量: ${allElements.length}`);

			// 只为关键元素添加微信兼容性样式
			for (let i = 0; i < allElements.length; i++) {
				const el = allElements[i] as HTMLElement;
				this.applyWechatCompatibilityStyles(el);
			}

			return container.innerHTML;
		} catch (error) {
			logger.error("样式内联化处理出错:", error);
			return html;
		}
	}

	/**
	 * 保持结构完整性
	 */
	private preserveStructure(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 确保关键容器元素的结构样式
			const keyContainers = [
				'.rich_media_content',
				'.claude-main-content',
				'.claude-epigraph',
				'.claude-meta-section',
				'.claude-meta-content',
				'section.lovpen'
			];

			keyContainers.forEach(selector => {
				const elements = container.querySelectorAll(selector);
				elements.forEach(element => {
					const htmlElement = element as HTMLElement;
					// 强制保持容器结构
					this.enforceContainerStructure(htmlElement);
				});
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("保持结构完整性处理出错:", error);
			return html;
		}
	}

	/**
	 * 强制保持容器结构
	 */
	private enforceContainerStructure(element: HTMLElement): void {
		const existingStyle = element.getAttribute('style') || '';
		const structuralStyles = [
			'display: block',
			'box-sizing: border-box',
			'position: relative'
		];

		// 合并结构样式
		const mergedStyle = existingStyle + '; ' + structuralStyles.join('; ') + ';';
		element.setAttribute('style', mergedStyle);
	}

	/**
	 * 微信平台特定优化
	 */
	private optimizeForWechat(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 优化图片处理
			this.optimizeImages(container);

			// 优化表格处理
			this.optimizeTables(container);

			// 优化代码块处理
			this.optimizeCodeBlocks(container);

			// 清理不兼容的属性和标签
			this.cleanupIncompatibleContent(container);

			return container.innerHTML;
		} catch (error) {
			logger.error("微信平台优化处理出错:", error);
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

		// 直接返回提取的变量，不强制覆盖为特定主题
		// 微信适配插件只处理平台兼容性，不应该改变视觉样式
		return variables;
	}


	/**
	 * 应用微信兼容性样式
	 * 只处理必要的微信平台兼容性问题，不覆盖主题样式
	 */
	private applyWechatCompatibilityStyles(element: HTMLElement): void {
		const tagName = element.tagName.toLowerCase();
		const existingStyle = element.getAttribute('style') || '';
		const compatibilityStyles: string[] = [];

		// 只添加微信平台必需的兼容性样式
		switch (tagName) {
			case 'img':
				// 确保图片在微信中正常显示
				if (!existingStyle.includes('display:') && !existingStyle.includes('display ')) {
					compatibilityStyles.push('display: block');
				}
				if (!existingStyle.includes('max-width:') && !existingStyle.includes('max-width ')) {
					compatibilityStyles.push('max-width: 100%');
				}
				if (!existingStyle.includes('height:') && !existingStyle.includes('height ')) {
					compatibilityStyles.push('height: auto');
				}
				break;

			case 'table':
				// 确保表格在微信中正常显示
				if (!existingStyle.includes('width:') && !existingStyle.includes('width ')) {
					compatibilityStyles.push('width: 100%');
				}
				if (!existingStyle.includes('border-collapse:') && !existingStyle.includes('border-collapse ')) {
					compatibilityStyles.push('border-collapse: collapse');
				}
				break;

			case 'pre':
				// 确保代码块在微信中正常显示
				if (!existingStyle.includes('overflow-x:') && !existingStyle.includes('overflow-x ')) {
					compatibilityStyles.push('overflow-x: auto');
				}
				if (!existingStyle.includes('white-space:') && !existingStyle.includes('white-space ')) {
					compatibilityStyles.push('white-space: pre-wrap');
				}
				break;
		}

		// 应用兼容性样式
		if (compatibilityStyles.length > 0) {
			const newStyle = existingStyle + (existingStyle ? '; ' : '') + compatibilityStyles.join('; ');
			element.setAttribute('style', newStyle);
		}
	}


	/**
	 * 获取元素特定的样式
	 * 微信适配插件只处理平台兼容性，不应该改变视觉样式
	 */
	private getElementSpecificStyles(element: HTMLElement, variables: Record<string, string>): Record<string, string> {
		const tagName = element.tagName.toLowerCase();
		const styles: Record<string, string> = {};

		// 只处理微信平台必需的兼容性样式，不覆盖主题样式
		switch (tagName) {
			case 'img':
				styles['display'] = 'block';
				styles['max-width'] = '100%';
				styles['height'] = 'auto';
				styles['visibility'] = 'visible';
				styles['opacity'] = '1';
				break;

			case 'sup':
				styles['color'] = 'rgb(51, 112, 255)';
				styles['font-size'] = 'smaller';
				styles['vertical-align'] = 'super';
				break;

			case 'section':
				styles['display'] = 'block !important';
				styles['box-sizing'] = 'border-box !important';
				break;

			case 'div':
				styles['display'] = 'block !important';
				styles['box-sizing'] = 'border-box !important';
				break;
		}

		// 处理图片说明文字样式
		if (element.hasAttribute('style') && element.getAttribute('style')?.includes('text-align: center !important')) {
			styles['text-align'] = 'center !important';
			styles['color'] = '#666666 !important';
			styles['font-size'] = '14px !important';
			styles['margin-top'] = '8px !important';
			styles['margin-bottom'] = '8px !important';
			styles['font-style'] = 'italic !important';
			styles['line-height'] = '1.5 !important';
		}

		// 处理高亮文本
		if (element.classList.contains('note-highlight')) {
			styles['background-color'] = 'rgba(255, 208, 0, 0.4)';
		}

		return styles;
	}

	/**
	 * 优化图片处理
	 */
	private optimizeImages(container: HTMLElement): void {
		const images = container.querySelectorAll('img');
		images.forEach(img => {
			// 确保图片有必要的样式
			if (!img.hasAttribute('style')) {
				img.setAttribute('style', 'max-width: 100%; height: auto; display: block; margin: 0.5em auto;');
			}
		});
	}

	/**
	 * 优化表格处理
	 */
	private optimizeTables(container: HTMLElement): void {
		const tables = container.querySelectorAll('table');
		tables.forEach(table => {
			// 确保表格有基本样式
			if (!table.hasAttribute('style')) {
				table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 1em 0;');
			}
		});
	}

	/**
	 * 优化代码块处理
	 */
	private optimizeCodeBlocks(container: HTMLElement): void {
		const codeBlocks = container.querySelectorAll('pre code');
		codeBlocks.forEach(code => {
			const pre = code.parentElement;
			if (pre) {
				// 确保代码块有基本样式
				if (!pre.hasAttribute('style')) {
					pre.setAttribute('style', 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;');
				}

				// 处理代码缩进问题
				this.fixCodeIndentation(code as HTMLElement);
			}
		});
	}

	/**
	 * 修复代码缩进问题
	 */
	private fixCodeIndentation(codeElement: HTMLElement): void {
		let html = codeElement.innerHTML;

		// 将制表符转换为4个空格
		html = html.replace(/\t/g, '    ');

		// 处理行首的空格缩进，转换为&nbsp;确保在微信中正确显示
		html = html.replace(/^( {2,})/gm, (match) => {
			return '&nbsp;'.repeat(match.length);
		});

		// 处理代码中的多个连续空格
		html = html.replace(/  /g, '&nbsp;&nbsp;');

		codeElement.innerHTML = html;
	}

	/**
	 * 清理不兼容的内容
	 */
	private cleanupIncompatibleContent(container: HTMLElement): void {
		// 移除可能导致问题的属性
		const allElements = container.querySelectorAll('*');
		allElements.forEach(element => {
			// 移除可能不兼容的class
			if (element.classList.contains('hljs')) {
				element.classList.remove('hljs');
			}

			// 清理空的属性
			if (element.hasAttribute('class') && !element.getAttribute('class')?.trim()) {
				element.removeAttribute('class');
			}
		});
	}

}
