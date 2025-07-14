import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";
import {logger} from "../../shared/src/logger";

/**
 * 微信公众号适配插件 - 根据微信公众号HTML/CSS支持约束进行适配
 * 主要功能：
 * 1. 链接转脚注处理
 * 2. 移除<style>标签，转换为内联样式
 * 3. 清理微信不支持的CSS属性（position、id、transform等）
 * 4. 应用微信兼容的样式（使用px单位、避免复杂定位）
 * 5. 优化图片、表格、代码块等元素的显示
 */
export class WechatAdapterPlugin extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "微信公众号适配插件";
	}

	getPluginDescription(): string {
		return "根据微信公众号HTML/CSS约束进行内容适配：移除不支持的样式、转换为内联CSS、优化元素兼容性";
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
	 * 简化策略：仅处理关键的微信兼容性问题，保留原有主题效果
	 */
	private inlineStyles(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
			const container = doc.body.firstChild as HTMLElement;

			logger.debug("微信CSS内联化处理：简化策略，只处理必要的兼容性问题");

			// 微信不支持<style>标签，但我们采用保守策略
			// 只提取和应用最关键的样式，避免破坏主题效果
			const styleElements = container.querySelectorAll('style');
			const cssVariables = this.extractCSSVariables(styleElements[0]?.textContent || '');

			// 仅应用关键的基础样式，避免样式冲突
			this.applyEssentialStyles(container, cssVariables);

			// 移除style标签（微信要求）
			styleElements.forEach(styleEl => {
				styleEl.remove();
			});

			// 清理不兼容的属性
			const allElements = container.querySelectorAll("*");
			for (let i = 0; i < allElements.length; i++) {
				const el = allElements[i] as HTMLElement;
				this.cleanWechatIncompatibleStyles(el);
			}

			logger.debug(`微信兼容性处理完成，处理元素数量: ${allElements.length}`);
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
	 * 应用关键样式 - 简化版本，只处理必要的微信兼容性
	 */
	private applyEssentialStyles(container: HTMLElement, cssVariables: Record<string, string>): void {
		try {
			// 只处理最关键的元素和样式
			
			// 1. 处理图片 - 确保在微信中正确显示
			const images = container.querySelectorAll('img');
			images.forEach(img => {
				const existingStyle = img.getAttribute('style') || '';
				if (!existingStyle.includes('max-width')) {
					img.setAttribute('style', existingStyle + '; max-width: 100%; height: auto;');
				}
			});

			// 2. 处理代码块 - 确保代码不会溢出
			const codeBlocks = container.querySelectorAll('pre');
			codeBlocks.forEach(pre => {
				const existingStyle = pre.getAttribute('style') || '';
				if (!existingStyle.includes('overflow-x')) {
					pre.setAttribute('style', existingStyle + '; overflow-x: auto; white-space: pre-wrap;');
				}
			});

			// 3. 处理表格 - 确保表格适应屏幕
			const tables = container.querySelectorAll('table');
			tables.forEach(table => {
				const existingStyle = table.getAttribute('style') || '';
				if (!existingStyle.includes('width')) {
					table.setAttribute('style', existingStyle + '; width: 100%; border-collapse: collapse;');
				}
			});

			// 4. 应用CSS变量到关键元素
			if (cssVariables['primary-color']) {
				const primaryColor = cssVariables['primary-color'];
				
				// 应用主色调到上标元素
				const sups = container.querySelectorAll('sup');
				sups.forEach(sup => {
					const existingStyle = sup.getAttribute('style') || '';
					if (!existingStyle.includes('color') && !sup.textContent?.startsWith('[')) {
						sup.setAttribute('style', existingStyle + `; color: ${primaryColor};`);
					}
				});
			}

			logger.debug("关键样式应用完成");
		} catch (error) {
			logger.error("应用关键样式时出错:", error);
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
	 * 清理微信不兼容的样式 - 保守策略，只移除确定会导致问题的属性
	 */
	private cleanWechatIncompatibleStyles(element: HTMLElement): void {
		// 清理现有的内联样式中不兼容的属性
		const existingStyle = element.getAttribute('style');
		if (existingStyle) {
			let cleanedStyle = existingStyle;
			
			// 只移除确定会被微信删除的属性
			cleanedStyle = cleanedStyle.replace(/position\s*:\s*[^;]+;?/gi, '');
			cleanedStyle = cleanedStyle.replace(/user-select\s*:\s*[^;]+;?/gi, '');
			cleanedStyle = cleanedStyle.replace(/-webkit-user-select\s*:\s*[^;]+;?/gi, '');
			
			// 清理多余的分号和空格
			cleanedStyle = cleanedStyle.replace(/;+/g, ';').replace(/;\s*$/, '').trim();
			
			if (cleanedStyle !== existingStyle) {
				element.setAttribute('style', cleanedStyle);
			}
		}
	}

	/**
	 * 简化的微信兼容性处理 - 已在applyEssentialStyles中处理，这里不再重复
	 */
	private applyWechatCompatibilityStyles(element: HTMLElement): void {
		// 不再在这里添加样式，避免重复处理
		// 兼容性样式已经在applyEssentialStyles中处理
	}



	/**
	 * 这些优化方法已经整合到applyEssentialStyles中，避免重复处理
	 */
	private optimizeImages(container: HTMLElement): void {
		// 已在applyEssentialStyles中处理
	}

	private optimizeTables(container: HTMLElement): void {
		// 已在applyEssentialStyles中处理
	}

	private optimizeCodeBlocks(container: HTMLElement): void {
		// 已在applyEssentialStyles中处理
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
