// 为了兼容性，需要导入Modal
import {App, Component, Modal, Notice} from 'obsidian';
import {logger} from '../shared/src/logger';
import LovpenPlugin from './main';
import TemplateManager from './template-manager';
import AssetsManager from './assets';
import {NMPSettings} from './settings';
import {
	ITemplateKitManager,
	TemplateKit,
	TemplateKitApplyOptions,
	TemplateKitBasicInfo,
	TemplateKitCollection,
	TemplateKitExportOptions,
	TemplateKitImportOptions,
	TemplateKitManagerConfig,
	TemplateKitOperationResult,
	TemplateKitPreview
} from './template-kit-types';

/**
 * 模板套装管理器
 * 提供模板套装的创建、管理、应用等功能
 */
export default class TemplateKitManager extends Component implements ITemplateKitManager {
	private static instance: TemplateKitManager;
	private app: App;
	private plugin: LovpenPlugin;
	private kitsCollection: TemplateKitCollection = {
		version: '1.0.0',
		kits: []
	};
	private config: TemplateKitManagerConfig;
	private readonly KITS_FILE_NAME = 'template-kits.json';

	private constructor(app: App, plugin: LovpenPlugin) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.config = {
			kitsStoragePath: 'assets',
			enableAutoBackup: true,
			backupRetentionDays: 30,
			enablePreview: true
		};
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
		logger.info('[TemplateKitManager] Loading template kit manager');
		await this.loadKits();
	}

	async onunload() {
		logger.info('[TemplateKitManager] Unloading template kit manager');
		await this.saveKits();
	}

	/**
	 * 加载所有套装
	 */
	async getAllKits(): Promise<TemplateKit[]> {
		await this.loadKits();
		return this.kitsCollection.kits;
	}

	/**
	 * 根据ID获取套装
	 */
	async getKitById(id: string): Promise<TemplateKit | null> {
		const kits = await this.getAllKits();
		return kits.find(kit => kit.basicInfo.id === id) || null;
	}

	/**
	 * 应用套装
	 */
	async applyKit(kitId: string, options: TemplateKitApplyOptions = {
		overrideExisting: true,
		applyStyles: true,
		applyTemplate: true,
		applyPlugins: true,
		showConfirmDialog: true
	}): Promise<TemplateKitOperationResult> {
		try {
			const kit = await this.getKitById(kitId);
			if (!kit) {
				return {
					success: false,
					error: `Template kit with ID "${kitId}" not found`
				};
			}

			logger.info(`[TemplateKitManager] Applying kit: ${kit.basicInfo.name}`);

			// 显示确认对话框
			if (options.showConfirmDialog) {
				const confirmed = await this.showApplyConfirmDialog(kit);
				if (!confirmed) {
					return {
						success: false,
						error: 'User cancelled the operation'
					};
				}
			}

			const settingsManager = this.plugin.settings;
			const templateManager = TemplateManager.getInstance();
			const assetsManager = AssetsManager.getInstance();

			// 确保模板文件存在并重新加载
			// await assetsManager.loadTemplates();
			await templateManager.loadTemplates();

			// 应用样式配置
			if (options.applyStyles) {
				await this.applyStyleConfig(kit, settingsManager, assetsManager);
			}

			// 应用模板配置
			if (options.applyTemplate) {
				await this.applyTemplateConfig(kit, settingsManager, templateManager);
			}

			// 应用插件配置
			if (options.applyPlugins) {
				await this.applyPluginConfig(kit, settingsManager);
			}

			// 保存设置
			await this.plugin.saveSettings();

			// 强制清理并重新应用CSS变量和样式
			// 等待一个小的延迟确保设置已保存
			const styleConfig = kit.styleConfig;
			setTimeout(() => {
				// 清理所有可能的CSS变量和样式残留
				const containers = document.querySelectorAll('.lovpen, .lovpen-renderer, .wabi-sabi-container');
				containers.forEach(container => {
					if (container instanceof HTMLElement) {
						// 清除所有可能的主题色变量
						container.style.removeProperty("--primary-color");
						container.style.removeProperty("--theme-color-light");
						container.style.removeProperty("--colors-primary");
						
						// 移除所有可能的内联样式 - 这些通常来自之前的主题
						const elementsWithInlineStyles = container.querySelectorAll('[style*="!important"], [style*="rgb(200, 100, 66)"], [style*="background"], [style*="color"]');
						elementsWithInlineStyles.forEach(el => {
							if (el instanceof HTMLElement) {
								// 清除与颜色相关的内联样式
								el.style.removeProperty("background");
								el.style.removeProperty("background-color");
								el.style.removeProperty("color");
								// 如果style属性现在为空，完全移除它
								if (!el.getAttribute('style')?.trim()) {
									el.removeAttribute('style');
								}
							}
						});
						
						// 如果套装启用了自定义主题色，重新应用
						if (styleConfig.enableCustomThemeColor && styleConfig.customThemeColor) {
							container.style.setProperty("--primary-color", styleConfig.customThemeColor);
						}
					}
				});
				
				// 强制重新渲染页面，确保样式完全更新
				document.body.style.display = 'none';
				document.body.offsetHeight; // 触发重排
				document.body.style.display = '';
				
				logger.info(`[TemplateKitManager] CSS变量和样式清理完成`);
			}, 150);

			new Notice(`Template kit "${kit.basicInfo.name}" applied successfully!`);

			return {
				success: true,
				data: kit
			};
		} catch (error) {
			logger.error('[TemplateKitManager] Error applying kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while applying kit'
			};
		}
	}

	/**
	 * 创建套装
	 */
	async createKit(kit: TemplateKit): Promise<TemplateKitOperationResult> {
		try {
			// 检查ID是否已存在
			const existingKit = await this.getKitById(kit.basicInfo.id);
			if (existingKit) {
				return {
					success: false,
					error: `Template kit with ID "${kit.basicInfo.id}" already exists`
				};
			}

			// 设置创建时间
			kit.basicInfo.createdAt = new Date().toISOString();
			kit.basicInfo.updatedAt = kit.basicInfo.createdAt;

			// 添加到集合
			this.kitsCollection.kits.push(kit);

			// 保存
			await this.saveKits();

			logger.info(`[TemplateKitManager] Created kit: ${kit.basicInfo.name}`);
			new Notice(`Template kit "${kit.basicInfo.name}" created successfully!`);

			return {
				success: true,
				data: kit
			};
		} catch (error) {
			logger.error('[TemplateKitManager] Error creating kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while creating kit'
			};
		}
	}

	/**
	 * 更新套装
	 */
	async updateKit(kitId: string, updates: Partial<TemplateKit>): Promise<TemplateKitOperationResult> {
		try {
			const kitIndex = this.kitsCollection.kits.findIndex(kit => kit.basicInfo.id === kitId);
			if (kitIndex === -1) {
				return {
					success: false,
					error: `Template kit with ID "${kitId}" not found`
				};
			}

			// 合并更新
			const currentKit = this.kitsCollection.kits[kitIndex];
			const updatedKit = {
				...currentKit,
				...updates,
				basicInfo: {
					...currentKit.basicInfo,
					...(updates.basicInfo || {}),
					id: kitId, // 确保ID不被更改
					updatedAt: new Date().toISOString()
				}
			};

			this.kitsCollection.kits[kitIndex] = updatedKit;

			// 保存
			await this.saveKits();

			logger.info(`[TemplateKitManager] Updated kit: ${updatedKit.basicInfo.name}`);
			new Notice(`Template kit "${updatedKit.basicInfo.name}" updated successfully!`);

			return {
				success: true,
				data: updatedKit
			};
		} catch (error) {
			logger.error('[TemplateKitManager] Error updating kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while updating kit'
			};
		}
	}

	/**
	 * 删除套装
	 */
	async deleteKit(kitId: string): Promise<TemplateKitOperationResult> {
		try {
			const kitIndex = this.kitsCollection.kits.findIndex(kit => kit.basicInfo.id === kitId);
			if (kitIndex === -1) {
				return {
					success: false,
					error: `Template kit with ID "${kitId}" not found`
				};
			}

			const kit = this.kitsCollection.kits[kitIndex];
			this.kitsCollection.kits.splice(kitIndex, 1);

			// 保存
			await this.saveKits();

			logger.info(`[TemplateKitManager] Deleted kit: ${kit.basicInfo.name}`);
			new Notice(`Template kit "${kit.basicInfo.name}" deleted successfully!`);

			return {
				success: true,
				data: kit
			};
		} catch (error) {
			logger.error('[TemplateKitManager] Error deleting kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while deleting kit'
			};
		}
	}

	/**
	 * 导出套装
	 */
	async exportKit(kitId: string, options: TemplateKitExportOptions = {
		includeTemplateFiles: true,
		includeThemeFiles: true,
		includePreviewImage: true,
		exportFormat: 'json'
	}): Promise<TemplateKitOperationResult> {
		try {
			const kit = await this.getKitById(kitId);
			if (!kit) {
				return {
					success: false,
					error: `Template kit with ID "${kitId}" not found`
				};
			}

			// 构建导出数据
			const exportData = {
				kit,
				exportedAt: new Date().toISOString(),
				exportOptions: options
			};

			// 如果需要包含文件，在这里处理文件读取逻辑
			if (options.includeTemplateFiles || options.includeThemeFiles) {
				// 这里可以扩展为读取实际文件内容
				logger.info('[TemplateKitManager] File inclusion not yet implemented');
			}

			return {
				success: true,
				data: exportData
			};
		} catch (error) {
			logger.error('[TemplateKitManager] Error exporting kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while exporting kit'
			};
		}
	}

	/**
	 * 导入套装
	 */
	async importKit(kitData: any, options: TemplateKitImportOptions = {
		overrideExisting: false,
		validateIntegrity: true,
		autoApply: false
	}): Promise<TemplateKitOperationResult> {
		try {
			// 验证导入数据
			if (!kitData.kit || !kitData.kit.basicInfo) {
				return {
					success: false,
					error: 'Invalid kit data format'
				};
			}

			const kit = kitData.kit as TemplateKit;

			// 检查是否已存在
			const existingKit = await this.getKitById(kit.basicInfo.id);
			if (existingKit && !options.overrideExisting) {
				return {
					success: false,
					error: `Template kit with ID "${kit.basicInfo.id}" already exists`
				};
			}

			// 验证完整性
			if (options.validateIntegrity) {
				const validationResult = this.validateKitIntegrity(kit);
				if (!validationResult.success) {
					return validationResult;
				}
			}

			// 创建或更新套装
			let result: TemplateKitOperationResult;
			if (existingKit) {
				result = await this.updateKit(kit.basicInfo.id, kit);
			} else {
				result = await this.createKit(kit);
			}

			if (!result.success) {
				return result;
			}

			// 自动应用
			if (options.autoApply) {
				await this.applyKit(kit.basicInfo.id);
			}

			return result;
		} catch (error) {
			logger.error('[TemplateKitManager] Error importing kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while importing kit'
			};
		}
	}

	/**
	 * 生成套装预览
	 */
	async generatePreview(kitId: string, content: string): Promise<TemplateKitPreview> {
		const kit = await this.getKitById(kitId);
		if (!kit) {
			throw new Error(`Template kit with ID "${kitId}" not found`);
		}

		// 这里应该使用实际的渲染逻辑生成预览
		// 简化实现，实际应该调用模板引擎和样式系统
		const previewHtml = `<div class="kit-preview">${content}</div>`;
		const previewCss = `/* Styles for ${kit.basicInfo.name} */`;

		return {
			kitId,
			previewHtml,
			previewCss,
			generatedAt: new Date().toISOString()
		};
	}

	/**
	 * 从当前设置创建套装
	 */
	async createKitFromCurrentSettings(basicInfo: TemplateKitBasicInfo): Promise<TemplateKitOperationResult> {
		try {
			const settingsManager = this.plugin.settings;
			const settings = settingsManager.getAllSettings();

			const kit: TemplateKit = {
				basicInfo,
				styleConfig: {
					theme: String(settings.defaultStyle || 'bento'),
					codeHighlight: String(settings.defaultHighlight || 'github'),
					cssVariables: {},
					enableCustomThemeColor: Boolean(settings.enableThemeColor || false),
					customThemeColor: String(settings.themeColor || ''),
					customCSS: ''
				},
				templateConfig: {
					templateFileName: String(settings.defaultTemplate || ''),
					useTemplate: Boolean(settings.useTemplate || false)
				},
				pluginConfig: {
					enabledMarkdownPlugins: [],
					enabledHtmlPlugins: [],
					pluginSettings: (settings.pluginsConfig as Record<string, any>) || {}
				}
			};

			return await this.createKit(kit);
		} catch (error) {
			logger.error('[TemplateKitManager] Error creating kit from current settings:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while creating kit from current settings'
			};
		}
	}

	// 私有方法

	private async loadKits(): Promise<void> {
		try {
			const pluginDir = (this.app as any).plugins.plugins["lovpen"].manifest.dir;
			const kitsFile = `${pluginDir}/${this.config.kitsStoragePath}/${this.KITS_FILE_NAME}`;

			logger.info(`[TemplateKitManager] Trying to load kits from: ${kitsFile}`);
			const content = await this.app.vault.adapter.read(kitsFile);
			this.kitsCollection = JSON.parse(content);
			logger.info(`[TemplateKitManager] Loaded ${this.kitsCollection.kits.length} kits`);
		} catch (error) {
			logger.warn(`[TemplateKitManager] Could not load kits, using default collection:`, error);
			this.kitsCollection = this.getDefaultKitsCollection();
		}
	}

	private async saveKits(): Promise<void> {
		try {
			const pluginDir = (this.app as any).plugins.plugins["lovpen"].manifest.dir;
			const kitsDir = `${pluginDir}/${this.config.kitsStoragePath}`;

			// 确保目录存在
			if (!await this.app.vault.adapter.exists(kitsDir)) {
				await this.app.vault.adapter.mkdir(kitsDir);
			}

			const kitsFile = `${kitsDir}/${this.KITS_FILE_NAME}`;
			const content = JSON.stringify(this.kitsCollection, null, 2);
			await this.app.vault.adapter.write(kitsFile, content);

			logger.info(`[TemplateKitManager] Saved ${this.kitsCollection.kits.length} kits`);
		} catch (error) {
			logger.error('[TemplateKitManager] Error saving kits:', error);
			throw error;
		}
	}


	private async applyStyleConfig(kit: TemplateKit, settingsManager: NMPSettings, assetsManager: any): Promise<void> {
		const styleConfig = kit.styleConfig;

		// 先清理之前的样式设置
		settingsManager.enableThemeColor = false;
		settingsManager.themeColor = '#7852ee'; // 重置为默认值
		settingsManager.useCustomCss = false;

		// 应用主题
		settingsManager.defaultStyle = styleConfig.theme;

		// 应用代码高亮
		settingsManager.defaultHighlight = styleConfig.codeHighlight;

		// 应用自定义主题色
		if (styleConfig.enableCustomThemeColor && styleConfig.customThemeColor) {
			settingsManager.enableThemeColor = true;
			settingsManager.themeColor = styleConfig.customThemeColor;
		} else {
			settingsManager.enableThemeColor = false;
		}

		// 清理CSS变量（在套装应用时重置）
		// 这会在下次渲染时清除之前的CSS变量
		
		logger.info(`[TemplateKitManager] Applied style configuration: theme=${styleConfig.theme}, enableThemeColor=${settingsManager.enableThemeColor}`);
	}

	private async applyTemplateConfig(kit: TemplateKit, settingsManager: NMPSettings, templateManager: any): Promise<void> {
		const templateConfig = kit.templateConfig;

		// 应用模板设置
		settingsManager.useTemplate = templateConfig.useTemplate;
		if (templateConfig.templateFileName) {
			// 去掉.html扩展名，因为TemplateManager中存储的key不包含扩展名
			const templateName = templateConfig.templateFileName.replace('.html', '');
			settingsManager.defaultTemplate = templateName;
			logger.info(`[TemplateKitManager] Set template to: ${templateName}`);
		}

		logger.info('[TemplateKitManager] Applied template configuration');
	}

	private async applyPluginConfig(kit: TemplateKit, settingsManager: NMPSettings): Promise<void> {
		const pluginConfig = kit.pluginConfig;

		// 应用插件配置
		if (pluginConfig.pluginSettings) {
			settingsManager.pluginsConfig = pluginConfig.pluginSettings;
		}

		logger.info('[TemplateKitManager] Applied plugin configuration');
	}

	private async showApplyConfirmDialog(kit: TemplateKit): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ApplyKitConfirmModal(this.app, kit, resolve);
			modal.open();
		});
	}

	private validateKitIntegrity(kit: TemplateKit): TemplateKitOperationResult {
		// 基本验证
		if (!kit.basicInfo || !kit.basicInfo.id || !kit.basicInfo.name) {
			return {
				success: false,
				error: 'Kit must have basic info with id and name'
			};
		}

		if (!kit.styleConfig || !kit.templateConfig || !kit.pluginConfig) {
			return {
				success: false,
				error: 'Kit must have complete configuration'
			};
		}

		return {success: true};
	}

	private getDefaultKitsCollection(): TemplateKitCollection {
		return {
			version: '1.0.0',
			kits: []
		};
	}
}

/**
 * 应用套装确认对话框
 */
class ApplyKitConfirmModal extends Modal {
	private kit: TemplateKit;
	private onConfirm: (confirmed: boolean) => void;

	constructor(app: App, kit: TemplateKit, onConfirm: (confirmed: boolean) => void) {
		super(app);
		this.kit = kit;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: `Apply Template Kit: ${this.kit.basicInfo.name}`});
		contentEl.createEl('p', {text: this.kit.basicInfo.description});

		const warningEl = contentEl.createEl('div', {cls: 'lovpen-warning'});
		warningEl.createEl('p', {text: 'This will override your current settings. Continue?'});

		const buttonContainer = contentEl.createEl('div', {cls: 'lovpen-modal-buttons'});

		const cancelButton = buttonContainer.createEl('button', {text: 'Cancel'});
		cancelButton.onclick = () => {
			this.onConfirm(false);
			this.close();
		};

		const confirmButton = buttonContainer.createEl('button', {text: 'Apply Kit', cls: 'lovpen-primary-button'});
		confirmButton.onclick = () => {
			this.onConfirm(true);
			this.close();
		};
	}
}

