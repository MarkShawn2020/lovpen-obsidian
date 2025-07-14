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
			console.log("🚀 [微信插件] 开始处理", { 
				inputLength: html.length,
				inputPreview: html.substring(0, 200) + '...'
			});
			logger.debug("开始微信公众号适配处理");

			const originalHtml = html;
			
			// 依次执行各个适配步骤
			console.log("📎 [微信插件] Step 1: 处理链接");
			html = this.processLinks(html, settings);
			console.log("📎 [微信插件] Step 1 完成", { 
				changed: html !== originalHtml,
				length: html.length 
			});

			console.log("🎨 [微信插件] Step 2: 内联样式");
			const beforeInline = html;
			html = this.inlineStyles(html, settings);
			console.log("🎨 [微信插件] Step 2 完成", { 
				changed: html !== beforeInline,
				length: html.length,
				hasStyle: html.includes('<style'),
				styleRemoved: beforeInline.includes('<style') && !html.includes('<style')
			});

			console.log("🏗️ [微信插件] Step 3: 保持结构");
			const beforeStructure = html;
			html = this.preserveStructure(html, settings);
			console.log("🏗️ [微信插件] Step 3 完成", { 
				changed: html !== beforeStructure,
				length: html.length 
			});

			console.log("⚡ [微信插件] Step 4: 微信优化");
			const beforeOptimize = html;
			html = this.optimizeForWechat(html, settings);
			console.log("⚡ [微信插件] Step 4 完成", { 
				changed: html !== beforeOptimize,
				length: html.length 
			});

			console.log("✅ [微信插件] 处理完成", {
				finalLength: html.length,
				totalChanged: html !== originalHtml,
				finalPreview: html.substring(0, 300) + '...'
			});

			logger.debug("微信公众号适配处理完成");
			return html;
		} catch (error) {
			console.error("❌ [微信插件] 处理出错:", error);
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
	 * 微信平台特定优化 - 全新策略：DOM预重构
	 */
	private optimizeForWechat(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 核心策略：预测微信编辑器行为，提前重构内容
			html = this.predictiveRestructure(container);

			// 重新解析已重构的HTML
			const restructuredDoc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const restructuredContainer = restructuredDoc.body.firstChild as HTMLElement;

			// 优化图片处理
			this.optimizeImages(restructuredContainer);

			// 优化表格处理
			this.optimizeTables(restructuredContainer);

			// 优化代码块处理
			this.optimizeCodeBlocks(restructuredContainer);

			// 清理不兼容的属性和标签
			this.cleanupIncompatibleContent(restructuredContainer);

			return restructuredContainer.innerHTML;
		} catch (error) {
			logger.error("微信平台优化处理出错:", error);
			return html;
		}
	}

	/**
	 * 预测性重构：模拟微信编辑器的行为，提前重构内容
	 */
	private predictiveRestructure(container: HTMLElement): string {
		try {
			logger.debug("开始预测性DOM重构");

			// 处理元信息区域 - 这是最容易被微信编辑器重构的区域
			this.restructureMetaSection(container);

			// 处理其他可能被重构的复杂结构
			this.restructureComplexContainers(container);

			return container.innerHTML;
		} catch (error) {
			logger.error("预测性重构出错:", error);
			return container.innerHTML;
		}
	}

	/**
	 * 重构元信息区域 - 核心难点
	 */
	private restructureMetaSection(container: HTMLElement): void {
		try {
			const metaSections = container.querySelectorAll('.claude-meta-section');
			console.log("🔍 [微信插件] 找到元信息区域", { count: metaSections.length });
			
			metaSections.forEach((metaSection, index) => {
				const section = metaSection as HTMLElement;
				const metaContent = section.querySelector('.claude-meta-content') as HTMLElement;
				
				console.log(`📦 [微信插件] 处理元信息区域 ${index + 1}`, {
					hasContent: !!metaContent,
					sectionHTML: section.outerHTML.substring(0, 200) + '...'
				});
				
				if (!metaContent) return;

				// 提取容器样式：将3层嵌套的样式合并
				const sectionStyles = this.extractStyles(section);
				const contentStyles = this.extractStyles(metaContent);
				const mergedContainerStyles = this.mergeStyles(sectionStyles, contentStyles);

				console.log("🎨 [微信插件] 样式合并", {
					sectionStyles: sectionStyles.substring(0, 100) + '...',
					contentStyles: contentStyles.substring(0, 100) + '...',
					mergedStyles: mergedContainerStyles.substring(0, 150) + '...'
				});

				// 处理元信息项目
				const metaItems = metaContent.querySelectorAll('.claude-meta-item');
				const newParagraphs: string[] = [];

				console.log("📋 [微信插件] 处理元信息项目", { itemCount: metaItems.length });

				metaItems.forEach((item, itemIndex) => {
					const itemElement = item as HTMLElement;
					const itemStyles = this.extractStyles(itemElement);
					
					// 合并所有层级的样式到最终的p标签
					const finalParagraphStyles = this.mergeStyles(mergedContainerStyles, itemStyles);

					// 处理内部的label和value
					const label = itemElement.querySelector('.claude-meta-label') as HTMLElement;
					const value = itemElement.querySelector('.claude-meta-value') as HTMLElement;

					if (label && value) {
						const labelStyles = this.extractStyles(label);
						const valueStyles = this.extractStyles(value);

						console.log(`🏷️ [微信插件] 项目 ${itemIndex + 1}`, {
							labelText: label.textContent,
							valueText: value.textContent,
							labelStyles: labelStyles.substring(0, 80) + '...',
							valueStyles: valueStyles.substring(0, 80) + '...',
							finalStyles: finalParagraphStyles.substring(0, 100) + '...'
						});

						// 创建微信偏好的p+span结构
						const paragraph = `<p style="${finalParagraphStyles}">` +
							`<span style="${labelStyles}">${label.textContent}</span>` +
							`<span style="${valueStyles}">${value.textContent}</span>` +
							`</p>`;
						
						newParagraphs.push(paragraph);
					}
				});

				// 处理标签区域
				const metaTags = metaContent.querySelector('.claude-meta-tags') as HTMLElement;
				if (metaTags) {
					const tagsStyles = this.extractStyles(metaTags);
					const finalTagsStyles = this.mergeStyles(mergedContainerStyles, tagsStyles);

					const tags = metaTags.querySelectorAll('.claude-meta-tag');
					const tagSpans: string[] = [];

					console.log("🏷️ [微信插件] 处理标签区域", { 
						tagCount: tags.length,
						tagsStyles: tagsStyles.substring(0, 80) + '...'
					});

					tags.forEach((tag, tagIndex) => {
						const tagElement = tag as HTMLElement;
						const tagStyles = this.extractStyles(tagElement);
						console.log(`🔖 [微信插件] 标签 ${tagIndex + 1}`, {
							text: tagElement.textContent,
							styles: tagStyles.substring(0, 60) + '...'
						});
						tagSpans.push(`<span style="${tagStyles}">${tagElement.textContent}</span>`);
					});

					if (tagSpans.length > 0) {
						const tagsParagraph = `<p style="${finalTagsStyles}">${tagSpans.join('')}</p>`;
						newParagraphs.push(tagsParagraph);
					}
				}

				// 替换原有的复杂结构
				if (newParagraphs.length > 0) {
					const beforeHTML = section.outerHTML;
					const newHTML = newParagraphs.join('');
					
					console.log("🔄 [微信插件] DOM替换", {
						paragraphCount: newParagraphs.length,
						beforeLength: beforeHTML.length,
						afterLength: newHTML.length,
						beforePreview: beforeHTML.substring(0, 150) + '...',
						afterPreview: newHTML.substring(0, 150) + '...'
					});
					
					section.outerHTML = newHTML;
				}
			});

			console.log("✅ [微信插件] 元信息区域重构完成");
			logger.debug("元信息区域重构完成");
		} catch (error) {
			console.error("❌ [微信插件] 重构元信息区域出错:", error);
			logger.error("重构元信息区域出错:", error);
		}
	}

	/**
	 * 提取元素的内联样式
	 */
	private extractStyles(element: HTMLElement): string {
		return element.getAttribute('style') || '';
	}

	/**
	 * 合并多个样式字符串
	 */
	private mergeStyles(...styles: string[]): string {
		const mergedStyles: string[] = [];
		
		styles.forEach(style => {
			if (style && style.trim()) {
				// 清理样式字符串
				const cleanStyle = style.trim().replace(/;+$/, '');
				if (cleanStyle) {
					mergedStyles.push(cleanStyle);
				}
			}
		});

		return mergedStyles.join('; ');
	}

	/**
	 * 重构其他复杂容器
	 */
	private restructureComplexContainers(container: HTMLElement): void {
		try {
			// 处理其他可能被微信编辑器重构的复杂嵌套结构
			
			// 1. 处理深层嵌套的div容器
			this.flattenNestedDivs(container);

			// 2. 处理复杂的section结构
			this.simplifyComplexSections(container);

			// 3. 处理可能被转换的其他容器元素
			this.convertContainerElements(container);

			logger.debug("复杂容器重构完成");
		} catch (error) {
			logger.error("重构复杂容器出错:", error);
		}
	}

	/**
	 * 扁平化嵌套的div结构
	 */
	private flattenNestedDivs(container: HTMLElement): void {
		try {
			// 查找深度嵌套的div结构（超过2层的）
			const nestedDivs = container.querySelectorAll('div div div');
			
			nestedDivs.forEach(deepDiv => {
				const element = deepDiv as HTMLElement;
				
				// 如果这个div只包含文本或简单内容，将其转换为span
				if (this.isSimpleContent(element)) {
					const span = container.ownerDocument.createElement('span');
					
					// 合并所有父级div的样式
					const parentStyles = this.collectParentStyles(element);
					span.setAttribute('style', parentStyles);
					
					// 复制内容
					span.innerHTML = element.innerHTML;
					
					// 替换原元素
					element.replaceWith(span);
				}
			});
		} catch (error) {
			logger.error("扁平化嵌套div时出错:", error);
		}
	}

	/**
	 * 简化复杂的section结构
	 */
	private simplifyComplexSections(container: HTMLElement): void {
		try {
			const sections = container.querySelectorAll('section');
			
			sections.forEach(section => {
				const sectionElement = section as HTMLElement;
				
				// 如果section内容比较简单，考虑转换为div或p
				if (this.isSimpleSection(sectionElement)) {
					const replacement = container.ownerDocument.createElement('div');
					
					// 保留样式
					const styles = this.extractStyles(sectionElement);
					if (styles) {
						replacement.setAttribute('style', styles);
					}
					
					// 复制内容和属性
					replacement.innerHTML = sectionElement.innerHTML;
					if (sectionElement.className) {
						replacement.className = sectionElement.className;
					}
					
					// 替换
					sectionElement.replaceWith(replacement);
				}
			});
		} catch (error) {
			logger.error("简化section结构时出错:", error);
		}
	}

	/**
	 * 转换容器元素为微信偏好的格式
	 */
	private convertContainerElements(container: HTMLElement): void {
		try {
			// 将一些容器元素转换为更兼容的格式
			
			// 处理article、aside等语义化标签
			const semanticTags = container.querySelectorAll('article, aside, header, footer, nav');
			semanticTags.forEach(tag => {
				const element = tag as HTMLElement;
				const div = container.ownerDocument.createElement('div');
				
				// 保留样式和类名
				const styles = this.extractStyles(element);
				if (styles) div.setAttribute('style', styles);
				if (element.className) div.className = element.className;
				
				div.innerHTML = element.innerHTML;
				element.replaceWith(div);
			});
		} catch (error) {
			logger.error("转换容器元素时出错:", error);
		}
	}

	/**
	 * 判断元素内容是否简单
	 */
	private isSimpleContent(element: HTMLElement): boolean {
		// 检查是否只包含文本和简单的内联元素
		const childNodes = element.childNodes;
		for (let i = 0; i < childNodes.length; i++) {
			const node = childNodes[i];
			if (node.nodeType === Node.ELEMENT_NODE) {
				const tag = (node as Element).tagName.toLowerCase();
				// 如果包含块级元素，则不是简单内容
				if (['div', 'p', 'section', 'article', 'header', 'footer'].includes(tag)) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * 判断section是否简单
	 */
	private isSimpleSection(element: HTMLElement): boolean {
		// 检查section是否包含复杂的嵌套结构
		const nestedContainers = element.querySelectorAll('div div, section section');
		return nestedContainers.length < 2; // 允许一定程度的嵌套
	}

	/**
	 * 收集父级样式
	 */
	private collectParentStyles(element: HTMLElement): string {
		const styles: string[] = [];
		let current: HTMLElement | null = element;
		
		// 向上遍历收集样式，最多3层
		let depth = 0;
		while (current && depth < 3) {
			const style = this.extractStyles(current);
			if (style) {
				styles.unshift(style); // 父级样式在前
			}
			current = current.parentElement;
			depth++;
		}
		
		return this.mergeStyles(...styles);
	}


	/**
	 * 应用关键样式 - 完整版本，将CSS样式转换为内联样式
	 */
	private applyEssentialStyles(container: HTMLElement, cssVariables: Record<string, string>): void {
		try {
			// 获取所有style标签的内容
			const styleElements = container.querySelectorAll('style');
			let allCSS = '';
			styleElements.forEach(styleEl => {
				allCSS += styleEl.textContent || '';
			});

			// 解析CSS并应用到对应元素
			this.applyCSSRules(container, allCSS, cssVariables);

			logger.debug("关键样式应用完成");
		} catch (error) {
			logger.error("应用关键样式时出错:", error);
		}
	}

	/**
	 * 解析CSS规则并应用到对应元素
	 */
	private applyCSSRules(container: HTMLElement, css: string, cssVariables: Record<string, string>): void {
		try {
			// 替换CSS变量
			let processedCSS = css;
			Object.entries(cssVariables).forEach(([key, value]) => {
				const varRegex = new RegExp(`var\\(--${key}\\)`, 'g');
				processedCSS = processedCSS.replace(varRegex, value);
			});

			// 解析CSS并应用到元素
			this.parseCSSAndApply(container, processedCSS);

			// 额外的微信兼容性处理
			this.applyWechatCompatibilityFixes(container);

		} catch (error) {
			logger.error("应用CSS规则时出错:", error);
		}
	}

	/**
	 * 解析CSS并应用到元素 - 使用正则表达式解析
	 */
	private parseCSSAndApply(container: HTMLElement, css: string): void {
		try {
			// 移除注释
			css = css.replace(/\/\*[\s\S]*?\*\//g, '');

			// 匹配CSS规则
			const ruleRegex = /([^{]+)\{([^}]+)\}/g;
			let match;

			while ((match = ruleRegex.exec(css)) !== null) {
				const selector = match[1].trim();
				const declarations = match[2].trim();

				// 跳过@规则和其他特殊规则
				if (selector.startsWith('@') || selector.includes('::')) {
					continue;
				}

				try {
					// 查找匹配的元素
					const elements = container.querySelectorAll(selector);
					
					elements.forEach(element => {
						const htmlElement = element as HTMLElement;
						this.applyDeclarations(htmlElement, declarations);
					});
				} catch (selectorError) {
					// 如果选择器无效，跳过
					logger.debug(`跳过无效选择器: ${selector}`);
				}
			}
		} catch (error) {
			logger.error("解析CSS时出错:", error);
		}
	}

	/**
	 * 应用CSS声明到元素
	 */
	private applyDeclarations(element: HTMLElement, declarations: string): void {
		try {
			const existingStyle = element.getAttribute('style') || '';
			const newStyles: string[] = [];

			// 解析CSS声明
			const declarationRegex = /([^:]+):([^;]+);?/g;
			let match;

			while ((match = declarationRegex.exec(declarations)) !== null) {
				const property = match[1].trim();
				const value = match[2].trim();

				// 跳过微信不支持的属性
				if (this.isWechatCompatibleProperty(property)) {
					// 对flex布局进行特殊处理，转换为微信更兼容的布局
					const processedStyle = this.processFlexLayout(property, value);
					if (processedStyle) {
						newStyles.push(processedStyle);
					}
				}
			}

			// 合并样式
			if (newStyles.length > 0) {
				const newStylesStr = newStyles.join('; ');
				const mergedStyle = existingStyle ? `${existingStyle}; ${newStylesStr}` : newStylesStr;
				element.setAttribute('style', mergedStyle);
			}
		} catch (error) {
			logger.error("应用CSS声明时出错:", error);
		}
	}

	/**
	 * 处理flex布局，转换为微信更兼容的布局
	 */
	private processFlexLayout(property: string, value: string): string | null {
		// flex布局转换映射
		const flexMapping: Record<string, string> = {
			'display': value === 'flex' ? 'display: block' : `display: ${value}`,
			'flex-direction': value === 'row' ? 'display: inline-block' : 'display: block',
			'justify-content': this.convertJustifyContent(value),
			'align-items': this.convertAlignItems(value),
			'flex': this.convertFlex(value)
		};

		// 如果是flex相关属性，进行转换
		if (flexMapping[property]) {
			return flexMapping[property];
		}

		// 其他属性直接返回
		return `${property}: ${value}`;
	}

	/**
	 * 转换justify-content属性
	 */
	private convertJustifyContent(value: string): string {
		const mapping: Record<string, string> = {
			'center': 'text-align: center',
			'flex-start': 'text-align: left',
			'flex-end': 'text-align: right',
			'space-between': 'text-align: justify',
			'space-around': 'text-align: center'
		};
		return mapping[value] || 'text-align: left';
	}

	/**
	 * 转换align-items属性
	 */
	private convertAlignItems(value: string): string {
		const mapping: Record<string, string> = {
			'center': 'vertical-align: middle',
			'flex-start': 'vertical-align: top',
			'flex-end': 'vertical-align: bottom',
			'baseline': 'vertical-align: baseline'
		};
		return mapping[value] || 'vertical-align: top';
	}

	/**
	 * 转换flex属性
	 */
	private convertFlex(value: string): string {
		// flex: 1 转换为 width: 100%
		if (value === '1' || value === '1 1 0%') {
			return 'width: 100%';
		}
		// 其他flex值的处理
		return 'display: inline-block';
	}


	/**
	 * 检查CSS属性是否与微信兼容
	 */
	private isWechatCompatibleProperty(property: string): boolean {
		// 微信不支持的属性列表（更保守的策略）
		const incompatibleProperties = [
			'position',
			'user-select',
			'-webkit-user-select',
			'-moz-user-select',
			'transform',
			'transform-origin',
			'animation',
			'transition',
			'filter',
			'backdrop-filter',
			'mix-blend-mode',
			'clip-path',
			'mask',
			'overflow-x',
			'overflow-y'
		];
		
		// 微信支持但可能被编辑器过滤的属性，需要特殊处理
		const riskyProperties = [
			'flex',
			'flex-direction',
			'flex-wrap',
			'justify-content',
			'align-items',
			'align-self',
			'flex-grow',
			'flex-shrink',
			'flex-basis'
		];
		
		// 对于危险属性，我们保留但会在后续步骤中转换
		return !incompatibleProperties.includes(property);
	}

	/**
	 * 应用微信兼容性修复
	 */
	private applyWechatCompatibilityFixes(container: HTMLElement): void {
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

		// 4. 处理列表项 - 确保列表样式正确显示
		const listItems = container.querySelectorAll('li');
		listItems.forEach(li => {
			const existingStyle = li.getAttribute('style') || '';
			if (!existingStyle.includes('display')) {
				li.setAttribute('style', existingStyle + '; display: list-item;');
			}
		});
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
