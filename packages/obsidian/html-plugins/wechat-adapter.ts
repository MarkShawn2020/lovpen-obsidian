import {NMPSettings} from "../settings";
import {logger} from "../../shared/src/logger";
import juice from 'juice'

import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/plugin/html-plugin";

/**
 * 微信公众号适配插件 - 根据微信公众号HTML/CSS支持约束进行适配
 * 主要功能：
 * 1. 链接转脚注处理
 * 2. 移除<style>标签，转换为内联样式（使用juice库）
 * 3. 清理微信不支持的CSS属性（position、id、transform等）
 * 4. 应用微信兼容的样式（使用px单位、避免复杂定位）
 * 5. 优化图片、表格、代码块等元素的显示
 *
 * 注意：
 * - CSS变量处理已移至插件系统层面，在所有插件执行前通过PostCSS预处理
 * - 本插件专注于juice内联化和微信平台特定的适配处理
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

			// 依次执行各个适配步骤
			console.log("📎 [微信插件] Step 1: 处理链接");
			// html = this.processLinks(html, settings);

			console.log("🎨 [微信插件] Step 2: 内联样式");
			html = this.inlineStyles(html, settings);

			html = this.processLinks(html, settings);
			//
			// console.log("🏗️ [微信插件] Step 3: 保持结构");
			// html = this.preserveStructure(html, settings);
			//
			// console.log("⚡ [微信插件] Step 4: 微信优化");
			// html = this.optimizeForWechat(html, settings);

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
	 * CSS样式内联化处理 - 使用juice库实现
	 * 将<style>标签中的CSS规则转换为元素的内联样式
	 */
	private inlineStyles(html: string, settings: NMPSettings): string {
		try {
			logger.debug("微信CSS内联化处理：使用juice库转换CSS为内联样式");

			// 检查是否有style标签需要处理
			if (!html.includes('<style')) {
				logger.debug("没有找到<style>标签，跳过内联化处理");
				return html;
			}

			// 使用juice库处理CSS内联化
			// 注意：CSS变量已在插件系统层面通过PostCSS预处理
			// juice需要处理完整的HTML文档，包括<style>标签和内容
			const processedHtml = juice(html, {
				removeStyleTags: true,           // 移除<style>标签
				inlinePseudoElements: true,
				// preserveMediaQueries: false,     // 不保留媒体查询（微信不支持）
				// applyWidthAttributes: false,    // 不应用width属性
				// xmlMode: false,                 // HTML模式
				// preserveImportant: true,        // 保留!important
				// insertPreservedExtraCss: false, // 不插入额外CSS
				// inlinePseudoElements: true,     // 内联伪元素
				// preservePseudos: false,         // 不保留伪类（微信不支持）
				// preserveFontFaces: false,       // 不保留@font-face（微信不支持）
				// preserveKeyFrames: false        // 不保留@keyframes（微信不支持）
			});

			// 后处理：清理微信不兼容的CSS属性
			// html = this.cleanIncompatibleStyles(processedHtml);
			
			// 修复标题内加粗文字颜色问题
			const cleanedHtml = this.fixHeadingStrongColors(processedHtml);

			logger.debug("微信CSS内联化完成");
			return cleanedHtml;
		} catch (error) {
			logger.error("CSS内联化处理出错:", error);
			return html;
		}
	}

	/**
	 * 修复标题内加粗文字的颜色问题
	 * 当H1或H2标题有背景色时，确保内部的strong/b标签文字颜色与标题保持一致
	 */
	private fixHeadingStrongColors(html: string): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 查找所有H1和H2标题
			const headings = container.querySelectorAll("h1, h2");
			
			headings.forEach((heading) => {
				const headingElement = heading as HTMLElement;
				const headingStyle = headingElement.getAttribute("style") || "";
				
				// 检查标题是否有背景色
				if (headingStyle.includes("background")) {
					// 获取标题的文字颜色
					const colorMatch = headingStyle.match(/(?<!background-)color:\s*([^;]+)/);
					const headingColor = colorMatch ? colorMatch[1].trim() : "";
					
					// 查找标题内的所有strong和b标签
					const strongElements = headingElement.querySelectorAll("strong, b");
					
					strongElements.forEach((elem) => {
						const strongElement = elem as HTMLElement;
						const currentStyle = strongElement.getAttribute("style") || "";
						
						// 移除原有的color样式，并添加与标题一致的颜色
						const styleWithoutColor = currentStyle.replace(/color:\s*[^;]+;?/g, "").trim();
						const newStyle = styleWithoutColor 
							? `${styleWithoutColor}; color: ${headingColor}`
							: `color: ${headingColor}`;
						
						strongElement.setAttribute("style", newStyle);
					});
				}
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("修复标题加粗文字颜色时出错:", error);
			return html;
		}
	}

}
