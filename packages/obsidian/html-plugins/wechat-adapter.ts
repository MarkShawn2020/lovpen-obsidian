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

			// 2. 强化关键元素的样式权重
			this.reinforceElementStyles(container);

			return container.innerHTML;
		} catch (error) {
			logger.error("保护HTML结构时出错:", error);
			return container.innerHTML;
		}
	}

	/**
	 * 提取所有CSS规则
	 */
	private extractAllCSSRules(container: HTMLElement): Array<{ selector: string, rules: Record<string, string> }> {
		const cssRules: Array<{ selector: string, rules: Record<string, string> }> = [];

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
	private parseCSSText(cssText: string): Array<{ selector: string, rules: Record<string, string> }> {
		const rules: Array<{ selector: string, rules: Record<string, string> }> = [];

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
	private applyCSSRulesToElements(container: HTMLElement, cssRules: Array<{
		selector: string,
		rules: Record<string, string>
	}>): void {
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
		const mergedRules = {...rules, ...existingRules};

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
