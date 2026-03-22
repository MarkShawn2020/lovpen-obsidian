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

			// 获取主题色
			const themeColor = this.getThemeColor(settings);

			// 查找所有表格
			const tables = container.querySelectorAll("table");

			tables.forEach((table) => {
				// 设置表格的内联样式 - 使用固定颜色确保dark mode兼容性
				// 不使用wrapper，让表格直接适应容器宽度，确保左右对称
				table.setAttribute("style", `
					width: 100%;
					border-collapse: separate;
					border-spacing: 0;
					border-radius: 8px;
					overflow: hidden;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
					background: rgb(255, 255, 255);
					border: 1px solid rgba(200, 100, 66, 0.2);
					font-size: 14px;
					margin: 1.5em auto;
					display: table;
				`);
				
				// 设置表头单元格的内联样式 - 统一padding确保对称
				const headerCells = table.querySelectorAll("th");
				headerCells.forEach((cell) => {
					cell.setAttribute("style", `
						padding: 12px 16px;
						text-align: left;
						background: ${themeColor};
						color: rgb(255, 255, 255) !important;
						font-weight: 600;
						font-size: 13px;
						border-bottom: 1px solid rgba(200, 100, 66, 0.3);
					`);
				});

				// 设置表格单元格的内联样式 - 统一padding确保对称
				const rows = table.querySelectorAll("tr");
				rows.forEach((row, rowIndex) => {
					const cells = row.querySelectorAll("td");
					const isEven = rowIndex % 2 === 0;
					
					cells.forEach((cell) => {
						const isLastRow = rowIndex === rows.length - 1;
						
						cell.setAttribute("style", `
							padding: 10px 16px;
							text-align: left;
							color: rgb(51, 51, 51) !important;
							background: ${isEven ? 'rgba(200, 100, 66, 0.02)' : 'rgb(255, 255, 255)'};
							${!isLastRow ? 'border-bottom: 1px solid rgba(200, 100, 66, 0.1);' : ''}
						`);
					});
				});

				// 处理表格内的链接和其他元素，确保颜色固定
				const links = table.querySelectorAll("a");
				links.forEach((link) => {
					link.setAttribute("style", `color: ${themeColor} !important; text-decoration: underline;`);
				});

				// 处理表格内的代码元素
				const codes = table.querySelectorAll("code");
				codes.forEach((code) => {
					code.setAttribute("style", `
						color: rgb(51, 51, 51) !important;
						background: rgba(200, 100, 66, 0.08) !important;
						padding: 2px 6px;
						border-radius: 3px;
						font-size: 0.9em;
					`);
				});

				// 处理表格内的强调元素
				const strongs = table.querySelectorAll("strong, b");
				strongs.forEach((strong) => {
					const currentStyle = strong.getAttribute("style") || "";
					strong.setAttribute("style", `${currentStyle} color: rgb(51, 51, 51) !important; font-weight: bold;`);
				});

				// 处理表格内的斜体元素
				const ems = table.querySelectorAll("em, i");
				ems.forEach((em) => {
					const currentStyle = em.getAttribute("style") || "";
					em.setAttribute("style", `${currentStyle} color: rgb(51, 51, 51) !important; font-style: italic;`);
				});
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理表格时出错:", error);
			return html;
		}
	}
}
