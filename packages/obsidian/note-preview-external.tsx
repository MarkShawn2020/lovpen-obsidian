import {EventRef, ItemView, Notice, requestUrl, WorkspaceLeaf} from "obsidian";
import {FRONT_MATTER_REGEX, VIEW_TYPE_NOTE_PREVIEW} from "./constants";

import AssetsManager from "./assets";
import InlineCSS from "./inline-css";
import {CardDataManager} from "./html-plugins/code-blocks";
import {MDRendererCallback} from "./markdown-plugins/rehype-plugin";
import {LocalImageManager} from "./markdown-plugins/local-file";
import {MarkedParser} from "./markdown-plugins/parser";
import {UnifiedPluginManager} from "./shared/plugin/unified-plugin-system";
import {NMPSettings} from "./settings";
import TemplateManager from "./template-manager";
import {ReactAPIService} from "./services/ReactAPIService";
import {uevent} from "./utils";
import {persistentStorageService} from "@/services/persistentStorage";
import {logger} from "@lovpen/shared";
import {
	ArticleInfo,
	ExternalReactLib,
	GlobalReactAPI,
	isValidArticleInfo,
	isValidPersonalInfo,
	isValidTemplateKitBasicInfo,
	PersonalInfo,
	PluginData,
	ReactComponentPropsWithCallbacks,
	ReactSettings
} from "./types/react-api-types";
import {TemplateKitBasicInfo} from "./template-kit-types";

export class NotePreviewExternal extends ItemView implements MDRendererCallback {
	container: Element;
	settings: NMPSettings;
	assetsManager: AssetsManager;
	articleHTML: string;
	title: string;
	markedParser: MarkedParser;
	listeners: EventRef[];
	externalReactLib: ExternalReactLib | null = null;
	reactContainer: HTMLElement | null = null;
	toolbarArticleInfo: ArticleInfo | null = null; // 存储工具栏的基本信息
	isUpdatingFromToolbar: boolean = false; // 标志位，避免无限循环
	private reactAPIService: ReactAPIService;
	private cachedProps: ReactComponentPropsWithCallbacks | null = null; // 缓存props避免重复创建
	private lastArticleHTML: string = ''; // 缓存上次的文章HTML
	private lastCSSContent: string = ''; // 缓存上次的CSS内容

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// 获取主插件的设置实例，确保设置一致性
		this.settings = this.getPluginSettings();
		this.assetsManager = AssetsManager.getInstance();
		this.markedParser = new MarkedParser(this.app, this);
		this.reactAPIService = ReactAPIService.getInstance();

		// 插件系统已通过MarkedParser初始化，无需单独初始化
	}

	get currentTheme() {
		return this.settings.defaultStyle;
	}

	get currentHighlight() {
		return this.settings.defaultHighlight;
	}

	get workspace() {
		return this.app.workspace;
	}

	getViewType() {
		return VIEW_TYPE_NOTE_PREVIEW;
	}

	getIcon() {
		return "clipboard-paste";
	}

	getDisplayText() {
		return "笔记预览";
	}

	async onOpen() {
		// 确保React应用已加载
		await this.loadExternalReactApp();

		// 确保设置实例是最新的
		this.settings = this.getPluginSettings();

		await this.buildUI();
		
		// 添加多个事件监听器
		this.listeners = [
			this.workspace.on("active-leaf-change", () => this.update()),
			// 监听编辑器内容变化 - 立即更新
			this.workspace.on("editor-change", async (editor) => {
				await this.handleEditorChange();
			}),
			// 监听文件修改事件 - 立即更新
			this.app.vault.on("modify", async (file) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && activeFile.path === file.path) {
					await this.handleEditorChange();
				}
			})
		];

		this.renderMarkdown();
		uevent("open");
	}

	async onClose() {
		this.listeners.forEach((listener) => this.workspace.offref(listener));
		if (this.externalReactLib && this.reactContainer) {
			this.externalReactLib.unmount(this.reactContainer);
		}
		uevent("close");
	}

	async update() {
		LocalImageManager.getInstance().cleanup();
		CardDataManager.getInstance().cleanup();
		await this.renderMarkdown();
	}

	/**
	 * 处理编辑器内容变化 - 立即更新
	 */
	private async handleEditorChange() {
		// 直接更新，让React处理增量渲染
		this.articleHTML = await this.getArticleContent();
		// 只更新props，不重新mount组件
		if (this.externalReactLib && this.reactContainer) {
			const props = this.buildReactComponentProps();
			// 使用update而不是重新mount
			await this.externalReactLib.update(this.reactContainer, props);
		}
	}

	async renderMarkdown() {
		// 强制刷新assets，确保CSS在渲染前准备好
		await this.assetsManager.loadAssets();
		this.articleHTML = await this.getArticleContent();
		await this.updateExternalReactComponent();
	}

	async renderArticleOnly() {
		this.articleHTML = await this.getArticleContent();
		await this.updateExternalReactComponent();
	}

	async updateArticleContentOnly() {
		try {
			// 只更新文章内容，不重新初始化React组件
			const newArticleHTML = await this.getArticleContent();
			this.articleHTML = newArticleHTML;

			// 更新React组件的props但不重新触发onArticleInfoChange
			await this.updateExternalReactComponent();
		} catch (error) {
			logger.error('[updateArticleContentOnly] 更新文章内容失败:', error);
		}
	}

	async copyArticle() {
		let content = await this.getArticleContent();

		// 复制到剪贴板
		await navigator.clipboard.write([new ClipboardItem({
			"text/html": new Blob([content], {type: "text/html"}),
		}),]);
		new Notice(`已复制到剪贴板！`);
	}

	updateCSSVariables() {
		// 在React组件中处理CSS变量更新
		// 首先尝试在React容器中查找
		let noteContainer = this.reactContainer?.querySelector(".lovpen") as HTMLElement;

		// 如果React容器中没有找到，则在整个document中查找
		if (!noteContainer) {
			noteContainer = document.querySelector(".lovpen") as HTMLElement;
		}

		if (!noteContainer) {
			logger.warn("找不到容器，无法更新CSS变量");
			return;
		}

		if (this.settings.enableThemeColor) {
			noteContainer.style.setProperty("--primary-color", this.settings.themeColor || "#7852ee");
		} else {
			noteContainer.style.removeProperty("--primary-color");
		}

		const listItems = noteContainer.querySelectorAll("li");
		listItems.forEach((item) => {
			(item as HTMLElement).style.display = "list-item";
		});

		// 强制触发重绘，确保CSS变更立即生效
		noteContainer.style.display = 'none';
		noteContainer.offsetHeight; // 触发重排
		noteContainer.style.display = '';
	}

	wrapArticleContent(article: string): string {
		let className = "lovpen";
		let html = `<section class="${className}" id="article-section">${article}</section>`;

		if (this.settings.useTemplate) {
			try {
				const templateManager = TemplateManager.getInstance();
				const file = this.app.workspace.getActiveFile();
				const meta: Record<string, string | string[] | number | boolean | object | undefined> = {};

				// 首先获取frontmatter
				if (file) {
					const metadata = this.app.metadataCache.getFileCache(file);
					Object.assign(meta, metadata?.frontmatter);
				}

				// 设置文章标题的优先级：基本信息 > frontmatter
				let finalTitle = '';
				if (this.toolbarArticleInfo?.articleTitle && this.toolbarArticleInfo.articleTitle.trim() !== '') {
					// 优先级1: 基本信息中的标题
					finalTitle = this.toolbarArticleInfo.articleTitle.trim();
				} else if (meta.articleTitle && String(meta.articleTitle).trim() !== '') {
					// 优先级2: frontmatter中的标题
					finalTitle = String(meta.articleTitle).trim();
				}

				// 设置最终的标题
				if (finalTitle) {
					meta.articleTitle = finalTitle;
				}

				// 设置作者的优先级：基本信息 > frontmatter
				// 如果用户在基本信息中清空了作者，则不应该回退到storage
				let finalAuthor = '';
				if (this.toolbarArticleInfo && 'author' in this.toolbarArticleInfo) {
					// 如果基本信息存在author字段（即使为空），则使用它
					finalAuthor = this.toolbarArticleInfo.author?.trim() || '';
				} else if (meta.author && String(meta.author).trim() !== '') {
					// 只有在基本信息没有author字段时，才使用frontmatter
					finalAuthor = String(meta.author).trim();
				}

				// 设置最终的作者（可能为空）
				meta.author = finalAuthor;

				// 设置发布日期的优先级：基本信息 > frontmatter
				// 如果用户在基本信息中清空了日期，则不应该回退到当前日期
				let finalPublishDate = '';
				if (this.toolbarArticleInfo && 'publishDate' in this.toolbarArticleInfo) {
					// 如果基本信息存在publishDate字段（即使为空），则使用它
					finalPublishDate = this.toolbarArticleInfo.publishDate?.trim() || '';
				} else if (meta.publishDate && String(meta.publishDate).trim() !== '') {
					// 只有在基本信息没有publishDate字段时，才使用frontmatter
					finalPublishDate = String(meta.publishDate).trim();
				}

				// 设置最终的发布日期（可能为空）
				meta.publishDate = finalPublishDate;

				// 然后用工具栏的基本信息覆盖frontmatter（除了articleTitle、author、publishDate已经特殊处理）
				if (this.toolbarArticleInfo) {
					// 只覆盖有值的字段
					Object.keys(this.toolbarArticleInfo).forEach(key => {
						// articleTitle、author、publishDate已经在上面特殊处理了，跳过
						if (key === 'articleTitle' || key === 'author' || key === 'publishDate') return;

						const value = this.toolbarArticleInfo![key];
						if (value !== undefined && value !== null && value !== '') {
							// 对于数组类型的tags，需要特殊处理
							if (key === 'tags' && Array.isArray(value) && value.length > 0) {
								meta[key] = value;
							} else if (key !== 'tags' && value !== '') {
								meta[key] = value;
							}
						}
					});
				}

				// Add personalInfo to template data
				meta.personalInfo = {
					name: this.settings.personalInfo?.name || '',
					avatar: this.settings.personalInfo?.avatar || '',
					bio: this.settings.personalInfo?.bio || '',
					email: this.settings.personalInfo?.email || '',
					website: this.settings.personalInfo?.website || ''
				};


				html = templateManager.applyTemplate(html, this.settings.defaultTemplate, meta);
			} catch (error) {
				logger.error("应用模板失败", error);
				new Notice("应用模板失败，请检查模板设置！");
			}
		}

		return html;
	}

	async getArticleContent() {
		try {
			
			const af = this.app.workspace.getActiveFile();
			let md = "";
			if (af && af.extension.toLocaleLowerCase() === "md") {
				md = await this.app.vault.adapter.read(af.path);
				this.title = af.basename;
			} else {
				md = "没有可渲染的笔记或文件不支持渲染";
			}

			if (md.startsWith("---")) {
				md = md.replace(FRONT_MATTER_REGEX, "");
			}

			let articleHTML = await this.markedParser.parse(md);
			articleHTML = this.wrapArticleContent(articleHTML);

			const pluginManager = UnifiedPluginManager.getInstance();
			articleHTML = pluginManager.processContent(articleHTML, this.settings);

			return articleHTML;
		} catch (error) {
			logger.error("获取文章内容时出错:", error);
			return `<div class="error-message">渲染内容时出错: ${error.message}</div>`;
		}
	}

	getCSS() {
		const theme = this.assetsManager.getTheme(this.currentTheme);
		const highlight = this.assetsManager.getHighlight(this.currentHighlight);
		const customCSS = this.settings.useCustomCss ? this.assetsManager.customCSS : "";

		let themeColorCSS = "";

		if (this.settings.enableThemeColor) {
			themeColorCSS = `
:root {
  --primary-color: ${this.settings.themeColor || "#7852ee"};
  --theme-color-light: ${this.settings.themeColor || "#7852ee"}aa;
}
`;
		}

		const highlightCss = highlight?.css || "";
		const themeCss = theme?.css || "";

		// 当使用模板时，优先使用模板内置样式，而不是额外的主题CSS
		// 避免Claude Style等主题CSS覆盖模板样式
		let finalCSS = "";
		
		if (this.settings.useTemplate && this.settings.defaultTemplate) {
			// 使用模板时，只加载基础样式和高亮，不加载会冲突的主题CSS
			finalCSS = `${themeColorCSS}

${InlineCSS}

${highlightCss}

${customCSS}`;
		} else {
			// 不使用模板时，正常加载所有样式
			finalCSS = `${themeColorCSS}

${InlineCSS}

${highlightCss}

${themeCss}

${customCSS}`;
		}
		return finalCSS;
	}

	updateElementByID(id: string, html: string): void {
		const el = document.getElementById(id);
		if (el) {
			el.innerHTML = html;
		}
	}

	openDistributionModal(): void {
		// todo: 在React组件中实现分发对话框
	}

	async buildUI() {
		this.container = this.containerEl.children[1];
		this.container.empty();

		// 设置容器最小宽度，确保有足够空间显示工具栏
		if (this.containerEl) {
			this.containerEl.style.minWidth = '800px';
		}

		// 创建React容器
		this.reactContainer = document.createElement('div');
		this.reactContainer.style.width = '100%';
		this.reactContainer.style.height = '100%';
		this.reactContainer.style.minWidth = '800px'; // 确保React容器也有最小宽度
		this.reactContainer.id = 'lovpen-react-container';
		this.container.appendChild(this.reactContainer);


		// 渲染外部React组件
		await this.updateExternalReactComponent();
	}

	private getPluginSettings(): NMPSettings {
		const plugin = (this.app as any).plugins.plugins["lovpen"];
		if (plugin && plugin.settings) {
			return plugin.settings;
		}

		// 如果主插件尚未加载，使用单例模式
		logger.warn("主插件尚未加载，使用单例模式");
		return NMPSettings.getInstance();
	}

	private async loadExternalReactApp() {
		try {
			// Always try HMR first in development
			const viteDevServerUrl = 'http://localhost:5173';
			
			// Try to load from Vite dev server first
			try {
				
				// Check if dev server is running with a simple ping
				const response = await fetch(`${viteDevServerUrl}/@vite/client`, { 
					method: 'HEAD',
					mode: 'cors'
				});
				
				if (response.ok || response.status === 200) {
					
					// Clear any previous scripts to ensure fresh load
					const existingScripts = document.querySelectorAll('script[data-lovpen-hmr]');
					existingScripts.forEach(s => s.remove());
					
					// Load Vite client for HMR
					const viteClientScript = document.createElement('script');
					viteClientScript.type = 'module';
					viteClientScript.src = `${viteDevServerUrl}/@vite/client`;
					viteClientScript.setAttribute('data-lovpen-hmr', 'true');
					document.head.appendChild(viteClientScript);
					
					// Load React refresh runtime
					const reactRefreshScript = document.createElement('script');
					reactRefreshScript.type = 'module';
					reactRefreshScript.innerHTML = `
						import RefreshRuntime from '${viteDevServerUrl}/@react-refresh';
						RefreshRuntime.injectIntoGlobalHook(window);
						window.$RefreshReg$ = () => {};
						window.$RefreshSig$ = () => (type) => type;
						window.__vite_plugin_react_preamble_installed__ = true;
					`;
					reactRefreshScript.setAttribute('data-lovpen-hmr', 'true');
					document.head.appendChild(reactRefreshScript);
					
					// Load the dev module with timestamp to bypass cache
					const moduleScript = document.createElement('script');
					moduleScript.type = 'module';
					moduleScript.src = `${viteDevServerUrl}/src/dev.tsx?t=${Date.now()}`;
					moduleScript.setAttribute('data-lovpen-hmr', 'true');
					document.head.appendChild(moduleScript);
					
					// Mark HMR mode
					(window as any).__LOVPEN_HMR_MODE__ = true;
					(window as any).__LOVPEN_HMR_URL__ = viteDevServerUrl;
					
					// Wait for the library to be available
					await new Promise<void>((resolve) => {
						let attempts = 0;
						const checkInterval = setInterval(() => {
							if ((window as any).LovpenReactLib || attempts > 50) {
								clearInterval(checkInterval);
								resolve();
							}
							attempts++;
						}, 100);
					});
					
					this.externalReactLib = (window as any).LovpenReactLib;
					
					if (this.externalReactLib) {
						logger.info("[HMR] ✅ Successfully loaded React app with HMR support");
						this.setupGlobalAPI();
						
						// Setup HMR update listener
						this.setupHMRListener();
						return;
					}
				}
			} catch (devError) {
			}
			
			// Fall back to bundled version (production mode or dev server not available)
			const adapter = this.app.vault.adapter;
			const pluginDir = (this.app as any).plugins.plugins["lovpen"].manifest.dir;
			const scriptPath = `${pluginDir}/frontend/lovpen-react.iife.js`;

			const scriptContent = await adapter.read(scriptPath);

			// 创建script标签并执行
			const script = document.createElement('script');
			script.textContent = scriptContent;
			document.head.appendChild(script);

			// 加载对应的CSS文件
			await this.loadExternalCSS(pluginDir);

			// 获取全局对象
			this.externalReactLib = (window as any).LovpenReactLib ||
				(window as any).LovpenReact ||
				(window as any).LovpenReact?.default ||
				(window as any).lovpenReact;

			if (this.externalReactLib) {
				logger.debug("外部React应用加载成功（打包版本）", {
					availableMethods: Object.keys(this.externalReactLib),
					hasMount: typeof this.externalReactLib.mount === 'function',
					hasUpdate: typeof this.externalReactLib.update === 'function',
					hasUnmount: typeof this.externalReactLib.unmount === 'function',
					actualObject: this.externalReactLib,
					windowLovpenReact: (window as any).LovpenReact,
					windowLovpenReactDefault: (window as any).LovpenReact?.default,
				});

				// 立即设置全局API，确保React组件可以访问
				this.setupGlobalAPI();
			} else {
				logger.error("找不到外部React应用的全局对象", {
					windowKeys: Object.keys(window).filter(key => key.includes('Omni') || key.includes('React') || key.includes('react')),
					lovpenReact: !!(window as any).LovpenReact,
					lovpenReactLib: !!(window as any).LovpenReactLib,
					lovpenReactLowerCase: !!(window as any).lovpenReact
				});
			}
		} catch (error) {
			logger.error("加载外部React应用失败:", error);
			this.loadFallbackComponent();
		}
	}

	private async loadExternalCSS(pluginDir: string) {
		try {
			// Check if we're in HMR mode - CSS is handled by Vite in dev mode
			if ((window as any).__LOVPEN_HMR_MODE__) {
				logger.debug("[HMR] CSS 由 Vite Dev Server 管理");
				return;
			}
			
			const cssPath = `${pluginDir}/frontend/style.css`;
			const adapter = this.app.vault.adapter;
			const cssContent = await adapter.read(cssPath);

			// 检查是否已经有这个CSS
			const existingStyle = document.querySelector('style[data-lovpen-react]');
			if (existingStyle) {
				existingStyle.remove();
			}

			// 创建style标签并插入CSS
			const style = document.createElement('style');
			style.setAttribute('data-lovpen-react', 'true');
			style.textContent = cssContent;
			document.head.appendChild(style);

			logger.debug("成功加载外部CSS:", cssPath);

		} catch (error) {
			logger.warn("加载外部CSS失败:", error.message);
		}
	}

	private loadFallbackComponent() {
		// 这里可以导入原始的React组件作为备用
		// 暂时不实现，仅记录日志
	}
	
	/**
	 * Setup HMR listener for hot updates
	 */
	private setupHMRListener() {
		if (!(window as any).__LOVPEN_HMR_MODE__) return;
		
		logger.debug("[HMR] Setting up HMR update listener");
		
		// Listen for HMR updates
		if ((window as any).import && (window as any).import.meta) {
			// Module updates will be handled by Vite automatically
			logger.debug("[HMR] Vite HMR is active");
		}
		
		// Listen for manual refresh events
		(window as any).__lovpenRefresh = async () => {
			logger.debug("[HMR] Manual refresh triggered");
			if (this.externalReactLib && this.reactContainer) {
				await this.updateExternalReactComponent();
			}
		};
	}

	/**
	 * 将本地图片路径转换为data URL
	 * @param localPath 本地图片路径
	 * @returns data URL或null
	 */
	private async convertLocalImageToDataUrl(localPath: string): Promise<string | null> {
		try {
			// 通过Obsidian的资源路径获取文件内容
			const response = await fetch(localPath);
			if (!response.ok) {
				return null;
			}

			const blob = await response.blob();

			// 检查是否是图片
			if (!blob.type.startsWith('image/')) {
				return null;
			}

			// 转换为data URL
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		} catch (error) {
			logger.error('转换本地图片为data URL失败:', error);
			return null;
		}
	}

	/**
	 * 更新外部React组件
	 */
	private async updateExternalReactComponent(): Promise<void> {
		if (!this.externalReactLib || !this.reactContainer) {
			logger.warn("外部React应用未加载或容器不存在", {
				externalReactLib: !!this.externalReactLib,
				reactContainer: !!this.reactContainer
			});

			// 如果没有外部React应用，显示一个简单的错误消息
			if (this.reactContainer) {
				this.reactContainer.innerHTML = `
					<div style="padding: 20px; text-align: center; color: var(--text-muted);">
						<h3>React应用加载失败</h3>
						<p>请检查控制台日志获取更多信息</p>
						<p>插件可能需要重新安装或构建</p>
					</div>
				`;
			}
			return;
		}

		try {
			// 检查是否需要重新构建props
			const currentCSS = this.getCSS();
			const needsUpdate = !this.cachedProps || 
				this.articleHTML !== this.lastArticleHTML || 
				currentCSS !== this.lastCSSContent;
			
			if (!needsUpdate) {
				logger.debug("Props未变化，跳过更新");
				return;
			}

			logger.debug("更新外部React组件", {
				articleHTMLLength: this.articleHTML?.length || 0,
				hasCSS: !!this.getCSS(),
				availableMethods: this.externalReactLib ? Object.keys(this.externalReactLib) : [],
				reactContainerInDOM: this.reactContainer ? document.contains(this.reactContainer) : false,
				reactContainerElement: this.reactContainer ? this.reactContainer.tagName : null,
				reactContainerChildren: this.reactContainer ? this.reactContainer.children.length : 0
			});

			// 使用新的构建方法获取props
			const props = this.buildReactComponentProps();
			this.cachedProps = props;
			this.lastArticleHTML = this.articleHTML;
			this.lastCSSContent = currentCSS;

			// 使用外部React应用进行渲染，等待渲染完成
			await this.externalReactLib.update(this.reactContainer, props);
			logger.debug("外部React组件更新成功", {
				containerChildrenAfterUpdate: this.reactContainer.children.length,
				containerInnerHTML: this.reactContainer.innerHTML.substring(0, 200) + "..."
			});

		} catch (error) {
			logger.error("更新外部React组件时出错:", error);
			if (this.reactContainer) {
				this.reactContainer.innerHTML = `
					<div style="padding: 20px; text-align: center; color: var(--text-error);">
						<h3>React组件更新失败</h3>
						<p>错误: ${error.message}</p>
						<p>请检查控制台日志获取详细信息</p>
					</div>
				`;
			}
		}
	}

	/**
	 * 设置全局API，供React组件调用
	 */
	private setupGlobalAPI(): void {
		try {
			// 设置全局API对象
			const globalAPI: GlobalReactAPI = {
				loadTemplateKits: this.reactAPIService.loadTemplateKits.bind(this.reactAPIService),
				loadTemplates: this.reactAPIService.loadTemplates.bind(this.reactAPIService),
				onKitApply: this.handleKitApply.bind(this),
				onKitCreate: this.handleKitCreate.bind(this),
				onKitDelete: this.handleKitDelete.bind(this),
				onSettingsChange: this.handleSettingsChange.bind(this),
				onPersonalInfoChange: this.handlePersonalInfoChange.bind(this),
				onArticleInfoChange: this.handleArticleInfoChange.bind(this),
				onSaveSettings: this.saveSettingsToPlugin.bind(this),
				persistentStorage: this.buildPersistentStorageAPI(),
				requestUrl: requestUrl
			};

			(window as any).lovpenReactAPI = globalAPI;

			logger.info('[setupGlobalAPI] 全局API已设置完成，包含持久化存储APIs');
		} catch (error) {
			logger.error('[setupGlobalAPI] 设置全局API时出错:', error);
		}
	}

	/**
	 * 获取统一插件数据
	 */
	private getUnifiedPlugins(): PluginData[] {
		try {
			const pluginManager = UnifiedPluginManager.getInstance();
			if (!pluginManager) {
				logger.warn("UnifiedPluginManager 实例为空");
				return [];
			}

			const plugins = pluginManager.getPlugins();
			logger.debug(`获取到 ${plugins.length} 个插件`);
			return plugins.map((plugin: any): PluginData => {
				let description = '';
				if (plugin.getMetadata && plugin.getMetadata().description) {
					description = plugin.getMetadata().description;
				} else if (plugin.getPluginDescription) {
					description = plugin.getPluginDescription();
				}

				// 将新的类型映射回React组件期望的类型（按照标准remark/rehype概念）
				const pluginType = plugin.getType ? plugin.getType() : 'unknown';
				const mappedType: 'remark' | 'rehype' | 'unknown' =
					pluginType === 'html' ? 'rehype' :
						pluginType === 'markdown' ? 'remark' :
							'unknown';

				const pluginData: PluginData = {
					name: plugin.getName ? plugin.getName() : 'Unknown Plugin',
					type: mappedType,
					description: description,
					enabled: plugin.isEnabled ? plugin.isEnabled() : true,
					config: plugin.getConfig ? plugin.getConfig() : {},
					metaConfig: plugin.getMetaConfig ? plugin.getMetaConfig() : {}
				};

				logger.debug(`插件数据: ${pluginData.name} (${pluginType} -> ${mappedType})`);
				return pluginData;
			});
		} catch (error) {
			logger.warn("无法获取统一插件数据:", error);
			return [];
		}
	}

	private async handleUnifiedPluginToggle(pluginName: string, enabled: boolean) {
		try {
			const pluginManager = UnifiedPluginManager.getInstance();
			if (pluginManager) {
				const plugin = pluginManager.getPlugins().find((p: any) =>
					p.getName && p.getName() === pluginName
				);
				if (plugin && plugin.setEnabled) {
					plugin.setEnabled(enabled);
					
					// 清理缓存管理器状态，确保UI正确更新
					LocalImageManager.getInstance().cleanup();
					CardDataManager.getInstance().cleanup();
					
					this.saveSettingsToPlugin();
					this.renderMarkdown();
					
					// 强制更新React组件以反映插件状态变化
					this.cachedProps = null; // 清除缓存的props，强制重新构建
					await this.updateExternalReactComponent();
					
					logger.debug(`已${enabled ? '启用' : '禁用'}插件: ${pluginName}`);
				}
			}
		} catch (error) {
			logger.error("切换插件状态失败:", error);
		}
	}

	private async handleUnifiedPluginConfigChange(pluginName: string, key: string, value: string | boolean) {
		try {
			const pluginManager = UnifiedPluginManager.getInstance();
			if (pluginManager) {
				const plugin = pluginManager.getPlugins().find((p: any) =>
					p.getName && p.getName() === pluginName
				);
				if (plugin && plugin.updateConfig) {
					plugin.updateConfig({[key]: value});
					this.saveSettingsToPlugin();
					this.renderMarkdown();
					
					// 强制更新React组件以反映配置变化
					this.cachedProps = null; // 清除缓存的props，强制重新构建
					await this.updateExternalReactComponent();
					
					logger.debug(`已更新插件 ${pluginName} 的配置: ${key} = ${value}`);
				}
			}
		} catch (error) {
			logger.error("更新插件配置失败:", error);
		}
	}

	/**
	 * 构建React组件的props
	 */
	private buildReactComponentProps(): ReactComponentPropsWithCallbacks {
		// 转换设置对象以适配外部React应用的接口
		const externalSettings: ReactSettings = {
			defaultStyle: this.settings.defaultStyle,
			defaultHighlight: this.settings.defaultHighlight,
			defaultTemplate: this.settings.defaultTemplate,
			useTemplate: this.settings.useTemplate,
			lastSelectedTemplate: this.settings.lastSelectedTemplate,
			enableThemeColor: this.settings.enableThemeColor,
			themeColor: this.settings.themeColor,
			useCustomCss: this.settings.useCustomCss,
			authKey: this.settings.authKey,
			wxInfo: this.settings.wxInfo,
			expandedAccordionSections: this.settings.expandedAccordionSections || [],
			showStyleUI: this.settings.showStyleUI !== false, // 默认显示
			personalInfo: {
				name: this.settings.personalInfo?.name || '',
				avatar: this.settings.personalInfo?.avatar || '',
				bio: this.settings.personalInfo?.bio || '',
				email: this.settings.personalInfo?.email || '',
				website: this.settings.personalInfo?.website || ''
			},
			aiPromptTemplate: this.settings.aiPromptTemplate || '',
			aiModel: this.settings.aiModel || 'claude-3-5-haiku-latest',
		};

		// 获取统一插件数据
		const plugins = this.getUnifiedPlugins();

		return {
			settings: externalSettings,
			articleHTML: this.articleHTML || "",
			cssContent: this.getCSS(),
			plugins: plugins,
			onRefresh: async () => {
				await this.renderMarkdown();
				uevent("refresh");
			},
			onCopy: async () => {
				await this.copyArticle();
				uevent("copy");
			},
			onDistribute: async () => {
				this.openDistributionModal();
				uevent("distribute");
			},
			onTemplateChange: this.handleTemplateChange.bind(this),
			onThemeChange: this.handleThemeChange.bind(this),
			onHighlightChange: this.handleHighlightChange.bind(this),
			onThemeColorToggle: this.handleThemeColorToggle.bind(this),
			onThemeColorChange: this.handleThemeColorChange.bind(this),
			onRenderArticle: this.renderArticleOnly.bind(this),
			onSaveSettings: this.saveSettingsToPlugin.bind(this),
			onUpdateCSSVariables: this.updateCSSVariables.bind(this),
			onPluginToggle: this.handleUnifiedPluginToggle.bind(this),
			onPluginConfigChange: this.handleUnifiedPluginConfigChange.bind(this),
			onExpandedSectionsChange: this.handleExpandedSectionsChange.bind(this),
			onArticleInfoChange: this.handleArticleInfoChange.bind(this),
			onPersonalInfoChange: this.handlePersonalInfoChange.bind(this),
			onSettingsChange: this.handleSettingsChange.bind(this),
			onKitApply: this.handleKitApply.bind(this),
			onKitCreate: this.handleKitCreate.bind(this),
			onKitDelete: this.handleKitDelete.bind(this),
			loadTemplateKits: this.reactAPIService.loadTemplateKits.bind(this.reactAPIService),
			loadTemplates: this.reactAPIService.loadTemplates.bind(this.reactAPIService),
			persistentStorage: this.buildPersistentStorageAPI(),
			requestUrl: requestUrl
		};
	}

	/**
	 * 构建持久化存储API
	 */
	private buildPersistentStorageAPI() {
		return {
			// Template Kit Management
			saveTemplateKit: async (kitData: any, customName?: string) => {
				try {
					return await persistentStorageService.saveTemplateKit(kitData, customName);
				} catch (error) {
					logger.error('[persistentStorage.saveTemplateKit] Error:', error);
					throw error;
				}
			},
			getTemplateKits: async () => {
				try {
					return await persistentStorageService.getTemplateKits();
				} catch (error) {
					logger.error('[persistentStorage.getTemplateKits] Error:', error);
					throw error;
				}
			},
			deleteTemplateKit: async (id: string) => {
				try {
					return await persistentStorageService.deleteTemplateKit(id);
				} catch (error) {
					logger.error('[persistentStorage.deleteTemplateKit] Error:', error);
					throw error;
				}
			},

			// Plugin Configuration Management
			savePluginConfig: async (pluginName: string, config: any, metaConfig: any) => {
				try {
					return await persistentStorageService.savePluginConfig(pluginName, config, metaConfig);
				} catch (error) {
					logger.error('[persistentStorage.savePluginConfig] Error:', error);
					throw error;
				}
			},
			getPluginConfigs: async () => {
				try {
					return await persistentStorageService.getPluginConfigs();
				} catch (error) {
					logger.error('[persistentStorage.getPluginConfigs] Error:', error);
					throw error;
				}
			},
			getPluginConfig: async (pluginName: string) => {
				try {
					return await persistentStorageService.getPluginConfig(pluginName);
				} catch (error) {
					logger.error('[persistentStorage.getPluginConfig] Error:', error);
					throw error;
				}
			},

			// Personal Info Management
			savePersonalInfo: async (info: any) => {
				try {
					return await persistentStorageService.savePersonalInfo(info);
				} catch (error) {
					logger.error('[persistentStorage.savePersonalInfo] Error:', error);
					throw error;
				}
			},
			getPersonalInfo: async () => {
				try {
					return await persistentStorageService.getPersonalInfo();
				} catch (error) {
					logger.error('[persistentStorage.getPersonalInfo] Error:', error);
					throw error;
				}
			},

			// Article Info Management
			saveArticleInfo: async (info: any) => {
				try {
					return await persistentStorageService.saveArticleInfo(info);
				} catch (error) {
					logger.error('[persistentStorage.saveArticleInfo] Error:', error);
					throw error;
				}
			},
			getArticleInfo: async () => {
				try {
					return await persistentStorageService.getArticleInfo();
				} catch (error) {
					logger.error('[persistentStorage.getArticleInfo] Error:', error);
					throw error;
				}
			},

			// Style Settings Management
			saveStyleSettings: async (settings: any) => {
				try {
					return await persistentStorageService.saveStyleSettings(settings);
				} catch (error) {
					logger.error('[persistentStorage.saveStyleSettings] Error:', error);
					throw error;
				}
			},
			getStyleSettings: async () => {
				try {
					return await persistentStorageService.getStyleSettings();
				} catch (error) {
					logger.error('[persistentStorage.getStyleSettings] Error:', error);
					throw error;
				}
			},

			// File and Cover Management
			saveFile: async (file: File, customName?: string) => {
				try {
					return await persistentStorageService.saveFile(file, customName);
				} catch (error) {
					logger.error('[persistentStorage.saveFile] Error:', error);
					throw error;
				}
			},
			getFiles: async () => {
				try {
					return await persistentStorageService.getFiles();
				} catch (error) {
					logger.error('[persistentStorage.getFiles] Error:', error);
					throw error;
				}
			},
			getFileUrl: async (file: any) => {
				try {
					return await persistentStorageService.getFileUrl(file);
				} catch (error) {
					logger.error('[persistentStorage.getFileUrl] Error:', error);
					throw error;
				}
			},
			deleteFile: async (id: string) => {
				try {
					return await persistentStorageService.deleteFile(id);
				} catch (error) {
					logger.error('[persistentStorage.deleteFile] Error:', error);
					throw error;
				}
			},
			saveCover: async (coverData: any) => {
				try {
					return await persistentStorageService.saveCover(coverData);
				} catch (error) {
					logger.error('[persistentStorage.saveCover] Error:', error);
					throw error;
				}
			},
			getCovers: async () => {
				try {
					return await persistentStorageService.getCovers();
				} catch (error) {
					logger.error('[persistentStorage.getCovers] Error:', error);
					throw error;
				}
			},
			deleteCover: async (id: string) => {
				try {
					return await persistentStorageService.deleteCover(id);
				} catch (error) {
					logger.error('[persistentStorage.deleteCover] Error:', error);
					throw error;
				}
			},

			// Utility functions
			clearAllPersistentData: async () => {
				try {
					return await persistentStorageService.clearAllPersistentData();
				} catch (error) {
					logger.error('[persistentStorage.clearAllPersistentData] Error:', error);
					throw error;
				}
			},
			exportAllData: async () => {
				try {
					return await persistentStorageService.exportAllData();
				} catch (error) {
					logger.error('[persistentStorage.exportAllData] Error:', error);
					throw error;
				}
			}
		};
	}

	/**
	 * 处理模板变更
	 */
	private async handleTemplateChange(template: string): Promise<void> {
		if (template === "") {
			this.settings.useTemplate = false;
			this.settings.lastSelectedTemplate = "";
		} else {
			this.settings.useTemplate = true;
			this.settings.defaultTemplate = template;
			this.settings.lastSelectedTemplate = template;
		}
		this.saveSettingsToPlugin();
		await this.renderMarkdown();
	}

	/**
	 * 处理主题变更
	 */
	private async handleThemeChange(theme: string): Promise<void> {
		logger.debug(`[handleThemeChange] 切换主题: ${theme}`);
		this.settings.defaultStyle = theme;
		this.saveSettingsToPlugin();
		logger.debug(`[handleThemeChange] 设置已更新，开始渲染`);
		await this.renderMarkdown();
		logger.debug(`[handleThemeChange] 渲染完成`);

		// 直接异步调用update
		await this.update();
	}

	/**
	 * 处理高亮变更
	 */
	private async handleHighlightChange(highlight: string): Promise<void> {
		this.settings.defaultHighlight = highlight;
		this.saveSettingsToPlugin();
		await this.updateExternalReactComponent();
	}

	/**
	 * 处理主题色开关
	 */
	private async handleThemeColorToggle(enabled: boolean): Promise<void> {
		this.settings.enableThemeColor = enabled;
		this.saveSettingsToPlugin();
		await this.renderMarkdown();
	}

	/**
	 * 处理主题色变更
	 */
	private async handleThemeColorChange(color: string): Promise<void> {
		this.settings.themeColor = color;
		this.saveSettingsToPlugin();
		await this.renderMarkdown();
	}

	/**
	 * 处理展开节控制变更
	 */
	private handleExpandedSectionsChange(sections: string[]): void {
		this.settings.expandedAccordionSections = sections;
		this.saveSettingsToPlugin();
	}

	/**
	 * 处理文章信息变更
	 */
	private handleArticleInfoChange(info: ArticleInfo): void {
		// 避免无限循环
		if (this.isUpdatingFromToolbar) {
			return;
		}

		// 验证输入
		if (!isValidArticleInfo(info)) {
			logger.warn('[handleArticleInfoChange] 无效的文章信息:', info);
			return;
		}

		// 将文章信息保存到toolbarArticleInfo中，用于渲染时合并
		this.toolbarArticleInfo = info;

		// 设置标志位并异步更新
		this.isUpdatingFromToolbar = true;
		this.updateArticleContentOnly().then(() => {
			this.isUpdatingFromToolbar = false;
		});
	}

	/**
	 * 处理个人信息变更
	 */
	private handlePersonalInfoChange(info: PersonalInfo): void {
		// 验证输入
		if (!isValidPersonalInfo(info)) {
			logger.warn('[handlePersonalInfoChange] 无效的个人信息:', info);
			return;
		}

		logger.debug('[handlePersonalInfoChange] 更新前的设置:', this.settings.personalInfo);
		this.settings.personalInfo = info;
		logger.debug('[handlePersonalInfoChange] 更新后的设置:', this.settings.personalInfo);
		logger.debug('[handlePersonalInfoChange] 全部设置:', this.settings.getAllSettings());
		this.saveSettingsToPlugin();
	}

	/**
	 * 处理设置变更
	 */
	private handleSettingsChange(settingsUpdate: Partial<ReactSettings>): void {
		logger.debug('[handleSettingsChange] 设置已更新:', settingsUpdate);
		logger.debug('[handleSettingsChange] 更新前的authKey:', this.settings.authKey);
		logger.debug('[handleSettingsChange] 更新前的全部设置:', this.settings.getAllSettings());

		// 合并设置更新
		Object.keys(settingsUpdate).forEach(key => {
			const value = settingsUpdate[key as keyof ReactSettings];
			if (value !== undefined) {
				(this.settings as any)[key] = value;
				logger.debug(`[handleSettingsChange] 已更新 ${key}:`, value);
			}
		});

		logger.debug('[handleSettingsChange] 更新后的authKey:', this.settings.authKey);
		logger.debug('[handleSettingsChange] 更新后的全部设置:', this.settings.getAllSettings());
		this.saveSettingsToPlugin();
	}

	/**
	 * 处理套装应用
	 */
	private async handleKitApply(kitId: string): Promise<void> {
		logger.debug(`[handleKitApply] 应用模板套装: ${kitId}`);
		await this.reactAPIService.applyTemplateKit(
			kitId,
			() => this.renderMarkdown(),
			() => this.updateExternalReactComponent()
		);
	}

	/**
	 * 处理套装创建
	 */
	private async handleKitCreate(basicInfo: TemplateKitBasicInfo): Promise<void> {
		logger.debug(`[handleKitCreate] 创建模板套装:`, basicInfo);

		// 验证输入
		if (!isValidTemplateKitBasicInfo(basicInfo)) {
			logger.warn('[handleKitCreate] 无效的套装基本信息:', basicInfo);
			new Notice('无效的套装信息！');
			return;
		}

		await this.reactAPIService.createTemplateKit(basicInfo);
	}

	/**
	 * 处理套装删除
	 */
	private async handleKitDelete(kitId: string): Promise<void> {
		logger.debug(`[handleKitDelete] 删除模板套装: ${kitId}`);
		await this.reactAPIService.deleteTemplateKit(kitId);
	}

	private saveSettingsToPlugin(): void {
		uevent("save-settings");
		const plugin = (this.app as any).plugins.plugins["lovpen"];
		if (plugin) {
			// 确保主插件使用的是当前的设置实例
			plugin.settings = this.settings;
			logger.debug("正在保存设置到持久化存储", this.settings.getAllSettings());

			// 重要调试：检查设置实例是否正确
			logger.debug("当前设置实例:", this.settings);
			logger.debug("主插件设置实例:", plugin.settings);
			logger.debug("设置实例是否相同:", this.settings === plugin.settings);

			// 立即同步调用保存
			plugin.saveSettings();
		} else {
			logger.error("无法找到主插件实例，设置保存失败");
			// 尝试手动保存到本地存储作为备用
			try {
				const settingsData = this.settings.getAllSettings();
				localStorage.setItem('lovpen-settings-backup', JSON.stringify(settingsData));
				logger.debug("设置已保存到本地存储备份");
			} catch (error) {
				logger.error("本地存储备份失败:", error);
			}
		}
	}
}
