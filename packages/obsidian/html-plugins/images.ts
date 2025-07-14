import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";
import {UniversalPluginMetaConfig} from "../shared/plugin-config-manager";

import {logger} from "../../shared/src/logger";

/**
 * 图片处理插件 - 处理微信公众号中的图片格式
 * 根据设置实现以下功能：
 * 1. 显示图片说明: 当启用时，将alt属性内容显示为可见的caption
 * 2. 添加data-src属性: 微信编辑器需要
 * 3. 设置图片样式和对齐方式
 */
export class Images extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "图片处理插件";
	}

	getPluginDescription(): string {
		return "处理微信公众号中的图片格式，包括添加data-src属性、设置图片样式和控制图片说明显示";
	}

	/**
	 * 获取插件配置的元数据
	 * @returns 插件配置的元数据
	 */
	getMetaConfig(): UniversalPluginMetaConfig {
		return {
			showImageCaption: {
				type: "switch",
				title: "显示图片说明"
			}
		};
	}

	process(html: string, settings: NMPSettings): string {
		// 微信公众号图片需要特定处理
		// 1. 添加data-src属性
		// 2. 确保图片有正确的样式和对齐方式
		// 3. 根据设置控制caption显示
		try {
			// 使用插件自己的配置而非全局设置
			const config = this.getConfig();
			const showImageCaption = config.showImageCaption !== false; // 默认显示

			logger.debug("图片处理插件开始处理，showImageCaption设置:", showImageCaption);
			logger.debug("处理前的HTML片段:", html.substring(0, 500) + "...");
			
			// 创建一个临时容器来解析HTML片段，避免丢失样式
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 查找所有图片元素
			const images = container.querySelectorAll("img");
			logger.debug("找到图片数量:", images.length);

			images.forEach((img, index) => {
				const src = img.getAttribute("src");
				const alt = img.getAttribute("alt");
				const title = img.getAttribute("title");

				logger.debug(`处理第${index + 1}张图片:`, {
					src: src?.substring(0, 50) + "...",
					alt,
					title,
					outerHTML: img.outerHTML.substring(0, 100) + "..."
				});

				if (src) {
					// 设置data-src属性，微信编辑器需要
					img.setAttribute("data-obsidian", src);

					// 设置图片默认样式
					if (!img.hasAttribute("style")) {
						img.setAttribute(
							"style",
							"max-width: 100%; height: auto;"
						);
					}

					// 确保图片居中显示
					const parent = img.parentElement;
					if (parent && parent.tagName !== "CENTER") {
						parent.style.textAlign = "center";
					}

					// 处理图片说明文字
					const figureParent = img.closest("figure");
					let figcaption = null;
					if (figureParent) {
						figcaption = figureParent.querySelector("figcaption");
					}

					logger.debug(`第${index + 1}张图片父元素信息:`, {
						parentTagName: parent?.tagName,
						hasFigureParent: !!figureParent,
						hasFigcaption: !!figcaption,
						figcaptionText: figcaption?.textContent
					});

					if (!showImageCaption) {
						logger.debug(`隐藏第${index + 1}张图片的说明文字`);
						// 移除alt属性以隐藏说明文字
						img.removeAttribute("alt");
						img.removeAttribute("title");

						// 查找并移除可能的caption元素
						if (figcaption) {
							figcaption.remove();
							logger.debug(`移除了第${index + 1}张图片的figcaption`);
						}
					} else {
						logger.debug(`保持第${index + 1}张图片的说明文字显示`);

						// 如果有alt属性但没有figcaption，创建caption显示
						if (alt && alt.trim() && !figcaption) {
							logger.debug(`为第${index + 1}张图片创建可见的caption`);

							// 创建一个段落元素，使用与现有内容相似的结构
							const captionP = container.ownerDocument.createElement("p");
							captionP.setAttribute("style",
								"text-align: center !important; " +
								"color: #666666 !important; " +
								"font-size: 14px !important; " +
								"margin-top: 8px !important; " +
								"margin-bottom: 8px !important; " +
								"font-style: italic !important; " +
								"line-height: 1.5 !important; " +
								"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;"
							);

							// 创建span元素，使用leaf属性（符合现有结构）
							const captionSpan = container.ownerDocument.createElement("span");
							captionSpan.setAttribute("leaf", "");
							captionSpan.setAttribute("style",
								"color: #666666 !important; " +
								"font-style: italic !important; " +
								"font-size: 14px !important;"
							);
							captionSpan.textContent = alt;

							captionP.appendChild(captionSpan);

							// 将caption插入到图片后面
							if (parent) {
								parent.insertBefore(captionP, img.nextSibling);
							}
						}
					}
				}
			});

			const result = container.innerHTML;
			logger.debug("图片处理完成，结果长度:", result.length);
			logger.debug("处理后的HTML片段:", result.substring(0, 500) + "...");
			return result;
		} catch (error) {
			logger.error("处理图片时出错:", error);
			return html;
		}
	}
}
