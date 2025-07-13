import * as zip from "@zip.js/zip.js";
import {App, FileSystemAdapter, Notice, PluginManifest, requestUrl, TAbstractFile} from "obsidian";
import DefaultHighlight from "./default-highlight";
import DefaultTheme from "./default-theme";


export interface Theme {
	name: string
	className: string
	desc: string
	author: string
	css: string
}

export interface Highlight {
	name: string
	url: string
	css: string
}

export default class AssetsManager {
	private static instance: AssetsManager;
	app: App;
	defaultTheme: Theme = DefaultTheme;
	manifest: PluginManifest;
	themes: Theme[];
	highlights: Highlight[];
	assetsPath: string;
	themesPath: string;
	hilightPath: string;
	customCSS: string = '';
	themeCfg: string;
	hilightCfg: string;
	customCSSPath: string;
	iconsPath: string;
	templatesPath: string;

	private constructor() {

	}

	// 静态方法，用于获取实例
	public static getInstance(): AssetsManager {
		if (!AssetsManager.instance) {
			AssetsManager.instance = new AssetsManager();
		}
		return AssetsManager.instance;
	}

	public static setup(app: App, manifest: PluginManifest) {
		AssetsManager.getInstance()._setup(app, manifest);
	}

	async loadAssets() {
		await this.loadThemes();
		await this.loadHighlights();
		await this.loadCustomCSS();
		await this.loadTemplates();
	}

	async loadThemes() {
		try {
			// 首先加载默认主题
			this.themes = [this.defaultTheme];
			
			// 添加Claude Style主题
			const claudeStyleTheme = {
				name: 'Claude Style',
				className: 'claude-style',
				desc: 'Claude风格主题，采用温暖的橙红色配色',
				author: 'Lovpen Team',
				css: ''
			};
			
			// 尝试加载Claude Style主题的CSS
			const claudeStylePath = this.themesPath + 'claude-style.css';
			if (await this.app.vault.adapter.exists(claudeStylePath)) {
				const claudeStyleCSS = await this.app.vault.adapter.read(claudeStylePath);
				claudeStyleTheme.css = claudeStyleCSS;
				this.themes.push(claudeStyleTheme);
			}
			
			// 加载其他主题配置
			if (!await this.app.vault.adapter.exists(this.themeCfg)) {
				new Notice('主题资源未下载，请前往设置下载！');
				return;
			}
			
			const data = await this.app.vault.adapter.read(this.themeCfg);
			if (data) {
				const themes = JSON.parse(data);
				await this.loadCSS(themes);
				this.themes.push(...themes);
			}
		} catch (error) {
			console.error(error);
			new Notice('themes.json解析失败！');
		}
	}

	async loadCSS(themes: Theme[]) {
		try {
			for (const theme of themes) {
				const cssFile = this.themesPath + theme.className + '.css';
				const cssContent = await this.app.vault.adapter.read(cssFile);
				if (cssContent) {
					theme.css = cssContent;
				}
			}
		} catch (error) {
			console.error(error);
			new Notice('读取CSS失败！');
		}
	}

	async loadCustomCSS() {
		try {
			if (!await this.app.vault.adapter.exists(this.customCSSPath)) {
				return;
			}

			const cssContent = await this.app.vault.adapter.read(this.customCSSPath);
			if (cssContent) {
				this.customCSS = cssContent;
			}
		} catch (error) {
			console.error(error);
			new Notice('读取CSS失败！');
		}
	}

	async loadTemplates() {
		try {
			console.log('[AssetsManager] 开始加载模板，目标路径:', this.templatesPath);
			
			// 确保模板目录存在
			if (!await this.app.vault.adapter.exists(this.templatesPath)) {
				console.log('[AssetsManager] 创建模板目录:', this.templatesPath);
				await this.app.vault.adapter.mkdir(this.templatesPath);
			}

			// 从开发目录复制模板文件到运行目录
			await this.copyTemplatesFromSource();
			
			// 检查复制结果
			const files = await this.app.vault.adapter.list(this.templatesPath);
			console.log('[AssetsManager] 模板目录中的文件:', files.files);
		} catch (error) {
			console.error('[AssetsManager] Error loading templates:', error);
			new Notice('模板加载失败！');
		}
	}

	async copyTemplatesFromSource() {
		try {
			// 开发环境中的模板文件路径 - 尝试多种可能的路径
			const possibleSourcePaths = [
				this.manifest.dir + '/assets/templates/',
				this.manifest.dir + '/../assets/templates/',
				this.manifest.dir + '/packages/assets/templates/'
			];
			
			let sourcePath = '';
			for (const path of possibleSourcePaths) {
				if (await this.app.vault.adapter.exists(path)) {
					sourcePath = path;
					break;
				}
			}
			
			if (!sourcePath) {
				console.warn('[AssetsManager] No valid source templates path found. Tried:', possibleSourcePaths);
				// 创建默认的Claude Style模板
				await this.createDefaultClaudeStyleTemplate();
				return;
			} else {
				// 无论是否找到源文件，都确保创建Claude Style模板
				await this.createDefaultClaudeStyleTemplate();
			}

			console.log('[AssetsManager] Using templates source path:', sourcePath);

			// 获取源目录中的所有文件
			const files = await this.app.vault.adapter.list(sourcePath);
			
			for (const file of files.files) {
				const filename = file.split('/').pop();
				if (filename && filename.endsWith('.html')) {
					const sourceFile = file;
					const targetFile = this.templatesPath + filename;
					
					// 读取源文件内容
					const content = await this.app.vault.adapter.read(sourceFile);
					
					// 写入到目标文件
					await this.app.vault.adapter.write(targetFile, content);
					console.log('[AssetsManager] Copied template:', filename);
				}
			}

			// 复制Claude Style.css主题文件
			const possibleThemePaths = [
				this.manifest.dir + '/assets/themes/claude-style.css',
				this.manifest.dir + '/../assets/themes/claude-style.css',
				this.manifest.dir + '/packages/assets/themes/claude-style.css'
			];
			
			let claudeStyleSource = '';
			for (const path of possibleThemePaths) {
				if (await this.app.vault.adapter.exists(path)) {
					claudeStyleSource = path;
					break;
				}
			}
			
			if (claudeStyleSource) {
				const claudeStyleTarget = this.themesPath + 'claude-style.css';
				
				// 确保themes目录存在
				if (!await this.app.vault.adapter.exists(this.themesPath)) {
					await this.app.vault.adapter.mkdir(this.themesPath);
				}
				
				const cssContent = await this.app.vault.adapter.read(claudeStyleSource);
				await this.app.vault.adapter.write(claudeStyleTarget, cssContent);
				console.log('[AssetsManager] Copied Claude Style theme');
			}

			console.log('[AssetsManager] Templates copied successfully');
		} catch (error) {
			console.error('[AssetsManager] Error copying templates:', error);
		}
	}

	async createDefaultClaudeStyleTemplate() {
		try {
			const targetFile = this.templatesPath + 'Claude Style.html';
			
			// 检查文件是否已存在
			if (await this.app.vault.adapter.exists(targetFile)) {
				console.log('[AssetsManager] Claude Style template already exists');
				return;
			}
			
			console.log('[AssetsManager] Creating default Claude Style template at:', targetFile);
			const defaultTemplate = `<div class="rich_media_content js_underline_content autoTypeSetting24psection fix_apple_default_style" id="js_content">
	<section class="claude-main-content">
		{{#if articleTitle}}
		<h1>{{articleTitle}}</h1>
		{{/if}}

		{{{content}}}
	</section>
</div>

<style>
.rich_media_content {
	background: rgb(250, 249, 245) !important;
	border-radius: 12px;
	padding: 8px;
	font-family: "PingFang SC", -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
	font-size: 15px;
	line-height: 1.75;
	color: rgb(34, 34, 34);
}

.claude-main-content h1 {
	font-size: 1.6em;
	font-weight: bold;
	margin: 4em auto 2em;
	text-align: center;
	display: table;
	padding: 0.3em 1em;
	background: rgb(200, 100, 66);
	border-radius: 8px;
	color: white !important;
}

.claude-main-content strong, .claude-main-content b {
	color: rgb(200, 100, 66);
}
</style>`;

			await this.app.vault.adapter.write(targetFile, defaultTemplate);
			console.log('[AssetsManager] Successfully created default Claude Style template');
			
			// 验证文件是否创建成功
			const exists = await this.app.vault.adapter.exists(targetFile);
			console.log('[AssetsManager] File exists after creation:', exists);
		} catch (error) {
			console.error('[AssetsManager] Error creating default template:', error);
		}
	}

	async loadHighlights() {
		try {
			const defaultHighlight = {name: '默认', url: '', css: DefaultHighlight};
			this.highlights = [defaultHighlight];
			if (!await this.app.vault.adapter.exists(this.hilightCfg)) {
				new Notice('高亮资源未下载，请前往设置下载！');
				return;
			}

			const data = await this.app.vault.adapter.read(this.hilightCfg);
			if (data) {
				const items = JSON.parse(data);
				for (const item of items) {
					const cssFile = this.hilightPath + item.name + '.css';
					const cssContent = await this.app.vault.adapter.read(cssFile);
					this.highlights.push({name: item.name, url: item.url, css: cssContent});
				}
			}
		} catch (error) {
			console.error(error);
			new Notice('highlights.json解析失败！');
		}
	}

	async loadIcon(name: string) {
		const icon = this.iconsPath + name + '.svg';
		if (!await this.app.vault.adapter.exists(icon)) {
			return '';
		}
		const iconContent = await this.app.vault.adapter.read(icon);
		if (iconContent) {
			return iconContent;
		}
		return '';
	}

	getTheme(themeName: string) {
		for (const theme of this.themes) {
			if (theme.name === themeName || theme.className === themeName) {
				return theme;
			}
		}
	}

	getHighlight(highlightName: string) {
		for (const highlight of this.highlights) {
			if (highlight.name === highlightName) {
				return highlight;
			}
		}
	}

	getThemeURL() {
		return `https://github.com/markshawn2020/lovpen/releases/download/1.1.3/assets.zip`;
	}

	async downloadThemes() {
		try {
			if (await this.app.vault.adapter.exists(this.themeCfg)) {
				new Notice('主题资源已存在！')
				return;
			}
			const res = await requestUrl(this.getThemeURL());
			const data = res.arrayBuffer;
			await this.unzip(new Blob([data]));
			await this.loadAssets();
			new Notice('主题下载完成！');
		} catch (error) {
			console.error(error);
			await this.removeThemes();
			new Notice('主题下载失败, 请检查网络！');
		}
	}

	async unzip(data: Blob) {
		const zipFileReader = new zip.BlobReader(data);
		const zipReader = new zip.ZipReader(zipFileReader);
		const entries = await zipReader.getEntries();

		if (!await this.app.vault.adapter.exists(this.assetsPath)) {
			this.app.vault.adapter.mkdir(this.assetsPath);
		}

		for (const entry of entries) {
			if (entry.directory) {
				const dirPath = this.assetsPath + entry.filename;
				this.app.vault.adapter.mkdir(dirPath);
			} else {
				const filePath = this.assetsPath + entry.filename;
				const textWriter = new zip.TextWriter();
				if (entry.getData) {
					const data = await entry.getData(textWriter);
					await this.app.vault.adapter.write(filePath, data);
				}
			}
		}

		await zipReader.close();
	}

	async removeThemes() {
		try {
			const adapter = this.app.vault.adapter;
			if (await adapter.exists(this.themeCfg)) {
				await adapter.remove(this.themeCfg);
			}
			if (await adapter.exists(this.hilightCfg)) {
				await adapter.remove(this.hilightCfg);
			}
			if (await adapter.exists(this.themesPath)) {
				await adapter.rmdir(this.themesPath, true);
			}
			if (await adapter.exists(this.hilightPath)) {
				await adapter.rmdir(this.hilightPath, true);
			}
			await this.loadAssets();
			new Notice('清空完成！');
		} catch (error) {
			console.error(error);
			new Notice('清空主题失败！');
		}
	}

	async openAssets() {
		const path = require('path');
		const adapter = this.app.vault.adapter as FileSystemAdapter;
		const vaultRoot = adapter.getBasePath();
		const assets = this.assetsPath;
		if (!await adapter.exists(assets)) {
			await adapter.mkdir(assets);
		}
		const dst = path.join(vaultRoot, assets);
		const {shell} = require('electron');
		shell.openPath(dst);
	}

	searchFile(originPath: string): TAbstractFile | null {
		const resolvedPath = this.resolvePath(originPath);
		const vault = this.app.vault;
		const attachmentFolderPath = vault.config.attachmentFolderPath || '';
		let localPath = resolvedPath;
		let file = null;

		// 然后从根目录查找
		file = vault.getFileByPath(resolvedPath);
		if (file) {
			return file;
		}

		file = vault.getFileByPath(originPath);
		if (file) {
			return file;
		}

		// 先从附件文件夹查找
		if (attachmentFolderPath != '') {
			localPath = attachmentFolderPath + '/' + originPath;
			file = vault.getFileByPath(localPath)
			if (file) {
				return file;
			}

			localPath = attachmentFolderPath + '/' + resolvedPath;
			file = vault.getFileByPath(localPath)
			if (file) {
				return file;
			}
		}

		// 最后查找所有文件
		const files = vault.getAllLoadedFiles();
		for (let f of files) {
			if (f.path.includes(originPath)) {
				return f;
			}
		}

		return null;
	}

	resolvePath(relativePath: string): string {
		const basePath = this.getActiveFileDir();
		if (!relativePath.includes('/')) {
			return relativePath;
		}
		const stack = basePath.split("/");
		const parts = relativePath.split("/");

		stack.pop(); // Remove the current file name (or empty string)

		for (const part of parts) {
			if (part === ".") continue;
			if (part === "..") stack.pop();
			else stack.push(part);
		}
		return stack.join("/");
	}

	getActiveFileDir() {
		const af = this.app.workspace.getActiveFile();
		if (af == null) {
			return '';
		}
		const parts = af.path.split('/');
		parts.pop();
		if (parts.length == 0) {
			return '';
		}
		return parts.join('/');
	}

	private _setup(app: App, manifest: PluginManifest) {
		this.app = app;
		this.manifest = manifest;
		this.assetsPath = this.app.vault.configDir + '/plugins/obsidian-lovpen/assets/';
		this.themesPath = this.assetsPath + 'themes/';
		this.hilightPath = this.assetsPath + 'highlights/';
		this.themeCfg = this.assetsPath + 'themes.json';
		this.hilightCfg = this.assetsPath + 'highlights.json';
		this.customCSSPath = this.assetsPath + 'custom.css';
		this.iconsPath = this.assetsPath + 'icons/';
		this.templatesPath = this.assetsPath + 'templates/';
	}
}
