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
				// 确保表格有正确的微信样式
				table.style.borderCollapse = "collapse";
				table.style.width = "100%";
				table.style.marginBottom = "20px";

				// 处理表头
				const thead = table.querySelector("thead");
				if (thead) {
					const headerCells = thead.querySelectorAll("th");
					headerCells.forEach((cell) => {
						cell.style.backgroundColor = "#f2f2f2";
						cell.style.padding = "8px";
						cell.style.borderBottom = "2px solid #ddd";
						cell.style.textAlign = "left";
						cell.style.fontWeight = "bold";
					});
				}

				// 处理表格单元格
				const cells = table.querySelectorAll("td");
				cells.forEach((cell, index) => {
					cell.style.padding = "8px";
					cell.style.border = "1px solid #ddd";
					cell.style.textAlign = "left";

					// 隔行变色
					if (index % 2 === 0) {
						const row = cell.parentElement;
						if (row) {
							row.style.backgroundColor = "#f9f9f9";
						}
					}
				});
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理表格时出错:", error);
			return html;
		}
	}
}
