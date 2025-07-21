import {NMPSettings} from "../settings";


import {logger} from "../../shared/src/logger";

import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/plugin/html-plugin";

/**
 * 列表处理插件 - 处理微信公众号中的列表格式，特别是嵌套列表
 * 微信公众号编辑器对嵌套列表支持不好，需要特殊处理
 */
export class Lists extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "列表处理插件";
	}

	getPluginDescription(): string {
		return "列表格式处理，特别优化微信公众号中的嵌套列表显示效果";
	}

	process(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 找到所有的列表
			const allLists = Array.from(container.querySelectorAll("ul, ol"));
			if (allLists.length === 0) {
				return html; // 没有列表，直接返回
			}

			// 找到所有顶级列表（不在其他列表内的列表）
			const topLevelLists = allLists.filter((list) => {
				const parent = list.parentElement;
				return (
					parent &&
					parent.tagName !== "LI" &&
					parent.tagName !== "UL" &&
					parent.tagName !== "OL"
				);
			});

			// 创建一个新容器来接收转换后的列表
			const tempContainer = container.ownerDocument.createElement("div");

			const themeAccentColor = this.getThemeColor(settings);

			// 处理每个顶级列表
			for (const list of topLevelLists) {
				// 转换原列表为微信兼容格式
				const newList = this.transformList(
					list as HTMLUListElement,
					0,
					themeAccentColor
				);

				// 找到原列表的位置
				const parent = list.parentElement;
				if (parent) {
					// 使用转换后的列表替换原列表
					parent.replaceChild(newList, list);
				} else {
					// 添加到容器
					tempContainer.appendChild(newList);
				}
			}

			// 如果有直接添加到容器的列表，返回容器内容
			if (tempContainer.children.length > 0) {
				return tempContainer.innerHTML;
			}

			return container.innerHTML;
		} catch (error) {
			logger.error("处理列表时出错:", error);
			return html;
		}
	}

	/**
	 * 转换列表为微信兼容格式
	 * @param list 要转换的列表元素
	 * @param level 嵌套层级
	 * @param themeAccentColor 主题强调色
	 */
	private transformList(
		list: HTMLUListElement | HTMLOListElement,
		level = 0,
		themeAccentColor = ""
	): HTMLUListElement {
		const isOrdered = list.tagName.toLowerCase() === "ol";

		// 创建新的微信格式列表
		const newList = document.createElement(isOrdered ? "ol" : "ul");

		// 设置微信所需的列表样式
		newList.className = "list-paddingleft-1";

		// 针对不同级别设置不同的样式
		let listStyleType;
		if (isOrdered) {
			listStyleType = "decimal"; // 数字导航符号
		} else {
			switch (level) {
				case 0:
					listStyleType = "square";
					break; // 外层列表用空心圆
				case 1:
					listStyleType = "disc";
					break; // 中间层用实心圆
				default:
					listStyleType = "circle";
					break; // 最内层用方块
			}
		}

		// 微信文章中的列表设置
		newList.style.listStyleType = listStyleType;
		newList.style.padding = "0 0 0 1em";
		newList.style.margin = "0.5em 0";

		// 存储嵌套列表，稍后处理
		interface NestedListInfo {
			parentItem: HTMLLIElement;
			list: HTMLUListElement | HTMLOListElement;
		}

		const nestedLists: NestedListInfo[] = [];

		// 处理列表项
		const listItems = Array.from(list.querySelectorAll(":scope > li"));
		for (const item of listItems) {
			// 获取原始列表项的颜色（如果有）
			const originalColor = window.getComputedStyle(list).color;
			// logger.info("item: ", item, "color: ", originalColor)

			// 创建新的列表项
			const newItem = document.createElement("li");

			// 查找并存储任何嵌套列表
			const childLists = Array.from(
				item.querySelectorAll(":scope > ul, :scope > ol")
			);
			for (const childList of childLists) {
				nestedLists.push({
					parentItem: newItem,
					list: childList as HTMLUListElement | HTMLOListElement,
				});
				// 从原列表项中移除嵌套列表
				childList.remove();
			}

			// 为列表项符号设置颜色
			// 无论是否启用了自定义主题色，都需要设置颜色
			// 否则微信公众号中的列表标记将始终为默认黑色
			newItem.style.color = themeAccentColor; // 这会影响列表符号的颜色

			// 创建微信格式的内容容器
			const section = document.createElement("section");

			// 对于列表内容，我们需要明确指定颜色还原到文本颜色
			// 使用CSS变量来自动调整文本颜色，而非硬编码
			section.style.color = "var(--text-secondary, currentColor)";

			// 获取列表项的文本内容
			section.innerHTML = item.innerHTML;

			// 添加到新列表项
			newItem.appendChild(section);
			newList.appendChild(newItem);
		}

		// 处理嵌套列表
		for (const {parentItem, list: childList} of nestedLists) {
			// 递归转换子列表
			const newChildList = this.transformList(
				childList,
				level + 1,
				themeAccentColor
			);

			// 在父列表项后添加嵌套列表直接作为父列表的子元素
			// 注意：微信编辑器要求嵌套列表不要放在父列表项内部
			const parentIndex = Array.from(newList.children).indexOf(
				parentItem
			);
			if (
				parentIndex !== -1 &&
				parentIndex < newList.children.length - 1
			) {
				newList.insertBefore(
					newChildList,
					newList.children[parentIndex + 1]
				);
			} else {
				newList.appendChild(newChildList);
			}
		}

		return newList;
	}
}
