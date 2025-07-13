import {Platform, requestUrl} from "obsidian";

import {logger} from "../shared/src/logger";

let PluginVersion = "0.0.0";
let PlugPlatform = "obsidian";

export function setVersion(version: string) {
	PluginVersion = version;
	if (Platform.isWin) {
		PlugPlatform = "win";
	} else if (Platform.isMacOS) {
		PlugPlatform = "mac";
	} else if (Platform.isLinux) {
		PlugPlatform = "linux";
	} else if (Platform.isIosApp) {
		PlugPlatform = "ios";
	} else if (Platform.isAndroidApp) {
		PlugPlatform = "android";
	}
}

function getStyleSheet() {
	for (var i = 0; i < document.styleSheets.length; i++) {
		var sheet = document.styleSheets[i];
		if (sheet.title == "lovpen-style") {
			return sheet;
		}
	}
}

function applyStyles(
	element: HTMLElement,
	styles: CSSStyleDeclaration,
	computedStyle: CSSStyleDeclaration
) {
	for (let i = 0; i < styles.length; i++) {
		const propertyName = styles[i];
		let propertyValue = computedStyle.getPropertyValue(propertyName);
		if (
			propertyName == "width" &&
			styles.getPropertyValue(propertyName) == "fit-content"
		) {
			propertyValue = "fit-content";
		}
		if (
			propertyName.indexOf("margin") >= 0 &&
			styles.getPropertyValue(propertyName).indexOf("auto") >= 0
		) {
			propertyValue = styles.getPropertyValue(propertyName);
		}
		element.style.setProperty(propertyName, propertyValue);
	}
}

function parseAndApplyStyles(element: HTMLElement, sheet: CSSStyleSheet) {
	try {
		const computedStyle = getComputedStyle(element);
		for (let i = 0; i < sheet.cssRules.length; i++) {
			const rule = sheet.cssRules[i];
			if (
				rule instanceof CSSStyleRule &&
				element.matches(rule.selectorText)
			) {
				applyStyles(element, rule.style, computedStyle);
			}
		}
	} catch (e) {
		console.warn("Unable to access stylesheet: " + sheet.href, e);
	}
}

function traverse(root: HTMLElement, sheet: CSSStyleSheet) {
	let element = root.firstElementChild;
	while (element) {
		if (element.tagName === "svg") {
			// pass
		} else {
			traverse(element as HTMLElement, sheet);
		}
		element = element.nextElementSibling;
	}
	parseAndApplyStyles(root, sheet);
}

export async function CSSProcess(content: HTMLElement) {
	// 获取样式表
	const style = getStyleSheet();
	if (style) {
		traverse(content, style);
	}
}

export function parseCSS(css: string) {
	// 简化版本，返回原始 CSS 字符串
	// 如果需要更复杂的 CSS 解析，可以考虑添加 postcss 依赖
	return css;
}

export function ruleToStyle(rule: any) {
	// 简化版本，直接返回字符串
	return rule?.toString() || "";
}

function applyStyle(root: HTMLElement, css: string) {
	// 简化版本，直接使用 style 标签应用样式
	const styleEl = document.createElement("style");
	styleEl.textContent = css;

	// 将样式应用到文档头部
	if (!document.head.querySelector(`style[data-utils-css]`)) {
		styleEl.setAttribute('data-utils-css', 'true');
		document.head.appendChild(styleEl);
	}
}

export function applyCSS(root: HTMLElement, css: string) {
	// const doc = sanitizeHTMLToDom(html);
	// const root = doc.firstChild as HTMLElement;
	// logger.info("applyCSS", css);

	// 这种方式会导致样式应用问题，我们采用另一种策略
	// const cssRoot = postcss.parse(css);
	// applyStyle(root, cssRoot);

	// 获取常规样式 - 使用现有的DOM API
	// 这样保持了模板功能的正常工作
	const styles = document.createElement("div");
	styles.style.display = "none";
	document.body.appendChild(styles);

	// 应用样式到临时元素
	const styleEl = document.createElement("style");
	styleEl.textContent = css;
	styles.appendChild(styleEl);

	// 获取计算样式并应用到元素
	const allElements = root.querySelectorAll("*");
	for (let i = 0; i < allElements.length; i++) {
		// logger.info(`applyCSS [${i}]`, allElements[i]);	 
		const el = allElements[i] as HTMLElement;
		const computedStyle = window.getComputedStyle(el);
		let inlineStyles = "";

		// 提取关键样式属性
		const properties = [
			"color",
			"background-color",
			"font-family",
			"font-size",
			"font-weight",
			"line-height",
			"text-align",
			"margin",
			"padding",
			"border",
			"border-radius",
			// todo: it's not supported indeed
			"position",
		];

		for (const prop of properties) {
			const value = computedStyle.getPropertyValue(prop);
			if (value) {
				inlineStyles += `${prop}:${value};`;
			}
		}

		if (inlineStyles) {
			el.setAttribute(
				"style",
				(el.getAttribute("style") || "") + inlineStyles
			);
		}
	}

	// 清理临时元素
	document.body.removeChild(styles);

	// 提取CSS变量并包含在输出中 - 这是关键修复
	const variableStyles = extractCSSVariables(css);
	if (variableStyles) {
		logger.info("提取的CSS变量:", variableStyles.length, "bytes");
		return `<style>${variableStyles}</style>${root.outerHTML}`;
	}

	return root.outerHTML;
}

/**
 * 从CSS字符串中提取CSS变量
 * 专门处理:root和@media规则中的变量定义
 */
function extractCSSVariables(css: string): string {
	try {
		// 使用正则表达式提取 CSS 变量
		let cssVars = "";

		// 提取 :root 规则
		const rootRuleRegex = /:root\s*\{[^}]+\}/g;
		const rootMatches = css.match(rootRuleRegex);
		if (rootMatches) {
			cssVars += rootMatches.join("\n") + "\n";
		}

		// 提取包含 :root 的 @media 规则
		const mediaRuleRegex = /@media[^{]+\{[^{}]*:root\s*\{[^}]+\}[^}]*\}/g;
		const mediaMatches = css.match(mediaRuleRegex);
		if (mediaMatches) {
			cssVars += mediaMatches.join("\n") + "\n";
		}

		return cssVars;
	} catch (e) {
		logger.error("提取CSS变量失败:", e);
		return "";
	}
}

export function uevent(name: string) {
	const url = `https://u.sunboshi.tech/event?name=${name}&platform=${PlugPlatform}&v=${PluginVersion}`;
	requestUrl(url)
		.then()
		.catch((error) => {
			console.error("Failed to send event: " + url, error);
		});
}

