import {NMPSettings} from "../settings";


import {logger} from "../../shared/src/logger";

import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/plugin/html-plugin";

/**
 * 表格处理插件 - 处理微信公众号中的表格格式
 */
export class Tables extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "表格处理插件";
	}

	getPluginDescription(): string {
		return "表格格式处理，优化微信公众号中的表格显示";
	}

	process(html: string, settings: NMPSettings): string {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 查找所有表格
			const tables = container.querySelectorAll("table");

			tables.forEach((table) => {
				// 为每个表格创建一个wrapper div，用于移动端横向滚动
				const wrapper = doc.createElement("div");
				wrapper.className = "table-wrapper";
				
				// 将表格包裹在wrapper中
				const parent = table.parentNode;
				if (parent) {
					parent.insertBefore(wrapper, table);
					wrapper.appendChild(table);
				}

				// 移除旧的内联样式，让CSS来控制样式
				// 只保留必要的属性
				table.removeAttribute("style");
				
				// 清理表头单元格的内联样式
				const headerCells = table.querySelectorAll("th");
				headerCells.forEach((cell) => {
					cell.removeAttribute("style");
				});

				// 清理表格单元格的内联样式
				const cells = table.querySelectorAll("td");
				cells.forEach((cell) => {
					cell.removeAttribute("style");
				});

				// 清理行的内联样式
				const rows = table.querySelectorAll("tr");
				rows.forEach((row) => {
					row.removeAttribute("style");
				});
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理表格时出错:", error);
			return html;
		}
	}
}
