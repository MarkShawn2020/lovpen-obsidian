import {App} from "obsidian";
import {logger} from "../shared/src/logger";

/**
 * 样式加载器 - 负责动态加载和管理组件样式
 */
export class StyleLoader {
	private static instance: StyleLoader;
	private app: App;
	private loadedStyles: Map<string, string> = new Map();
	private activeTheme: string = 'default';
	
	private constructor(app: App) {
		this.app = app;
	}
	
	public static getInstance(app?: App): StyleLoader {
		if (!StyleLoader.instance) {
			if (!app) {
				throw new Error('StyleLoader requires App instance for initialization');
			}
			StyleLoader.instance = new StyleLoader(app);
		}
		return StyleLoader.instance;
	}
	
	/**
	 * 加载组件样式
	 */
	async loadComponentStyles(): Promise<string> {
		try {
			// 获取插件目录路径
			const app = this.app as any;
			const manifest = app.plugins?.plugins?.['lovpen']?.manifest;
			if (!manifest) {
				logger.debug('Plugin manifest not found, using inline styles');
				return this.getInlineAdmonitionStyles();
			}
			
			const pluginDir = `${this.app.vault.configDir}/plugins/${manifest.id}`;
			const admonitionStylePath = `${pluginDir}/assets/styles/components/admonition.css`;
			
			// 尝试读取样式文件
			if (await this.app.vault.adapter.exists(admonitionStylePath)) {
				const content = await this.app.vault.adapter.read(admonitionStylePath);
				this.loadedStyles.set('admonition-base', content);
				logger.debug('Loaded admonition base styles');
				return content;
			} else {
				// 如果文件不存在，返回内联的基础样式作为后备
				logger.debug('Admonition style file not found, using inline styles');
				return this.getInlineAdmonitionStyles();
			}
		} catch (error) {
			logger.error('Failed to load component styles:', error);
			return this.getInlineAdmonitionStyles();
		}
	}
	
	/**
	 * 加载主题样式
	 */
	async loadThemeStyles(theme: string): Promise<string> {
		if (theme === 'default') {
			return ''; // 默认主题不需要额外样式
		}
		
		try {
			// 获取插件目录路径
			const app = this.app as any;
			const manifest = app.plugins?.plugins?.['lovpen']?.manifest;
			if (!manifest) {
				logger.debug('Plugin manifest not found');
				return '';
			}
			
			const pluginDir = `${this.app.vault.configDir}/plugins/${manifest.id}`;
			const themeStylePath = `${pluginDir}/assets/styles/themes/${theme}/admonition.css`;
			
			if (await this.app.vault.adapter.exists(themeStylePath)) {
				const content = await this.app.vault.adapter.read(themeStylePath);
				this.loadedStyles.set(`theme-${theme}`, content);
				logger.debug(`Loaded ${theme} theme styles`);
				return content;
			}
		} catch (error) {
			logger.error(`Failed to load ${theme} theme styles:`, error);
		}
		
		return '';
	}
	
	/**
	 * 设置当前主题
	 */
	setActiveTheme(theme: string) {
		this.activeTheme = theme;
		logger.debug(`Active theme set to: ${theme}`);
	}
	
	/**
	 * 获取所有已加载的样式
	 */
	getAllStyles(): string {
		const styles: string[] = [];
		
		// 添加基础样式
		const baseStyle = this.loadedStyles.get('admonition-base');
		if (baseStyle) {
			styles.push(baseStyle);
		}
		
		// 添加主题样式
		const themeStyle = this.loadedStyles.get(`theme-${this.activeTheme}`);
		if (themeStyle) {
			styles.push(themeStyle);
		}
		
		return styles.join('\n');
	}
	
	/**
	 * 内联的后备样式
	 */
	private getInlineAdmonitionStyles(): string {
		return `
/* Fallback admonition styles */
[data-component="admonition"] {
  border: none;
  padding: 1em 1em 1em 1.5em;
  display: flex;
  flex-direction: column;
  margin: 1em 0;
  border-radius: 4px;
}

[data-element="admonition-header"] {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 1em;
  font-weight: 600;
}

[data-element="admonition-icon"] {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 0.5em;
}

[data-element="admonition-icon"] svg {
  width: 100%;
  height: 100%;
}

[data-element="admonition-title"] {
  flex: 1;
}

[data-element="admonition-content"] {
  color: rgb(34,34,34);
}

/* Default type styles */
[data-component="admonition"][data-type="note"] {
  color: rgb(8, 109, 221);
  background-color: rgba(8, 109, 221, 0.1);
}

[data-component="admonition"][data-type="tip"] {
  color: rgb(0, 191, 188);
  background-color: rgba(0, 191, 188, 0.1);
}

[data-component="admonition"][data-type="success"] {
  color: rgb(8, 185, 78);
  background-color: rgba(8, 185, 78, 0.1);
}

[data-component="admonition"][data-type="warning"] {
  color: rgb(236, 117, 0);
  background-color: rgba(236, 117, 0, 0.1);
}

[data-component="admonition"][data-type="danger"] {
  color: rgb(233, 49, 71);
  background-color: rgba(233, 49, 71, 0.1);
}

[data-component="admonition"][data-type="example"] {
  color: rgb(120, 82, 238);
  background-color: rgba(120, 82, 238, 0.1);
}

[data-component="admonition"][data-type="quote"] {
  color: rgb(158, 158, 158);
  background-color: rgba(158, 158, 158, 0.1);
}
		`;
	}
}