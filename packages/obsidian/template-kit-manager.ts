import {App, Component, Notice} from 'obsidian';
import {logger} from '../shared/src/logger';
import LovpenPlugin from './main';
import TemplateManager from './template-manager';
import {getLovpenPluginDir} from './utils';
import {BUILTIN_TEMPLATE_KITS} from './builtin-assets';
import type {Template, TemplateCollection} from '@lovpen/shared';
import type {
	TemplateKitApplyOptions,
	TemplateKitBasicInfo,
	TemplateKitOperationResult,
} from './template-kit-types';

export default class TemplateKitManager extends Component {
	private static instance: TemplateKitManager;
	private app: App;
	private plugin: LovpenPlugin;
	private collection: TemplateCollection = {version: '2.0.0', templates: []};
	private readonly KITS_FILE_NAME = 'template-kits.json';

	private constructor(app: App, plugin: LovpenPlugin) {
		super();
		this.app = app;
		this.plugin = plugin;
	}

	public static getInstance(app?: App, plugin?: LovpenPlugin): TemplateKitManager {
		if (!TemplateKitManager.instance) {
			if (!app || !plugin) {
				throw new Error('TemplateKitManager requires app and plugin on first initialization');
			}
			TemplateKitManager.instance = new TemplateKitManager(app, plugin);
		}
		return TemplateKitManager.instance;
	}

	async onload() {
		await this.loadKits();
	}

	async onunload() {
		// 不要在卸载时回写磁盘：built-in 模板只由仓库 template-kits.json 维护；
		// 用户新增/删除 kit 已在 createKit/deleteKit 里即时持久化。
		// 早期实现会在这里 saveKits()，导致手动删 JSON 后一次 unload 又把内存快照写回磁盘。
	}

	async getAllKits(): Promise<Template[]> {
		await this.loadKits();
		return this.collection.templates;
	}

	async getKitById(id: string): Promise<Template | null> {
		const kits = await this.getAllKits();
		return kits.find(t => t.id === id) || null;
	}

	async applyKit(kitId: string, options: TemplateKitApplyOptions = {
		overrideExisting: true,
		applyStyles: true,
		applyTemplate: true,
		applyPlugins: true,
		showConfirmDialog: false
	}): Promise<TemplateKitOperationResult> {
		try {
			const template = await this.getKitById(kitId);
			if (!template) {
				return {success: false, error: `Template "${kitId}" not found`};
			}

			const settings = this.plugin.settings;
			const templateManager = TemplateManager.getInstance();
			await templateManager.loadTemplates();

			// 应用主题
			if (options.applyStyles) {
				settings.defaultStyle = template.theme;
				settings.defaultHighlight = template.codeHighlight;
				if (template.customThemeColor) {
					settings.enableThemeColor = true;
					settings.themeColor = template.customThemeColor;
				} else {
					settings.enableThemeColor = false;
				}
			}

			// 应用 HTML 布局模板
			if (options.applyTemplate) {
				if (template.htmlLayout) {
					settings.useTemplate = true;
					settings.defaultTemplate = template.htmlLayout.replace('.html', '');
				} else {
					settings.useTemplate = false;
					settings.defaultTemplate = '';
				}
			}

			await this.plugin.saveSettings();
			new Notice(`模板 "${template.name}" 已应用`);
			return {success: true, data: template};
		} catch (error) {
			logger.error('[TemplateKitManager] Error applying template:', error);
			return {success: false, error: error.message};
		}
	}

	async createKit(template: Template): Promise<TemplateKitOperationResult> {
		try {
			if (await this.getKitById(template.id)) {
				return {success: false, error: `Template "${template.id}" already exists`};
			}
			this.collection.templates.push(template);
			await this.saveKits();
			new Notice(`模板 "${template.name}" 已创建`);
			return {success: true, data: template};
		} catch (error) {
			return {success: false, error: error.message};
		}
	}

	async deleteKit(kitId: string): Promise<TemplateKitOperationResult> {
		try {
			const idx = this.collection.templates.findIndex(t => t.id === kitId);
			if (idx === -1) return {success: false, error: 'Not found'};
			const template = this.collection.templates[idx];
			if (template.builtIn) return {success: false, error: '内置模板不可删除'};
			this.collection.templates.splice(idx, 1);
			await this.saveKits();
			new Notice(`模板 "${template.name}" 已删除`);
			return {success: true};
		} catch (error) {
			return {success: false, error: error.message};
		}
	}

	async exportKit(kitId: string): Promise<Template | null> {
		return this.getKitById(kitId);
	}

	async importKit(template: Template): Promise<TemplateKitOperationResult> {
		const existing = await this.getKitById(template.id);
		if (existing) {
			// 更新已有的
			const idx = this.collection.templates.findIndex(t => t.id === template.id);
			this.collection.templates[idx] = {...template, builtIn: false};
		} else {
			this.collection.templates.push({...template, builtIn: false});
		}
		await this.saveKits();
		new Notice(`模板 "${template.name}" 已导入`);
		return {success: true, data: template};
	}

	async createKitFromCurrentSettings(basicInfo: TemplateKitBasicInfo): Promise<TemplateKitOperationResult> {
		try {
			const settings = this.plugin.settings;
			const template: Template = {
				...basicInfo,
				builtIn: false,
				theme: String(settings.defaultStyle || ''),
				codeHighlight: String(settings.defaultHighlight || ''),
				customThemeColor: settings.enableThemeColor ? String(settings.themeColor || '') : undefined,
				htmlLayout: settings.useTemplate ? String(settings.defaultTemplate || '') : undefined,
			};
			return await this.createKit(template);
		} catch (error) {
			return {success: false, error: error.message};
		}
	}

	private async loadKits(): Promise<void> {
		try {
			const pluginDir = getLovpenPluginDir(this.app, this.plugin.manifest);
			const kitsFile = `${pluginDir}/assets/${this.KITS_FILE_NAME}`;
			await this.ensureBundledKitsFile(pluginDir, kitsFile);
			const content = await this.app.vault.adapter.read(kitsFile);
			const parsed = JSON.parse(content);

			// 兼容 v1 格式（嵌套结构）和 v2 格式（扁平结构）
			if (parsed.kits && !parsed.templates) {
				// v1 格式：转换
				this.collection = {
					version: '2.0.0',
					templates: parsed.kits.map(this.migrateV1Kit)
				};
			} else {
				this.collection = parsed;
			}

			if (this.ensureBuiltInKitsPresent()) {
				await this.saveKits();
			}
		} catch (error) {
			logger.warn('[TemplateKitManager] Could not load kits:', error);
			this.collection = {version: '2.0.0', templates: []};
		}
	}

	private async ensureBundledKitsFile(pluginDir: string, kitsFile: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		const kitsDir = `${pluginDir}/assets`;

		if (!await adapter.exists(kitsDir)) {
			await adapter.mkdir(kitsDir);
		}

		if (!await adapter.exists(kitsFile)) {
			await adapter.write(kitsFile, JSON.stringify(BUILTIN_TEMPLATE_KITS, null, '\t'));
		}
	}

	private ensureBuiltInKitsPresent(): boolean {
		const existingIds = new Set(this.collection.templates.map(template => template.id));
		const missingBuiltIns = BUILTIN_TEMPLATE_KITS.templates.filter(template => !existingIds.has(template.id));

		if (missingBuiltIns.length === 0) {
			return false;
		}

		this.collection.templates = [...missingBuiltIns, ...this.collection.templates];
		return true;
	}

	private migrateV1Kit(kit: any): Template {
		return {
			id: kit.basicInfo?.id || '',
			name: kit.basicInfo?.name || '',
			description: kit.basicInfo?.description || '',
			author: kit.basicInfo?.author || '',
			version: kit.basicInfo?.version || '1.0.0',
			tags: kit.basicInfo?.tags || [],
			builtIn: true,
			theme: kit.styleConfig?.theme || '',
			codeHighlight: kit.styleConfig?.codeHighlight || '',
			customThemeColor: kit.styleConfig?.enableCustomThemeColor ? kit.styleConfig?.customThemeColor : undefined,
			htmlLayout: kit.templateConfig?.useTemplate ? kit.templateConfig?.templateFileName : undefined,
		};
	}

	private async saveKits(): Promise<void> {
		try {
			const pluginDir = getLovpenPluginDir(this.app, this.plugin.manifest);
			const kitsDir = `${pluginDir}/assets`;
			if (!await this.app.vault.adapter.exists(kitsDir)) {
				await this.app.vault.adapter.mkdir(kitsDir);
			}
			const kitsFile = `${kitsDir}/${this.KITS_FILE_NAME}`;
			await this.app.vault.adapter.write(kitsFile, JSON.stringify(this.collection, null, '\t'));
		} catch (error) {
			logger.error('[TemplateKitManager] Error saving kits:', error);
		}
	}
}
