import {UniversalPluginMetaConfig} from "../shared/plugin/plugin-config-manager";


import {logger} from "../../shared/src/logger";

import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/plugin/html-plugin";

/**
 * 标题处理插件 - 处理微信公众号中的标题格式
 * 根据设置实现以下功能：
 * 1. 添加序号: 当启用时，将标题序号作为标题内容插入
 * 2. 分隔符换行: 当启用时，遇到逗号等分隔符自动换行
 */
export class Headings extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "标题处理插件";
	}

	getPluginDescription(): string {
		return "标题处理插件，支持添加标题序号和分隔符换行功能";
	}

	/**
	 * 获取插件配置的元数据
	 * @returns 插件配置的元数据
	 */
	getMetaConfig(): UniversalPluginMetaConfig {
		return {
			enableHeadingNumber: {
				type: "switch",
				title: "启用编号"
			},
			enableHeadingDelimiterBreak: {
				type: "switch",
				title: "启用分隔符自动换行"
			}
		};
	}

	process(html: string): string {
		try {
			// 使用插件自己的配置而非全局设置
			const config = this.getConfig();
			const needProcessNumber = config.enableHeadingNumber;
			const needProcessDelimiter = config.enableHeadingDelimiterBreak;
			logger.debug({needProcessNumber, needProcessDelimiter})

			if (needProcessDelimiter || needProcessNumber) {
				const parser = new DOMParser();
				const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
				const container = doc.body.firstChild as HTMLElement;

				container.querySelectorAll("h2").forEach((h2, index) => {
					// 获取标题内容容器
					const contentSpan = h2.querySelector(".content");

					if (contentSpan) {
						// 将标题居中显示
						h2.style.textAlign = "center";

						// 1. 处理分隔符换行
						if (needProcessDelimiter) {
							this.processHeadingDelimiters(contentSpan);
						}

						// 2. 处理标题序号
						if (needProcessNumber) {
							this.processHeadingNumber(contentSpan, index);
						}
					}
				});
				return container.innerHTML;
			}

			return html;
		} catch (error) {
			logger.error("处理二级标题时出错:", error);
			return html;
		}
	}

	private processHeadingNumber(contentSpan: Element, index: number) {
		// 格式化编号为两位数 01, 02, 03...
		const number = (index + 1).toString().padStart(2, "0");

		// 创建序号元素
		const numberSpan = contentSpan.ownerDocument.createElement("span");
		numberSpan.setAttribute("leaf", "");

		// 设置样式
		numberSpan.setAttribute("style", "font-size: 48px; ");
		numberSpan.textContent = number;

		// 将序号添加到标题内容开头
		const wrapper = contentSpan.ownerDocument.createElement("span");
		wrapper.setAttribute("textstyle", "");
		wrapper.appendChild(numberSpan);

		// 添加换行
		const breakElement = contentSpan.ownerDocument.createElement("br");

		// 插入到内容容器的开头，注意插入顺序非常重要
		// 先插入序号（应该位于第一行）
		contentSpan.insertBefore(wrapper, contentSpan.firstChild);
		// 再插入换行（压在序号下面）
		contentSpan.insertBefore(
			breakElement,
			contentSpan.childNodes[1] || null
		);
	}

	/**
	 * 处理标题中的分隔符，在分隔符后添加换行
	 * @param element 要处理的元素或容器
	 */
	private processHeadingDelimiters(element: Element): void {
		try {
			// 分隔符正则表达式 - 匹配逗号、页、分号、冒号等常见分隔符
			const delimiterRegex = /[,，、；：;:|]/g;

			// 获取所有文本节点
			const walker = document.createTreeWalker(
				element,
				NodeFilter.SHOW_TEXT,
				null
			);

			const nodesToProcess: { node: Node; matches: RegExpMatchArray[] }[] = [];

			// 收集所有包含分隔符的文本节点
			let textNode = walker.nextNode() as Text;
			while (textNode) {
				const content = textNode.nodeValue || '';
				const matches = Array.from(content.matchAll(delimiterRegex));

				if (matches.length > 0) {
					nodesToProcess.push({node: textNode, matches});
				}

				textNode = walker.nextNode() as Text;
			}

			// 从后向前处理节点，这样不会影响尚未处理的节点位置
			for (let i = nodesToProcess.length - 1; i >= 0; i--) {
				const {node, matches} = nodesToProcess[i];
				const text = node.nodeValue || '';

				// 从后向前处理每个匹配，避免影响偏移量
				for (let j = matches.length - 1; j >= 0; j--) {
					const match = matches[j];
					if (!match.index && match.index !== 0) continue;

					// 在分隔符后添加换行
					const beforeDelimiter = text.slice(0, match.index + 1);
					const afterDelimiter = text.slice(match.index + 1);

					// 创建分隔符之前的文本节点
					const beforeNode = document.createTextNode(beforeDelimiter);
					// 创建换行元素
					const brElement = document.createElement('br');
					// 创建分隔符之后的文本节点
					const afterNode = document.createTextNode(afterDelimiter);

					// 替换原来的节点
					const parent = node.parentNode;
					if (parent) {
						parent.insertBefore(beforeNode, node);
						parent.insertBefore(brElement, node);
						parent.insertBefore(afterNode, node);
						parent.removeChild(node);

						// 更新节点值，为后续处理做准备
						node.nodeValue = afterDelimiter;
					}
				}
			}
		} catch (error) {
			logger.error("处理标题分隔符时出错:", error);
		}
	}
}
