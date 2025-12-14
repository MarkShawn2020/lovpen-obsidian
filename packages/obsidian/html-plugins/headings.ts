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
		// 迁移旧配置到新配置
		if (currentConfig.headingNumberTemplate !== undefined && currentConfig.headingNumberStyle === undefined) {
			const template = String(currentConfig.headingNumberTemplate);
			// 尝试从旧模板推断样式
			if (template.includes('{chinese}')) {
				defaultConfig.headingNumberStyle = 'chinese';
				defaultConfig.headingNumberFormat = template.replace('{chinese}', '{}');
			} else if (template.includes('{roman}')) {
				defaultConfig.headingNumberStyle = 'roman';
				defaultConfig.headingNumberFormat = template.replace('{roman}', '{}');
			} else if (template.includes('{letter}')) {
				defaultConfig.headingNumberStyle = 'letter';
				defaultConfig.headingNumberFormat = template.replace('{letter}', '{}');
			} else if (template.includes('{number}')) {
				defaultConfig.headingNumberStyle = 'number';
				defaultConfig.headingNumberFormat = template.replace('{number}', '{}');
			} else {
				defaultConfig.headingNumberStyle = 'index';
				defaultConfig.headingNumberFormat = template.replace('{index}', '{}');
			}
			// 删除旧配置
			delete currentConfig.headingNumberTemplate;
		}
		if (currentConfig.headingNumberStyle === undefined) {
			defaultConfig.headingNumberStyle = 'index';
		}
		if (currentConfig.headingNumberFormat === undefined) {
			defaultConfig.headingNumberFormat = '{}';
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
				title: "启用编号",
				description: "为二级标题自动添加序号"
			},
			headingNumberStyle: {
				type: "select",
				title: "编号样式",
				description: "选择序号的显示格式",
				options: [
					{ value: "index", text: "普通数字 (1, 2, 3)" },
					{ value: "number", text: "带前导零 (01, 02, 03)" },
					{ value: "chinese", text: "中文数字 (一, 二, 三)" },
					{ value: "chinese-traditional", text: "繁体中文 (壹, 貳, 參)" },
					{ value: "circle", text: "圆圈数字 (①, ②, ③)" },
					{ value: "parenthesis", text: "括号数字 (⑴, ⑵, ⑶)" },
					{ value: "fullwidth", text: "全角数字 (１, ２, ３)" },
					{ value: "ordinal", text: "英文序数 (1st, 2nd, 3rd)" },
					{ value: "roman", text: "大写罗马 (I, II, III)" },
					{ value: "roman-lower", text: "小写罗马 (i, ii, iii)" },
					{ value: "letter", text: "大写字母 (A, B, C)" },
					{ value: "letter-lower", text: "小写字母 (a, b, c)" }
				]
			},
			headingNumberFormat: {
				type: "text",
				title: "编号格式",
				description: "{} 代表编号位置，如: 第{}章、Part {}、{}.",
				placeholder: "{}"
			},
			enableHeadingDelimiterBreak: {
				type: "switch",
				title: "分隔符换行",
				description: "遇到逗号等分隔符时自动换行"
			},
			headingDelimiters: {
				type: "text",
				title: "分隔符",
				description: "触发换行的字符，如: ,，、；：空格"
			},
			keepDelimiterInOutput: {
				type: "switch",
				title: "保留分隔符",
				description: "换行后是否保留原分隔符"
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
		// 获取配置
		const config = this.getConfig();
		const style = String(config.headingNumberStyle || "index");
		const format = String(config.headingNumberFormat || "{}");
		
		// 根据样式选择转换方法
		let numberText: string;
		switch (style) {
			case "number":
				numberText = (index + 1).toString().padStart(2, "0");
				break;
			case "chinese":
				numberText = this.toChineseNumber(index + 1);
				break;
			case "chinese-traditional":
				numberText = this.toChineseTraditional(index + 1);
				break;
			case "circle":
				numberText = this.toCircleNumber(index + 1);
				break;
			case "parenthesis":
				numberText = this.toParenthesisNumber(index + 1);
				break;
			case "fullwidth":
				numberText = this.toFullwidthNumber(index + 1);
				break;
			case "ordinal":
				numberText = this.toOrdinal(index + 1);
				break;
			case "roman":
				numberText = this.toRoman(index + 1);
				break;
			case "roman-lower":
				numberText = this.toRoman(index + 1).toLowerCase();
				break;
			case "letter":
				numberText = this.toLetter(index + 1);
				break;
			case "letter-lower":
				numberText = this.toLetter(index + 1).toLowerCase();
				break;
			case "index":
			default:
				numberText = (index + 1).toString();
				break;
		}
		
		// 将编号插入到格式模板中
		let formattedText = format.replace("{}", numberText);

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
	
	/**
	 * 将数字转换为中文数字（一、二、三...）
	 */
	private toChineseNumber(num: number): string {
		const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
		const units = ['', '十', '百', '千', '万'];
		
		// 特殊处理0-10
		if (num === 0) return '零';
		if (num <= 10) {
			return ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][num];
		}
		
		// 处理11-19
		if (num < 20) {
			return '十' + digits[num - 10];
		}
		
		// 处理20-99
		if (num < 100) {
			const tens = Math.floor(num / 10);
			const ones = num % 10;
			if (ones === 0) {
				return digits[tens] + '十';
			}
			return digits[tens] + '十' + digits[ones];
		}
		
		// 处理100-999
		if (num < 1000) {
			const hundreds = Math.floor(num / 100);
			const remainder = num % 100;
			let result = digits[hundreds] + '百';
			
			if (remainder === 0) {
				return result;
			} else if (remainder < 10) {
				// 需要加"零"
				return result + '零' + digits[remainder];
			} else if (remainder < 20) {
				// 一百一十到一百一十九
				if (remainder === 10) {
					return result + '一十';
				}
				return result + '一十' + digits[remainder - 10];
			} else {
				// 一百二十到一百九十九
				const tens = Math.floor(remainder / 10);
				const ones = remainder % 10;
				if (ones === 0) {
					return result + digits[tens] + '十';
				}
				return result + digits[tens] + '十' + digits[ones];
			}
		}
		
		// 超过999的数字，返回阿拉伯数字
		return num.toString();
	}
	
	/**
	 * 将数字转换为繁体中文数字（壹、貳、參...）
	 */
	private toChineseTraditional(num: number): string {
		const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
		
		// 特殊处理0-10
		if (num === 0) return '零';
		if (num <= 10) {
			return ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖', '拾'][num];
		}
		
		// 处理11-19
		if (num < 20) {
			return '拾' + digits[num - 10];
		}
		
		// 处理20-99
		if (num < 100) {
			const tens = Math.floor(num / 10);
			const ones = num % 10;
			if (ones === 0) {
				return digits[tens] + '拾';
			}
			return digits[tens] + '拾' + digits[ones];
		}
		
		// 处理100-999
		if (num < 1000) {
			const hundreds = Math.floor(num / 100);
			const remainder = num % 100;
			let result = digits[hundreds] + '佰';
			
			if (remainder === 0) {
				return result;
			} else if (remainder < 10) {
				// 需要加"零"
				return result + '零' + digits[remainder];
			} else if (remainder < 20) {
				// 壹佰壹拾到壹佰壹拾玖
				if (remainder === 10) {
					return result + '壹拾';
				}
				return result + '壹拾' + digits[remainder - 10];
			} else {
				// 壹佰貳拾到壹佰玖拾玖
				const tens = Math.floor(remainder / 10);
				const ones = remainder % 10;
				if (ones === 0) {
					return result + digits[tens] + '拾';
				}
				return result + digits[tens] + '拾' + digits[ones];
			}
		}
		
		// 超过999的数字，返回阿拉伯数字
		return num.toString();
	}
	
	/**
	 * 将数字转换为圆圈数字（①②③...）
	 */
	private toCircleNumber(num: number): string {
		if (num >= 1 && num <= 20) {
			// Unicode 圆圈数字 ① 到 ⑳
			return String.fromCharCode(0x2460 + num - 1);
		}
		// 超过20的返回带括号的数字
		return `(${num})`;
	}
	
	/**
	 * 将数字转换为带括号数字（⑴⑵⑶...）
	 */
	private toParenthesisNumber(num: number): string {
		if (num >= 1 && num <= 20) {
			// Unicode 括号数字 ⑴ 到 ⒇
			return String.fromCharCode(0x2474 + num - 1);
		}
		// 超过20的返回带括号的数字
		return `(${num})`;
	}
	
	/**
	 * 将数字转换为全角数字（１２３...）
	 */
	private toFullwidthNumber(num: number): string {
		const str = num.toString();
		let result = '';
		for (let i = 0; i < str.length; i++) {
			const digit = parseInt(str[i]);
			if (!isNaN(digit)) {
				// 全角数字０到９
				result += String.fromCharCode(0xFF10 + digit);
			} else {
				result += str[i];
			}
		}
		return result;
	}
	
	/**
	 * 将数字转换为英文序数词（1st, 2nd, 3rd...）
	 */
	private toOrdinal(num: number): string {
		const lastTwoDigits = num % 100;
		const lastDigit = num % 10;
		
		// 特殊处理 11, 12, 13
		if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
			return num + 'th';
		}
		
		// 根据最后一位数字决定后缀
		switch (lastDigit) {
			case 1:
				return num + 'st';
			case 2:
				return num + 'nd';
			case 3:
				return num + 'rd';
			default:
				return num + 'th';
		}
	}
}
