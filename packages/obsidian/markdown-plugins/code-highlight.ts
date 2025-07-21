import {createHighlighter} from "shiki";
import {MarkedExtension} from "marked";
import {markedHighlight} from "marked-highlight";
import {CodeRenderer} from "./code";

import {logger} from "../../shared/src/logger";
import anthropicLight from "../../assets/themes/anthropic-light.json";
import anthropicDark from "../../assets/themes/anthropic-dark.json";
import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

export class CodeHighlight extends UnifiedMarkdownPlugin {
	private highlighter: any = null;
	private customThemes = new Map([
		['anthropic-light', anthropicLight],
		['anthropic-dark', anthropicDark]
	]);

	getPluginName(): string {
		return "CodeHighlight";
	}

	getPluginDescription(): string {
		return "代码语法高亮处理，使用shiki为代码块添加语法着色和内联CSS";
	}

	async initializeHighlighter() {
		if (!this.highlighter) {
			// 准备主题列表：基础主题 + 自定义主题
			const baseThemes = ['github-light', 'github-dark'];
			const customThemeObjects = Array.from(this.customThemes.values());
			
			this.highlighter = await createHighlighter({
				themes: [...baseThemes, ...customThemeObjects],
				langs: []
			});
			
			logger.debug('Shiki 初始化完成，已加载主题:', [...baseThemes, ...Array.from(this.customThemes.keys())]);
		}
	}

	async loadTheme(theme: string) {
		if (!this.highlighter) {
			await this.initializeHighlighter();
		}
		
		try {
			const loadedThemes = this.highlighter.getLoadedThemes();
			if (loadedThemes.includes(theme)) {
				return; // 主题已加载
			}

			// 检查是否是自定义主题
			if (this.customThemes.has(theme)) {
				logger.debug(`主题 ${theme} 已在初始化时加载`);
				return;
			}

			// 尝试加载内置主题
			await this.highlighter.loadTheme(theme);
			logger.debug(`成功加载内置主题: ${theme}`);
		} catch (err) {
			logger.warn(`无法加载主题 ${theme}:`, err);
		}
	}

	async loadLanguage(lang: string) {
		if (!this.highlighter) {
			await this.initializeHighlighter();
		}
		
		try {
			const loadedLangs = this.highlighter.getLoadedLanguages();
			if (!loadedLangs.includes(lang)) {
				await this.highlighter.loadLanguage(lang);
			}
		} catch (err) {
			logger.warn(`无法加载语言 ${lang}:`, err);
		}
	}

	/**
	 * 从设置中获取主题配置，智能处理 hljs 和 shiki 主题
	 */
	private getThemeFromSettings(): string {
		const defaultHighlight = this.settings?.defaultHighlight || '默认';
		
		// 优先检查是否是自定义主题
		if (this.customThemes.has(defaultHighlight)) {
			logger.debug(`使用自定义主题: ${defaultHighlight}`);
			return defaultHighlight;
		}
		
		// 验证主题是否存在于现有系统中
		const hljsTheme = this.findThemeInAssets(defaultHighlight);
		if (!hljsTheme) {
			logger.warn(`未找到主题: ${defaultHighlight}，使用默认主题`);
			return 'github-light';
		}
		
		// 智能映射到 shiki 主题
		const shikiTheme = this.mapHljsToShiki(hljsTheme.name);
		logger.debug(`主题映射: ${defaultHighlight} -> ${shikiTheme}`);
		return shikiTheme;
	}

	/**
	 * 在现有资源系统中查找主题
	 */
	private findThemeInAssets(themeName: string) {
		const highlights = this.assetsManager?.highlights || [];
		return highlights.find(h => h.name === themeName);
	}

	/**
	 * 从 shiki 生成的完整 HTML 中提取纯代码内容
	 * 避免与 marked 的 pre/code 结构产生嵌套
	 */
	private extractCodeContent(shikiHtml: string): string {
		try {
			// 使用 DOMParser 解析 shiki 生成的 HTML
			const parser = new DOMParser();
			const doc = parser.parseFromString(shikiHtml, 'text/html');
			
			// 查找 shiki 生成的 code 元素
			const codeElement = doc.querySelector('pre code');
			if (codeElement) {
				// 返回 code 标签内的 HTML 内容（包含高亮的 span 标签）
				return codeElement.innerHTML;
			}
			
			// 如果解析失败，返回原始内容
			logger.warn("无法解析 shiki HTML，返回原始内容");
			return shikiHtml;
		} catch (err) {
			logger.warn("解析 shiki HTML 时出错:", err);
			return shikiHtml;
		}
	}

	/**
	 * 智能映射 hljs 主题到 shiki 主题
	 */
	private mapHljsToShiki(hljsThemeName: string): string {
		// 自定义主题优先级最高
		if (this.customThemes.has(hljsThemeName)) {
			return hljsThemeName;
		}

		// 精确匹配现有 shiki 主题
		const exactMatches: Record<string, string> = {
			'默认': 'github-light',
			'default': 'github-light',
			'github': 'github-light',
			'github-dark': 'github-dark',
			'vs': 'light-plus',
			'vs2015': 'dark-plus',
			'monokai': 'monokai',
			'nord': 'nord',
			'tokyo-night-dark': 'tokyo-night'
		};
		
		if (exactMatches[hljsThemeName]) {
			return exactMatches[hljsThemeName];
		}
		
		// 基于关键词的智能匹配
		const name = hljsThemeName.toLowerCase();
		
		if (name.includes('dark') || name.includes('night') || name.includes('black')) {
			return 'github-dark';
		}
		
		// 默认回退到亮色主题
		return 'github-light';
	}

	markedExtension(): MarkedExtension {
		return markedHighlight({
			langPrefix: 'shiki language-',
			async: true,
			highlight: async (code, lang, info) => {
				logger.debug("CodeHighlight处理代码:", {lang, codePreview: code.substring(0, 100)});

				const type = CodeRenderer.getMathType(lang)
				if (type) return code;
				if (lang && lang.trim().toLocaleLowerCase() == 'mpcard') return code;
				if (lang && lang.trim().toLocaleLowerCase() == 'mermaid') return code;
				if (lang && lang.startsWith('ad-')) return code;

				await this.initializeHighlighter();

				try {
					if (lang && lang !== 'text') {
						await this.loadLanguage(lang);
					}
					
					// 获取主题配置并加载主题
					const theme = this.getThemeFromSettings();
					await this.loadTheme(theme);
					
					const html = this.highlighter.codeToHtml(code, {
						lang: lang || 'text',
						theme: theme
					});
					
					// 解析 shiki 生成的 HTML，只提取 code 标签内的内容
					// 这样避免 marked 和 shiki 的双重 pre/code 结构嵌套
					const codeContent = this.extractCodeContent(html);
					logger.debug("CodeHighlight提取的内容:", codeContent.substring(0, 200));
					return codeContent;
				} catch (err) {
					logger.warn("shiki语法高亮失败:", err);
					// 如果主题加载失败，回退到默认主题
					try {
						const html = this.highlighter.codeToHtml(code, {
							lang: lang || 'text',
							theme: 'github-light'
						});
						return this.extractCodeContent(html);
					} catch (fallbackErr) {
						logger.warn("回退到默认主题也失败:", fallbackErr);
						return code;
					}
				}
			}
		})
	}
}
