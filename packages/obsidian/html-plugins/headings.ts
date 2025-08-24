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
	constructor() {
		super();
		// 获取当前配置
		const currentConfig = this.getConfigManager().getConfig();
		// 只为未定义的配置项设置默认值
		const defaultConfig: any = {};
		if (currentConfig.enableHeadingNumber === undefined) {
			defaultConfig.enableHeadingNumber = false;
		}
		if (currentConfig.headingNumberTemplate === undefined) {
			defaultConfig.headingNumberTemplate = "{number}";
		}
		if (currentConfig.enableHeadingDelimiterBreak === undefined) {
			defaultConfig.enableHeadingDelimiterBreak = true;  // 默认启用分隔符换行功能
		}
		if (currentConfig.headingDelimiters === undefined) {
			defaultConfig.headingDelimiters = ",，、；：;:| ";
		}
		if (currentConfig.keepDelimiterInOutput === undefined) {
			defaultConfig.keepDelimiterInOutput = true;
		}
		// 如果有需要设置的默认值，更新配置
		if (Object.keys(defaultConfig).length > 0) {
			this.getConfigManager().updateConfig(defaultConfig);
		}
	}

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
			headingNumberTemplate: {
				type: "text",
				title: "编号模板 (如: 第{number}章, Part {index}, {roman})"
			},
			enableHeadingDelimiterBreak: {
				type: "switch",
				title: "启用分隔符自动换行"
			},
			headingDelimiters: {
				type: "text",
				title: "自定义分隔符 (如: ,，、；： 空格)"
			},
			keepDelimiterInOutput: {
				type: "switch",
				title: "保留分隔符"
			}
		};
	}

	process(html: string): string {
		try {
			// 使用插件自己的配置而非全局设置
			const config = this.getConfig();
			const needProcessNumber = config.enableHeadingNumber;
			const needProcessDelimiter = config.enableHeadingDelimiterBreak;
			
			logger.info(`[标题处理插件] 配置状态:`, {
				pluginEnabled: config.enabled,
				enableHeadingNumber: needProcessNumber,
				enableHeadingDelimiterBreak: needProcessDelimiter,
				headingDelimiters: config.headingDelimiters || ",，、；：;:| ",
				keepDelimiterInOutput: config.keepDelimiterInOutput
			});

			if (needProcessDelimiter || needProcessNumber) {
				logger.info(`[标题处理插件] 开始处理标题 (分隔符处理=${needProcessDelimiter}, 编号处理=${needProcessNumber})`);
				const parser = new DOMParser();
				const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
				const container = doc.body.firstChild as HTMLElement;

				container.querySelectorAll("h2").forEach((h2, index) => {
					// 获取标题内容容器
					const contentSpan = h2.querySelector(".content");

					if (contentSpan) {
						// 将标题居中显示
						h2.style.textAlign = "center";
						
						logger.debug(`Processing h2[${index}], content: "${contentSpan.textContent}"`);

						// 1. 处理分隔符换行
						if (needProcessDelimiter) {
							logger.debug(`Processing delimiters for h2[${index}]`);
							this.processHeadingDelimiters(contentSpan);
						}

						// 2. 处理标题序号
						if (needProcessNumber) {
							logger.debug(`Processing number for h2[${index}]`);
							this.processHeadingNumber(contentSpan, index);
						}
					}
				});
				return container.innerHTML;
			} else {
				logger.info(`[标题处理插件] 所有功能均未启用，跳过处理`);
			}

			return html;
		} catch (error) {
			logger.error("处理二级标题时出错:", error);
			return html;
		}
	}

	private processHeadingNumber(contentSpan: Element, index: number) {
		// 获取配置的模板，默认为 "{number}"
		const config = this.getConfig();
		const template = String(config.headingNumberTemplate || "{number}");
		
		// 准备各种格式的值
		const number = (index + 1).toString().padStart(2, "0");
		const indexValue = (index + 1).toString();
		const roman = this.toRoman(index + 1);
		const letter = this.toLetter(index + 1);
		
		// 替换模板中的占位符
		let formattedText = template
			.replace("{number}", number)
			.replace("{index}", indexValue)
			.replace("{roman}", roman)
			.replace("{letter}", letter);

		// 创建序号元素
		const numberSpan = contentSpan.ownerDocument.createElement("span");
		numberSpan.setAttribute("leaf", "");

		// 设置样式
		numberSpan.setAttribute("style", "font-size: 48px; ");
		numberSpan.textContent = formattedText;

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
			// 获取配置的分隔符
			const config = this.getConfig();
			const delimiters = String(config.headingDelimiters || ",，、；：;:| ");
			const keepDelimiter = config.keepDelimiterInOutput !== false;
			
			logger.debug(`Delimiter config: delimiters="${delimiters}", keepDelimiter=${keepDelimiter}`);
			
			// 转义特殊正则字符并构建正则表达式
			const escapedDelimiters = delimiters.split('').map(char => {
				// 转义正则特殊字符 (包括在字符类中有特殊含义的字符)
				return char.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
			}).join('');
			
			const delimiterRegex = new RegExp(`[${escapedDelimiters}]`, 'g');
			logger.debug(`Delimiter regex pattern: [${escapedDelimiters}]`);

			// 获取所有文本节点
			const walker = element.ownerDocument.createTreeWalker(
				element,
				NodeFilter.SHOW_TEXT,
				null
			);

			const textNodes: Text[] = [];
			let textNode = walker.nextNode() as Text;
			while (textNode) {
				textNodes.push(textNode);
				textNode = walker.nextNode() as Text;
			}
			
			logger.debug(`Found ${textNodes.length} text nodes to process`);

			// 处理每个文本节点
			for (const node of textNodes) {
				const originalText = node.nodeValue || '';
				logger.debug(`Processing text node: "${originalText}"`);
				
				// 查找所有分隔符
				const matches = Array.from(originalText.matchAll(delimiterRegex));
				if (matches.length === 0) {
					continue;
				}
				
				logger.debug(`Found ${matches.length} delimiters in text`);
				
				// 构建新的节点片段
				const parent = node.parentNode;
				if (!parent) continue;
				
				const doc = element.ownerDocument;
				let lastIndex = 0;
				const fragment = doc.createDocumentFragment();
				
				// 处理每个分隔符
				for (const match of matches) {
					const matchIndex = match.index!;
					const delimiter = match[0];
					
					// 添加分隔符前的文本
					if (keepDelimiter) {
						// 保留分隔符：分隔符跟在前面的文本后
						const beforeText = originalText.slice(lastIndex, matchIndex + 1);
						if (beforeText) {
							fragment.appendChild(doc.createTextNode(beforeText));
						}
					} else {
						// 不保留分隔符：只添加分隔符前的文本
						const beforeText = originalText.slice(lastIndex, matchIndex);
						if (beforeText) {
							fragment.appendChild(doc.createTextNode(beforeText));
						}
					}
					
					// 添加换行
					fragment.appendChild(doc.createElement('br'));
					
					// 更新位置到分隔符后
					lastIndex = matchIndex + 1;
				}
				
				// 添加最后剩余的文本
				const remainingText = originalText.slice(lastIndex);
				if (remainingText) {
					fragment.appendChild(doc.createTextNode(remainingText));
				}
				
				// 替换原节点
				parent.replaceChild(fragment, node);
				logger.debug(`Replaced text node with ${matches.length} line breaks`);
			}
		} catch (error) {
			logger.error("处理标题分隔符时出错:", error);
		}
	}
	
	/**
	 * 将数字转换为罗马数字
	 */
	private toRoman(num: number): string {
		const romanNumerals: [number, string][] = [
			[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
			[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
			[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
		];
		
		let result = '';
		for (const [value, symbol] of romanNumerals) {
			while (num >= value) {
				result += symbol;
				num -= value;
			}
		}
		return result;
	}
	
	/**
	 * 将数字转换为字母（A, B, C...AA, AB...）
	 */
	private toLetter(num: number): string {
		let result = '';
		while (num > 0) {
			num--; // 调整为0索引
			result = String.fromCharCode(65 + (num % 26)) + result;
			num = Math.floor(num / 26);
		}
		return result;
	}
}
