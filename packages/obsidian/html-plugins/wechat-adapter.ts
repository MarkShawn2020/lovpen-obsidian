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
	 * CSS样式内联化处理 - 正确实现CSS转内联样式
	 * 将<style>标签中的CSS规则转换为元素的内联样式
	 */
	private inlineStyles(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
			const container = doc.body.firstChild as HTMLElement;

			logger.debug("微信CSS内联化处理：正确转换CSS为内联样式");

			// 1. 提取所有CSS规则
			const cssRules = this.extractAllCSSRules(container);
			console.log("🎨 [微信插件] 提取到CSS规则数量:", cssRules.length);

			// 2. 将CSS规则应用到对应元素的内联样式
			this.applyCSSRulesToElements(container, cssRules);

			// 3. 移除<style>标签（微信不支持）
			const styleElements = container.querySelectorAll('style');
			styleElements.forEach(styleEl => {
				styleEl.remove();
			});

			// 4. 清理微信不兼容的CSS属性
			this.cleanIncompatibleCSSProperties(container);

			logger.debug(`微信CSS内联化完成，处理元素数量: ${container.querySelectorAll('*').length}`);
			return container.innerHTML;
		} catch (error) {
			logger.error("CSS内联化处理出错:", error);
			return html;
		}
	}

	/**
	 * 保持结构完整性 - 简化版本
	 */
	private preserveStructure(html: string, settings: NMPSettings): string {
		try {
			// 简化处理，不强制修改容器样式
			logger.debug("保持结构完整性：简化处理，保留原有样式");
			return html;
		} catch (error) {
			logger.error("保持结构完整性处理出错:", error);
			return html;
		}
	}

	/**
	 * 强制保持容器结构 - 已禁用
	 */
	private enforceContainerStructure(element: HTMLElement): void {
		// 已禁用 - 不再强制修改容器样式
		return;
	}

	/**
	 * 微信平台特定优化 - 保护HTML结构不被微信破坏
	 */
	private optimizeForWechat(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 核心策略：保护关键HTML结构，防止被微信重组
			html = this.protectHtmlStructure(container);

			// 重新解析已优化的HTML
			const optimizedDoc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const optimizedContainer = optimizedDoc.body.firstChild as HTMLElement;

			// 优化图片处理
			this.optimizeImages(optimizedContainer);

			// 优化表格处理
			this.optimizeTables(optimizedContainer);

			// 优化代码块处理
			this.optimizeCodeBlocks(optimizedContainer);

			// 清理不兼容的属性和标签
			this.cleanupIncompatibleContent(optimizedContainer);

			return optimizedContainer.innerHTML;
		} catch (error) {
			logger.error("微信平台优化处理出错:", error);
			return html;
		}
	}

	/**
	 * 保护HTML结构不被微信编辑器破坏
	 */
	private protectHtmlStructure(container: HTMLElement): string {
		try {
			logger.debug("开始保护HTML结构，防止微信编辑器破坏");

			// 1. 转换关键div为section标签（微信对section更宽松）
			this.convertDivsToSections(container);

			// 2. 为meta card结构添加保护性样式
			this.protectMetaCardStructure(container);

			// 3. 强化关键元素的样式权重
			this.reinforceElementStyles(container);

			// 4. 预防微信的结构重组
			this.preventStructureReorganization(container);

			return container.innerHTML;
		} catch (error) {
			logger.error("保护HTML结构时出错:", error);
			return container.innerHTML;
		}
	}

	/**
	 * 提取所有CSS规则
	 */
	private extractAllCSSRules(container: HTMLElement): Array<{selector: string, rules: Record<string, string>}> {
		const cssRules: Array<{selector: string, rules: Record<string, string>}> = [];
		
		// 提取所有style标签的内容
		const styleElements = container.querySelectorAll('style');
		
		styleElements.forEach(styleElement => {
			const cssText = styleElement.textContent || '';
			const rules = this.parseCSSText(cssText);
			cssRules.push(...rules);
		});

		return cssRules;
	}

	/**
	 * 解析CSS文本为规则对象
	 */
	private parseCSSText(cssText: string): Array<{selector: string, rules: Record<string, string>}> {
		const rules: Array<{selector: string, rules: Record<string, string>}> = [];
		
		try {
			// 移除注释
			cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
			
			// 解析CSS变量
			const cssVariables = this.extractCSSVariables(cssText);
			
			// 匹配CSS规则
			const ruleRegex = /([^{]+)\{([^}]+)\}/g;
			let match;

			while ((match = ruleRegex.exec(cssText)) !== null) {
				const selector = match[1].trim();
				const declarations = match[2].trim();

				// 跳过@规则和伪类（微信不支持）
				if (selector.startsWith('@') || selector.includes('::') || 
					selector.includes(':hover') || selector.includes(':focus') ||
					selector.includes(':active') || selector.includes(':before') ||
					selector.includes(':after')) {
					continue;
				}

				// 解析声明为键值对
				const ruleObj = this.parseDeclarations(declarations, cssVariables);
				
				if (Object.keys(ruleObj).length > 0) {
					rules.push({
						selector: selector,
						rules: ruleObj
					});
				}
			}
		} catch (error) {
			logger.error("解析CSS文本时出错:", error);
		}

		return rules;
	}

	/**
	 * 解析CSS声明为键值对
	 */
	private parseDeclarations(declarations: string, cssVariables: Record<string, string>): Record<string, string> {
		const rules: Record<string, string> = {};
		
		// 分割声明
		const declarationArray = declarations.split(';').map(d => d.trim()).filter(d => d);
		
		declarationArray.forEach(declaration => {
			const colonIndex = declaration.indexOf(':');
			if (colonIndex === -1) return;
			
			const property = declaration.substring(0, colonIndex).trim();
			let value = declaration.substring(colonIndex + 1).trim();
			
			// 替换CSS变量
			Object.entries(cssVariables).forEach(([varName, varValue]) => {
				const varRegex = new RegExp(`var\\(--${varName}\\)`, 'g');
				value = value.replace(varRegex, varValue);
			});
			
			// 检查属性是否兼容微信
			if (this.isWechatCompatibleProperty(property)) {
				rules[property] = value;
			}
		});
		
		return rules;
	}

	/**
	 * 将CSS规则应用到对应元素
	 */
	private applyCSSRulesToElements(container: HTMLElement, cssRules: Array<{selector: string, rules: Record<string, string>}>): void {
		cssRules.forEach(cssRule => {
			try {
				// 查找匹配的元素
				const elements = container.querySelectorAll(cssRule.selector);
				
				elements.forEach(element => {
					const htmlElement = element as HTMLElement;
					this.mergeStylesToElement(htmlElement, cssRule.rules);
				});
			} catch (selectorError) {
				// 如果选择器无效，跳过
				console.warn(`跳过无效选择器: ${cssRule.selector}`);
			}
		});
	}

	/**
	 * 将样式规则合并到元素的内联样式
	 */
	private mergeStylesToElement(element: HTMLElement, rules: Record<string, string>): void {
		const existingStyle = element.getAttribute('style') || '';
		const existingRules = this.parseInlineStyle(existingStyle);
		
		// 合并规则（内联样式优先级更高）
		const mergedRules = { ...rules, ...existingRules };
		
		// 转换为内联样式字符串
		const newStyleString = this.stringifyStyleRules(mergedRules);
		
		if (newStyleString) {
			element.setAttribute('style', newStyleString);
		}
	}

	/**
	 * 解析内联样式为键值对
	 */
	private parseInlineStyle(styleString: string): Record<string, string> {
		const rules: Record<string, string> = {};
		
		if (!styleString) return rules;
		
		const declarations = styleString.split(';').map(d => d.trim()).filter(d => d);
		
		declarations.forEach(declaration => {
			const colonIndex = declaration.indexOf(':');
			if (colonIndex === -1) return;
			
			const property = declaration.substring(0, colonIndex).trim();
			const value = declaration.substring(colonIndex + 1).trim();
			
			if (property && value) {
				rules[property] = value;
			}
		});
		
		return rules;
	}

	/**
	 * 将样式规则对象转换为样式字符串
	 */
	private stringifyStyleRules(rules: Record<string, string>): string {
		const declarations: string[] = [];
		
		Object.entries(rules).forEach(([property, value]) => {
			if (property && value) {
				declarations.push(`${property}: ${value}`);
			}
		});
		
		return declarations.join('; ');
	}

	/**
	 * 清理微信不兼容的CSS属性
	 */
	private cleanIncompatibleCSSProperties(container: HTMLElement): void {
		const allElements = container.querySelectorAll('*');
		
		allElements.forEach(element => {
			const htmlElement = element as HTMLElement;
			
			// 移除id属性（微信会删除）
			if (htmlElement.hasAttribute('id')) {
				htmlElement.removeAttribute('id');
			}
			
			// 清理内联样式中的不兼容属性
			const style = htmlElement.getAttribute('style');
			if (style) {
				const rules = this.parseInlineStyle(style);
				const cleanedRules: Record<string, string> = {};
				
				Object.entries(rules).forEach(([property, value]) => {
					if (this.isWechatCompatibleProperty(property)) {
						cleanedRules[property] = value;
					}
				});
				
				const cleanedStyle = this.stringifyStyleRules(cleanedRules);
				if (cleanedStyle) {
					htmlElement.setAttribute('style', cleanedStyle);
				} else {
					htmlElement.removeAttribute('style');
				}
			}
		});
	}

	/**
	 * 样式兼容性调整：保留DOM结构，只调整样式兼容性
	 * 已被新的结构保护方法替代
	 */
	private adjustStyleCompatibility(container: HTMLElement): void {
		// 此方法已被protectHtmlStructure替代，不再使用
		logger.debug("样式兼容性调整已被新的结构保护方法替代");
	}

	/**
	 * 调整Flexbox布局兼容性 - 已被新的结构保护方法替代
	 */
	private adjustFlexboxCompatibility(container: HTMLElement): void {
		// 此方法已被protectHtmlStructure替代，不再使用
		logger.debug("Flexbox兼容性调整已被新的结构保护方法替代");
	}

	/**
	 * 确保元素可见性 - 已被新的结构保护方法替代
	 */
	private ensureElementVisibility(container: HTMLElement): void {
		// 此方法已被protectHtmlStructure替代，不再使用
		logger.debug("元素可见性确保已被新的结构保护方法替代");
	}

	/**
	 * 优化移动端显示 - 已被新的结构保护方法替代
	 */
	private optimizeForMobile(container: HTMLElement): void {
		// 此方法已被protectHtmlStructure替代，不再使用
		logger.debug("移动端显示优化已被新的结构保护方法替代");
	}

	/**
	 * 重构元信息区域 - 已禁用，保留原始结构
	 */
	private restructureMetaSection(container: HTMLElement): void {
		// 已禁用 - 不再进行DOM重构，保留原始结构
		logger.debug("元信息区域重构已禁用，保留原始结构");
		return;
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
	 * 重构其他复杂容器 - 已禁用
	 */
	private restructureComplexContainers(container: HTMLElement): void {
		// 已禁用 - 不再进行DOM重构，保留原始结构
		logger.debug("复杂容器重构已禁用，保留原始结构");
		return;
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
	 * 基于微信公众号实际支持的CSS属性列表
	 */
	private isWechatCompatibleProperty(property: string): boolean {
		// 微信确定不支持的属性（会被过滤）
		const incompatibleProperties = [
			// 定位相关（被过滤）
			'position',
			'z-index',
			'top', 'right', 'bottom', 'left',
			
			// 用户交互（被过滤）
			'user-select',
			'-webkit-user-select',
			'-moz-user-select',
			'-ms-user-select',
			'pointer-events',
			
			// 某些变换（部分被过滤，保守起见全部过滤）
			'transform-origin',
			
			// 动画相关（无法定义keyframes，所以无意义）
			'animation',
			'animation-name',
			'animation-duration',
			'animation-timing-function',
			'animation-delay',
			'animation-iteration-count',
			'animation-direction',
			'animation-fill-mode',
			'animation-play-state',
			
			// 过渡（可能被过滤）
			'transition',
			'transition-property',
			'transition-duration',
			'transition-timing-function',
			'transition-delay',
			
			// 高级滤镜（被过滤）
			'filter',
			'backdrop-filter',
			'mix-blend-mode',
			'clip-path',
			'mask',
			'mask-image',
			'mask-size',
			'mask-repeat',
			'mask-position',
			
			// 溢出控制（某些单位可能有问题）
			'overflow-x',
			'overflow-y'
		];
		
		// transform现在部分支持，但为了稳定性可以保留简单的transform
		if (property === 'transform') {
			return true; // 简单的transform可能支持
		}
		
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
	 * 将关键div转换为section标签（微信对section更宽松）
	 */
	private convertDivsToSections(container: HTMLElement): void {
		try {
			// 查找meta card相关的div元素
			const metaCardSelectors = [
				'.claude-meta-section',
				'.claude-meta-card',
				'.claude-meta-content',
				'.claude-meta-basic',
				'.claude-meta-recommendation',
				'.claude-meta-tags'
			];

			metaCardSelectors.forEach(selector => {
				const elements = container.querySelectorAll(selector);
				elements.forEach(element => {
					if (element.tagName.toLowerCase() === 'div') {
						const section = container.ownerDocument.createElement('section');
						
						// 复制所有属性
						Array.from(element.attributes).forEach(attr => {
							section.setAttribute(attr.name, attr.value);
						});
						
						// 复制内容
						section.innerHTML = element.innerHTML;
						
						// 替换元素
						element.replaceWith(section);
					}
				});
			});

			logger.debug("div转section完成");
		} catch (error) {
			logger.error("转换div为section时出错:", error);
		}
	}

	/**
	 * 为meta card结构添加保护性样式
	 */
	private protectMetaCardStructure(container: HTMLElement): void {
		try {
			// 保护meta section的显示
			const metaSection = container.querySelector('.claude-meta-section');
			if (metaSection) {
				const existingStyle = metaSection.getAttribute('style') || '';
				metaSection.setAttribute('style', existingStyle + 
					'; display: block !important; margin: 2em 8px 3em !important; clear: both !important;');
			}

			// 保护meta card的显示
			const metaCard = container.querySelector('.claude-meta-card');
			if (metaCard) {
				const existingStyle = metaCard.getAttribute('style') || '';
				metaCard.setAttribute('style', existingStyle + 
					'; display: block !important; background: rgba(200, 100, 66, 0.03) !important; border: 1px solid rgba(200, 100, 66, 0.15) !important; border-radius: 8px !important; padding: 1.5em !important; margin-bottom: 1.5em !important;');
			}

			// 保护meta content的显示
			const metaContent = container.querySelector('.claude-meta-content');
			if (metaContent) {
				const existingStyle = metaContent.getAttribute('style') || '';
				metaContent.setAttribute('style', existingStyle + 
					'; display: block !important; padding-left: 1em !important;');
			}

			// 保护meta basic的显示（改为垂直布局避免flex问题）
			const metaBasic = container.querySelector('.claude-meta-basic');
			if (metaBasic) {
				const existingStyle = metaBasic.getAttribute('style') || '';
				metaBasic.setAttribute('style', existingStyle + 
					'; display: block !important; margin-bottom: 1em !important; line-height: 1.8 !important;');
			}

			// 保护meta recommendation的显示
			const metaRecommendation = container.querySelector('.claude-meta-recommendation');
			if (metaRecommendation) {
				const existingStyle = metaRecommendation.getAttribute('style') || '';
				metaRecommendation.setAttribute('style', existingStyle + 
					'; display: block !important; margin-bottom: 1em !important; padding: 0.8em !important; background: rgba(200, 100, 66, 0.03) !important; border-radius: 4px !important;');
			}

			// 保护meta tags的显示
			const metaTags = container.querySelector('.claude-meta-tags');
			if (metaTags) {
				const existingStyle = metaTags.getAttribute('style') || '';
				metaTags.setAttribute('style', existingStyle + 
					'; display: block !important; line-height: 2 !important;');
			}

			logger.debug("meta card结构保护完成");
		} catch (error) {
			logger.error("保护meta card结构时出错:", error);
		}
	}

	/**
	 * 强化关键元素的样式权重
	 */
	private reinforceElementStyles(container: HTMLElement): void {
		try {
			// 强化meta items的样式
			const metaItems = container.querySelectorAll('.claude-meta-item');
			metaItems.forEach(item => {
				const htmlElement = item as HTMLElement;
				const existingStyle = htmlElement.getAttribute('style') || '';
				htmlElement.setAttribute('style', existingStyle + 
					'; display: inline-block !important; margin-right: 1em !important; margin-bottom: 0.5em !important; color: rgb(63, 63, 63) !important; font-size: 0.9em !important; font-weight: 500 !important;');
			});

			// 强化meta tags的样式
			const metaTagItems = container.querySelectorAll('.claude-meta-tag');
			metaTagItems.forEach(tag => {
				const htmlElement = tag as HTMLElement;
				const existingStyle = htmlElement.getAttribute('style') || '';
				htmlElement.setAttribute('style', existingStyle + 
					'; display: inline-block !important; margin-right: 0.5em !important; margin-bottom: 0.5em !important; background: rgba(200, 100, 66, 0.1) !important; color: rgb(200, 100, 66) !important; padding: 0.3em 0.8em !important; border-radius: 16px !important; font-size: 0.8em !important; font-weight: 500 !important; border: 1px solid rgba(200, 100, 66, 0.2) !important;');
			});

			// 强化meta text的样式
			const metaTexts = container.querySelectorAll('.claude-meta-text');
			metaTexts.forEach(text => {
				const htmlElement = text as HTMLElement;
				const existingStyle = htmlElement.getAttribute('style') || '';
				htmlElement.setAttribute('style', existingStyle + 
					'; display: block !important; color: rgb(63, 63, 63) !important; font-size: 0.9em !important; line-height: 1.5 !important; font-style: italic !important; margin: 0 !important;');
			});

			logger.debug("样式权重强化完成");
		} catch (error) {
			logger.error("强化样式权重时出错:", error);
		}
	}

	/**
	 * 预防微信的结构重组
	 */
	private preventStructureReorganization(container: HTMLElement): void {
		try {
			// 为关键容器添加微信识别的标记
			const metaContainers = container.querySelectorAll('.claude-meta-section, .claude-meta-card, .claude-meta-content');
			metaContainers.forEach(element => {
				const htmlElement = element as HTMLElement;
				// 添加微信可能识别的属性
				htmlElement.setAttribute('data-tools', 'lovpen-meta');
				htmlElement.setAttribute('data-color', 'rgb(200, 100, 66)');
			});

			// 为span元素添加换行控制
			const metaSpans = container.querySelectorAll('.claude-meta-item, .claude-meta-tag');
			metaSpans.forEach((span, index) => {
				const htmlElement = span as HTMLElement;
				// 在每个span后面添加空格或换行符，防止被合并
				if (span.nextSibling && span.nextSibling.nodeType === Node.TEXT_NODE) {
					span.nextSibling.textContent = ' ';
				} else {
					const textNode = container.ownerDocument.createTextNode(' ');
					span.after(textNode);
				}
			});

			logger.debug("结构重组预防完成");
		} catch (error) {
			logger.error("预防结构重组时出错:", error);
		}
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
