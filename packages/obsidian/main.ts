import {App, Plugin, PluginManifest, WorkspaceLeaf} from "obsidian";
import {VIEW_TYPE_NOTE_PREVIEW} from "./constants";
import AssetsManager from "./assets";
import {NotePreviewExternal} from "./note-preview-external";
import {LovpenSettingTab} from "./setting-tab";
import {NMPSettings} from "./settings";
import TemplateManager from "./template-manager";
import TemplateKitManager from "./template-kit-manager";
import {setVersion, uevent} from "./utils";

import {logger} from "../shared/src/logger";

export default class LovpenPlugin extends Plugin {
	settings: NMPSettings;
	assetsManager: AssetsManager;
	templateKitManager: TemplateKitManager;
	private currentViewWidth: number = 0; // 当前视图宽度

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		AssetsManager.setup(app, manifest);
		this.assetsManager = AssetsManager.getInstance();
	}

	async onload() {
		logger.info("Loading Lovpen");
		setVersion(this.manifest.version);
		uevent("load");
		await this.loadSettings();
		await this.assetsManager.loadAssets();

		// 初始化模板管理器
		const templateManager = TemplateManager.getInstance();
		templateManager.setup(this.app);
		await templateManager.loadTemplates();

		// 初始化模板套装管理器
		this.templateKitManager = TemplateKitManager.getInstance(this.app, this);
		await this.templateKitManager.onload();


		this.registerView(
			VIEW_TYPE_NOTE_PREVIEW,
			(leaf) => new NotePreviewExternal(leaf)
		);

		const ribbonIconEl = this.addRibbonIcon('clipboard-paste', '复制到公众号', () => {
				this.activateView();
			}
		);
		ribbonIconEl.addClass('lovpen-plugin-ribbon-class');

		this.addCommand({
			id: "open-note-preview",
			name: "复制到公众号",
			callback: () => {
				this.activateView();
			},
		});

		this.addSettingTab(new LovpenSettingTab(this.app, this));
	}

	async onunload() {
		// 清理模板套装管理器
		if (this.templateKitManager) {
			await this.templateKitManager.onunload();
		}
	}

	async loadSettings() {
		// 获取单例实例并加载数据
		this.settings = NMPSettings.getInstance();
		const data = await this.loadData();
		logger.info("从存储中加载的原始数据:", data);
		this.settings.loadSettings(data || {});
		logger.info("主插件设置加载完成", this.settings.getAllSettings());
	}

	async saveSettings() {
		// 确保 settings 已初始化
		if (!this.settings) {
			this.settings = NMPSettings.getInstance();
			logger.warn("Settings was undefined in saveSettings, initialized it");
		}

		// 保存所有设置 - 使用实例方法而不是静态方法
		try {
			const settingsToSave = this.settings.getAllSettings();
			logger.info("准备保存的设置数据:", settingsToSave);
			await this.saveData(settingsToSave);
			logger.info("Settings saved successfully");

			// 验证保存是否成功
			const savedData = await this.loadData();
			logger.info("验证保存后的数据:", savedData);
		} catch (error) {
			logger.error("Error while saving settings:", error);
		}
	}

	async activateView() {
		const {workspace} = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({
				type: VIEW_TYPE_NOTE_PREVIEW,
				active: true,
			});
		}

		if (leaf) workspace.revealLeaf(leaf);
	}

	/**
	 * 处理视图宽度变化（由 NotePreviewExternal 调用）
	 * @param width 新的视图宽度（像素）
	 */
	onViewWidthChange(width: number): void {
		this.currentViewWidth = width;
		console.log(`[LovpenPlugin] onViewWidthChange called: ${width}px`);
		logger.info(`[LovpenPlugin] 视图宽度已更新: ${width}px`);

		// 在这里可以添加自定义的宽度变化处理逻辑
		// 例如：调整UI布局、更新设置、触发重新渲染等
	}
}
