import {HtmlPlugin as UnifiedHtmlPlugin} from "../shared/unified-plugin-system";
import {NMPSettings} from "../settings";
import {logger} from "../../shared/src/logger";
import AssetsManager, {Highlight} from "../assets";

/**
 * 微信公众号卡片数据管理器
 */
export class CardDataManager {
	private static instance: CardDataManager;
	private cardData: Map<string, string>;

	private constructor() {
		this.cardData = new Map<string, string>();
	}

	public static getInstance(): CardDataManager {
		if (!CardDataManager.instance) {
			CardDataManager.instance = new CardDataManager();
		}
		return CardDataManager.instance;
	}

	public setCardData(id: string, cardData: string): void {
		this.cardData.set(id, cardData);
	}

	public cleanup(): void {
		this.cardData.clear();
	}

	public restoreCard(html: string): string {
		const entries = Array.from(this.cardData.entries());
		for (const [key, value] of entries) {
			const exp = `<section[^>]*\\\\sdata-id="${key}"[^>]*>(.*?)<\\\\/section>`;
			const regex = new RegExp(exp, "gs");
			if (!regex.test(html)) {
				logger.warn(`未能正确替换公众号卡片: ${key}`);
			}
			html = html.replace(regex, value);
		}
		return html;
	}
}

/**
 * 代码块处理插件 - 专注于Obsidian内部的代码块渲染优化
 */
export class CodeBlocks extends UnifiedHtmlPlugin {
	getPluginName(): string {
		return "代码块处理插件";
	}

	getPluginDescription(): string {
		return "优化代码块在Obsidian内部的显示效果，支持行号和语法高亮";
	}

	/**
	 * 获取插件配置的元数据
	 */
	getMetaConfig() {
		return {
			showLineNumbers: {
				type: "switch" as const,
				title: "显示行号"
			},
			highlightStyle: {
				type: "select" as const,
				title: "代码高亮样式",
				options: this.getHighlightOptions()
			},
			macWindow: {
				type: "switch" as const,
				title: "Mac 风格窗口"
			}
		};
	}

	process(html: string, settings: NMPSettings): string {
		try {
			// 首先处理微信公众号卡片恢复
			html = CardDataManager.getInstance().restoreCard(html);

			const parser = new DOMParser();
			const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
			const container = doc.body.firstChild as HTMLElement;

			// 查找所有代码块
			const codeBlocks = container.querySelectorAll("pre code");

			// 获取插件配置
			const showLineNumbers = this.getShowLineNumbersConfig();
			const highlightStyle = this.getHighlightStyleConfig();
			const macWindow = this.getMacWindowConfig();

			codeBlocks.forEach((codeBlock) => {
				const pre = codeBlock.parentElement;
				if (!pre) return;

				// 渲染代码块
				this.renderCodeBlock(pre, codeBlock as HTMLElement, showLineNumbers, highlightStyle, macWindow, settings);
			});

			return container.innerHTML;
		} catch (error) {
			logger.error("处理代码块时出错:", error);
			return html;
		}
	}

	/**
	 * 获取高亮样式选项（从 highlights.json 动态读取）
	 */
	private getHighlightOptions() {
		const options = [
			{value: "none", text: "无高亮"}
		];

		// 从 AssetsManager 获取所有可用的高亮样式
		const assetsManager = this.getAssetsManager();
		if (!assetsManager || !assetsManager.highlights) {
			throw new Error("无法获取高亮样式配置，AssetsManager 不可用");
		}

		// 使用Set去重，避免重复的value导致React键重复警告
		const seenValues = new Set<string>();
		seenValues.add("none");

		assetsManager.highlights.forEach((highlight: Highlight) => {
			if (!seenValues.has(highlight.name)) {
				seenValues.add(highlight.name);
				options.push({
					value: highlight.name,
					text: this.formatHighlightName(highlight.name)
				});
			}
		});

		return options;
	}

	/**
	 * 格式化高亮样式名称显示
	 */
	private formatHighlightName(name: string): string {
		// 将 kebab-case 转换为更友好的显示名称
		return name
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	/**
	 * 获取 AssetsManager 实例
	 */
	private getAssetsManager(): AssetsManager | null {
		return AssetsManager.getInstance();
	}

	/**
	 * 获取行号显示配置
	 */
	private getShowLineNumbersConfig(): boolean {
		return this.getConfig().showLineNumbers as boolean ?? false;
	}

	/**
	 * 获取代码高亮样式配置
	 */
	private getHighlightStyleConfig(): string {
		return this.getConfig().highlightStyle as string ?? "默认";
	}

	/**
	 * 获取 Mac 窗口装饰配置
	 */
	private getMacWindowConfig(): boolean {
		return this.getConfig().macWindow as boolean ?? false;
	}

	/**
	 * 渲染代码块 - 单一函数处理所有渲染逻辑
	 *
	 * 转换步骤：
	 * 1. 提取代码内容和语言
	 * 2. 处理语法高亮
	 * 3. 添加行号（如果启用）
	 * 4. 添加 Mac 风格装饰（如果启用）
	 * 5. 应用样式
	 * 6. 设置元数据
	 */
	private renderCodeBlock(pre: HTMLElement, codeElement: HTMLElement, showLineNumbers: boolean, highlightStyle: string, macWindow: boolean, settings: NMPSettings): void {
		// 步骤1: 提取代码内容和语言
		const codeContent = codeElement.textContent || codeElement.innerText || '';
		const language = this.extractLanguage(codeElement);

		// 步骤2: 处理语法高亮
		let processedContent = codeContent;
		if (highlightStyle !== "none") {
			// 保持现有的高亮HTML结构（如果存在）
			processedContent = codeElement.innerHTML;
			// 更新全局高亮样式设置并触发重新渲染
			this.updateGlobalHighlightStyle(highlightStyle, settings);
		} else {
			// 移除高亮，使用纯文本
			processedContent = codeContent;
		}

		// 步骤3: 添加行号（如果启用）
		if (showLineNumbers) {
			processedContent = this.addLineNumbersToHighlightedCode(processedContent);
		}

		// 步骤4: 添加 Mac 风格装饰（如果启用）
		if (macWindow) {
			this.wrapWithMacWindow(pre, language);
		}

		// 步骤5: 应用样式
		this.applyCodeBlockStyles(pre, codeElement, showLineNumbers, highlightStyle);

		// 步骤6: 设置处理后的内容
		codeElement.innerHTML = processedContent;

		// 步骤7: 设置元数据
		this.setMetadata(pre, language, showLineNumbers, highlightStyle);

		logger.debug(`代码块渲染完成: 语言=${language}, 行号=${showLineNumbers}, 高亮=${highlightStyle}`);
	}

	/**
	 * 提取语言标识
	 */
	private extractLanguage(codeElement: HTMLElement): string {
		const classList = Array.from(codeElement.classList);
		for (const className of classList) {
			if (className.startsWith('language-')) {
				return className.replace('language-', '');
			}
		}
		return 'text';
	}

	/**
	 * 为已高亮的代码添加行号，处理 shiki 和 hljs 不同的结构
	 */
	private addLineNumbersToHighlightedCode(content: string): string {
		// 检查是否是 shiki 生成的内容（包含 .line span）
		const isShikiContent = content.includes('<span class="line">');

		if (isShikiContent) {
			// 处理 shiki 生成的内容
			return this.addLineNumbersToShikiContent(content);
		} else {
			// 处理传统的 hljs 内容
			return this.addLineNumbersToHljsContent(content);
		}
	}

	/**
	 * 为 shiki 内容添加行号
	 */
	private addLineNumbersToShikiContent(content: string): string {
		// shiki 已经将每行包装在 <span class="line"> 中
		let lineNumber = 1;
		return content.replace(/<span class="line">/g, () => {
			const lineNumberSpan = `<span class="line-number" style="color: var(--text-faint); display: inline-block; width: 2.5em; text-align: right; padding-right: 1em; margin-right: 0.5em; border-right: 1px solid var(--background-modifier-border); user-select: none; font-variant-numeric: tabular-nums;">${lineNumber}</span>`;
			lineNumber++;
			return lineNumberSpan + '<span class="line">';
		});
	}

	/**
	 * 为 hljs 内容添加行号
	 */
	private addLineNumbersToHljsContent(content: string): string {
		// 清理首尾换行符
		content = content.replace(/^\n+/, '').replace(/\n+$/, '');

		const lines = content.split("\n");
		const numberedLines = lines.map((line, index) => {
			const lineNumber = index + 1;
			const lineNumberSpan = `<span class="line-number" style="color: var(--text-faint); display: inline-block; width: 2.5em; text-align: right; padding-right: 1em; margin-right: 0.5em; border-right: 1px solid var(--background-modifier-border); user-select: none;">${lineNumber}</span>`;
			return lineNumberSpan + line;
		}).join("\n");

		return numberedLines;
	}

	/**
	 * 应用代码块样式
	 */
	private applyCodeBlockStyles(pre: HTMLElement, codeElement: HTMLElement, showLineNumbers: boolean, highlightStyle: string): void {
		console.debug(`applyCodeBlockStyles: `, {highlightStyle});

		// 检查是否是 Mac 窗口样式
		const isMacWindow = pre.classList.contains('mac-code-window');

		// 应用主题背景色（从自定义主题获取）
		const themeColors = this.getThemeColors(highlightStyle);
		pre.style.background = themeColors.background;
		pre.style.color = themeColors.foreground;

		// 根据是否为 Mac 窗口设置不同的 padding
		if (isMacWindow) {
			// Mac 窗口需要为标题栏留出空间，保持紧凑布局
			pre.style.padding = "40px 12px 8px 12px"; // 顶部40px为标题栏留空间，其他边更紧凑
		} else {
			// 普通代码块使用紧凑的 padding
			pre.style.padding = "8px 12px 8px 12px"; // 更紧凑的四边padding
		}

		// 通用样式设置
		pre.style.margin = "0";
		pre.style.fontSize = "14px";
		pre.style.lineHeight = "1.4";
		// pre.style.fontFamily = cssVariables.fontMonospace;
		pre.style.borderRadius = "8px";
		pre.style.border = `1px solid rgba(200, 100, 66, 0.2)`;
		pre.style.whiteSpace = "pre";
		pre.style.overflowX = "auto";
		pre.style.position = isMacWindow ? "relative" : "static";

		// Code 元素样式
		codeElement.style.background = "transparent";
		codeElement.style.padding = "0 0 16px 0"; // 底部16px padding为横向滚动条留出空间
		codeElement.style.margin = "0";
		codeElement.style.border = "none";
		codeElement.style.borderRadius = "0";
		codeElement.style.fontSize = "inherit";
		codeElement.style.lineHeight = "inherit";
		codeElement.style.fontFamily = "inherit";
		codeElement.style.whiteSpace = "pre";
		codeElement.style.display = "block";
		codeElement.style.color = "inherit";
	}

	/**
	 * 根据主题名称获取主题颜色 - 标准化实现
	 * 支持：1) 从shiki主题JSON提取 2) 从AssetsManager获取 3) 智能默认值
	 */
	private getThemeColors(highlightStyle: string): { background: string, foreground: string } {
		try {
			// 1. 尝试从shiki主题提取颜色
			const shikiColors = this.extractShikiThemeColors(highlightStyle);
			if (shikiColors) {
				return shikiColors;
			}

			// 2. 从AssetsManager获取高亮样式并解析颜色
			const assetsColors = this.extractAssetsThemeColors(highlightStyle);
			if (assetsColors) {
				return assetsColors;
			}

			// 3. 智能默认值（基于主题名称的亮暗判定）
			return this.getDefaultThemeColors(highlightStyle);
		} catch (error) {
			logger.warn(`获取主题颜色失败: ${highlightStyle}`, error);
			return this.getDefaultThemeColors(highlightStyle);
		}
	}

	/**
	 * 从shiki主题JSON中提取全局颜色
	 */
	private extractShikiThemeColors(themeName: string): { background: string, foreground: string } | null {
		try {
			// 尝试从文件系统直接读取主题JSON
			const themeColors = this.loadShikiThemeFromFile(themeName);
			if (themeColors) {
				return themeColors;
			}
		} catch (error) {
			logger.debug(`shiki主题颜色提取失败: ${themeName}`, error);
		}
		return null;
	}

	/**
	 * 从文件系统动态加载shiki主题JSON
	 */
	private loadShikiThemeFromFile(themeName: string): { background: string, foreground: string } | null {
		try {
			const assetsManager = this.getAssetsManager();
			if (!assetsManager) return null;

			// 尝试从assets/themes/目录读取主题JSON文件
			const themeFilePath = `${assetsManager.themesPath}${themeName}.json`;
			
			// 这是异步操作，但我们需要同步返回，所以使用缓存机制
			// 实际应该重构为异步方法，但现在先返回null让其他方法处理
			return null;
		} catch (error) {
			logger.debug(`动态加载shiki主题失败: ${themeName}`, error);
		}
		return null;
	}

	/**
	 * 从AssetsManager的高亮样式中提取颜色
	 */
	private extractAssetsThemeColors(highlightStyle: string): { background: string, foreground: string } | null {
		try {
			const assetsManager = this.getAssetsManager();
			if (!assetsManager) return null;

			const highlight = assetsManager.getHighlight(highlightStyle);
			if (!highlight || !highlight.css) return null;

			// 从CSS中提取背景色和前景色
			return this.parseColorsFromCSS(highlight.css);
		} catch (error) {
			logger.debug(`AssetsManager主题颜色提取失败: ${highlightStyle}`, error);
		}
		return null;
	}

	/**
	 * 从CSS文本中解析背景色和前景色
	 */
	private parseColorsFromCSS(css: string): { background: string, foreground: string } | null {
		try {
			// 查找.hljs或类似的根选择器
			const backgroundMatch = css.match(/\.hljs[^{]*\{[^}]*background[^:]*:\s*([^;]+);/i);
			const colorMatch = css.match(/\.hljs[^{]*\{[^}]*color[^:]*:\s*([^;]+);/i);

			if (backgroundMatch && colorMatch) {
				return {
					background: backgroundMatch[1].trim(),
					foreground: colorMatch[1].trim()
				};
			}
		} catch (error) {
			logger.debug('CSS颜色解析失败', error);
		}
		return null;
	}

	/**
	 * 获取智能默认颜色（基于亮暗判定）
	 */
	private getDefaultThemeColors(highlightStyle: string): { background: string, foreground: string } {
		const isDark = this.isThemeDark(highlightStyle);
		
		return {
			background: isDark ? "#2d2d2d" : "#f6f6f6",
			foreground: isDark ? "#d8dee9" : "#2e3440"
		};
	}

	/**
	 * 标准化的主题亮暗判定
	 * 支持：1) 名称模式匹配 2) 颜色亮度计算
	 */
	private isThemeDark(themeIdentifier: string | { background: string }): boolean {
		// 如果传入的是颜色对象，基于背景色亮度判定
		if (typeof themeIdentifier === 'object') {
			return this.isColorDark(themeIdentifier.background);
		}

		// 基于名称模式匹配
		const themeName = themeIdentifier.toLowerCase();
		const darkKeywords = ['dark', 'night', 'black', 'shadow', 'obsidian', 'midnight', 'carbon'];
		
		return darkKeywords.some(keyword => themeName.includes(keyword));
	}

	/**
	 * 基于RGB值计算颜色亮度，判定是否为深色
	 */
	private isColorDark(color: string): boolean {
		try {
			// 处理hex颜色
			if (color.startsWith('#')) {
				const hex = color.replace('#', '');
				const r = parseInt(hex.substr(0, 2), 16);
				const g = parseInt(hex.substr(2, 2), 16);
				const b = parseInt(hex.substr(4, 2), 16);
				
				// 使用相对亮度公式
				const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
				return luminance < 0.5;
			}
			
			// 处理rgb/rgba颜色
			const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
			if (rgbMatch) {
				const r = parseInt(rgbMatch[1]);
				const g = parseInt(rgbMatch[2]);
				const b = parseInt(rgbMatch[3]);
				
				const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
				return luminance < 0.5;
			}
		} catch (error) {
			logger.debug('颜色亮度计算失败', error);
		}
		
		// 默认返回false（浅色）
		return false;
	}


	/**
	 * 更新全局高亮样式设置并触发重新渲染
	 */
	private updateGlobalHighlightStyle(highlightStyle: string, settings: NMPSettings): void {
		// 只有当插件配置的高亮样式与全局设置不同时才更新
		if (settings.defaultHighlight !== highlightStyle) {
			settings.defaultHighlight = highlightStyle;
			logger.debug(`已更新全局高亮样式为: ${highlightStyle}`);

			// 触发设置保存，确保React组件能够重新渲染
			this.triggerSettingsUpdate(settings);
		}
	}

	/**
	 * 触发设置更新，确保React组件重新渲染
	 */
	private triggerSettingsUpdate(settings: NMPSettings): void {
		try {
			// 获取主插件实例并触发设置保存
			const app = (window as any).app;
			if (app && app.plugins && app.plugins.plugins) {
				const plugin = app.plugins.plugins["lovpen"];
				if (plugin && typeof plugin.saveSettings === "function") {
					plugin.saveSettings();
					logger.debug("已触发插件设置保存，将重新渲染React组件");
				}
			}
		} catch (error) {
			logger.error("触发设置更新失败:", error);
		}
	}

	/**
	 * 用 CSS-based Mac 风格装饰代码块
	 */
	private wrapWithMacWindow(pre: HTMLElement, language: string): void {
		// 添加 Mac 风格的 CSS 类
		pre.classList.add('mac-code-window');
		pre.setAttribute('data-language', language || 'code');

		// 创建内联样式以支持伪元素
		this.addMacWindowStyles();

		// 添加语言标签 DOM 元素
		this.addLanguageLabel(pre, language);
	}

	/**
	 * 添加语言标签 DOM 元素
	 */
	private addLanguageLabel(pre: HTMLElement, language: string): void {
		// 检查是否已经有语言标签
		const existingLabel = pre.querySelector('.mac-code-language-label');
		if (existingLabel) {
			existingLabel.remove();
		}

		if (language && language !== 'text') {
			const label = document.createElement('span');
			label.className = 'mac-code-language-label';
			label.textContent = language.toUpperCase();
			label.style.cssText = `
				position: absolute;
				top: 8px;
				right: 12px;
				color: #666;
				font-size: 11px;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
				font-weight: 500;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				z-index: 3;
				pointer-events: none;
			`;

			// 深色主题调整
			if (pre.style.background?.includes('#141413') ||
				pre.getAttribute('data-highlight-style')?.includes('dark')) {
				label.style.color = '#a0a0a0';
			}

			pre.appendChild(label);
		}
	}

	/**
	 * 添加 Mac 窗口的 CSS 样式
	 */
	private addMacWindowStyles(): void {
		// 检查是否已经添加过样式
		if (document.getElementById('mac-code-window-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'mac-code-window-styles';
		style.textContent = `
			.mac-code-window {
				position: relative !important;
				border-radius: 8px !important;
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
				overflow: visible !important;
			}

			/* 标题栏背景 */
			.mac-code-window::before {
				content: '' !important;
				position: absolute !important;
				top: 0 !important;
				left: 0 !important;
				right: 0 !important;
				height: 32px !important;
				background: linear-gradient(180deg, #e8e8e8 0%, #d5d5d5 100%) !important;
				border-radius: 8px 8px 0 0 !important;
				border-bottom: 1px solid #c0c0c0 !important;
				z-index: 10 !important;
				pointer-events: none !important;
			}

			/* 交通灯按钮 */
			.mac-code-window::after {
				content: '' !important;
				position: absolute !important;
				top: 10px !important;
				left: 12px !important;
				width: 52px !important;
				height: 12px !important;
				background-image: 
					radial-gradient(circle 6px at 6px 6px, #ff5f57 100%, transparent 100%),
					radial-gradient(circle 6px at 26px 6px, #ffbd2e 100%, transparent 100%),
					radial-gradient(circle 6px at 46px 6px, #28ca42 100%, transparent 100%) !important;
				background-size: 52px 12px !important;
				background-repeat: no-repeat !important;
				z-index: 11 !important;
				pointer-events: none !important;
			}

			/* 深色主题调整 */
			.mac-code-window[data-highlight-style*="dark"]::before,
			.mac-code-window[style*="background: rgb(20, 20, 19)"]::before,
			.mac-code-window[style*="background: #141413"]::before {
				background: linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%) !important;
				border-bottom: 1px solid #2a2a2a !important;
			}

			/* 确保代码内容不被标题栏遮挡 */
			.mac-code-window code {
				position: relative !important;
				z-index: 5 !important;
			}

			/* 自定义横向滚动条样式 */
			.mac-code-window::-webkit-scrollbar,
			pre[data-code-block="true"]::-webkit-scrollbar {
				height: 12px;
			}

			.mac-code-window::-webkit-scrollbar-track,
			pre[data-code-block="true"]::-webkit-scrollbar-track {
				background: transparent;
				border: 4px solid transparent;
				background-clip: content-box;
				border-radius: 8px;
			}

			.mac-code-window::-webkit-scrollbar-thumb,
			pre[data-code-block="true"]::-webkit-scrollbar-thumb {
				background-color: rgba(0, 0, 0, 0.2);
				border-radius: 8px;
				border: 2px solid transparent;
				background-clip: content-box;
			}

			.mac-code-window::-webkit-scrollbar-thumb:hover,
			pre[data-code-block="true"]::-webkit-scrollbar-thumb:hover {
				background-color: rgba(0, 0, 0, 0.3);
			}

			/* 深色主题滚动条调整 */
			.mac-code-window[data-highlight-style*="dark"]::-webkit-scrollbar-thumb,
			pre[data-code-block="true"][data-highlight-style*="dark"]::-webkit-scrollbar-thumb {
				background-color: rgba(255, 255, 255, 0.3);
			}

			.mac-code-window[data-highlight-style*="dark"]::-webkit-scrollbar-thumb:hover,
			pre[data-code-block="true"][data-highlight-style*="dark"]::-webkit-scrollbar-thumb:hover {
				background-color: rgba(255, 255, 255, 0.4);
			}
		`;

		document.head.appendChild(style);

		// 强制刷新样式
		setTimeout(() => {
			const elements = document.querySelectorAll('.mac-code-window');
			elements.forEach(el => {
				(el as HTMLElement).style.display = 'block';
			});
		}, 10);
	}

	/**
	 * 设置元数据属性
	 */
	private setMetadata(pre: HTMLElement, language: string, showLineNumbers: boolean, highlightStyle: string): void {
		pre.setAttribute('data-code-block', 'true');
		pre.setAttribute('data-language', language);
		pre.setAttribute('data-show-line-numbers', showLineNumbers.toString());
		pre.setAttribute('data-highlight-style', highlightStyle);
	}

	/**
	 * 将CSS变量解析为实际值，用于微信等不支持CSS变量的环境
	 */
	private resolveCSSVariables(highlightStyle: string): {
		fontMonospace: string;
		borderColor: string;
		codeBackground: string;
		codeNormal: string;
	} {
		// 使用标准化的亮暗判定
		const isDark = this.isThemeDark(highlightStyle);

		return {
			// 等宽字体
			fontMonospace: "'JetBrains Mono', 'Source Code Pro', 'Monaco', 'Consolas', 'Courier New', monospace",

			// 边框颜色
			borderColor: isDark ? "#3a3a3a" : "#e1e1e1",

			// 代码块背景色
			codeBackground: isDark ? "#2d2d2d" : "#f6f6f6",

			// 代码文本颜色
			codeNormal: isDark ? "#d8dee9" : "#2e3440"
		};
	}

}
