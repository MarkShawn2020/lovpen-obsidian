import {App, Vault} from "obsidian";
import AssetsManager from "../../assets";
import {NMPSettings} from "../../settings";
import {MarkedExtension} from "marked";
import {UnifiedPlugin} from "./unified-plugin-system";
import {IMarkdownPlugin, PluginMetadata, PluginType} from "./types";

/**
 * Markdown插件基类
 */
export abstract class MarkdownPlugin extends UnifiedPlugin implements IMarkdownPlugin {
	app: App;
	vault: Vault;
	assetsManager: AssetsManager;
	settings: NMPSettings;
	callback: any;
	marked: any; // 添加 marked 属性

	constructor(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: any) {
		super();
		this.app = app;
		this.vault = app.vault;
		this.settings = settings;
		this.assetsManager = assetsManager;
		this.callback = callback;
	}

	/**
	 * 获取插件元数据
	 */
	getMetadata(): PluginMetadata {
		return {
			name: this.getPluginName(),
			type: PluginType.MARKDOWN,
			description: this.getPluginDescription()
		};
	}

	/**
	 * 获取插件名称 - 子类必须实现
	 */
	abstract getPluginName(): string;

	/**
	 * 获取插件描述 - 子类可选实现
	 */
	getPluginDescription(): string {
		return "";
	}

	/**
	 * 获取Marked扩展 - 子类必须实现
	 */
	abstract markedExtension(): MarkedExtension;

	/**
	 * 准备阶段
	 */
	async prepare(): Promise<void> {
		return;
	}

	/**
	 * 后处理阶段
	 */
	async postprocess(html: string): Promise<string> {
		return html;
	}

	/**
	 * 发布前处理
	 */
	async beforePublish(): Promise<void> {
		return;
	}

	/**
	 * 清理阶段
	 */
	async cleanup(): Promise<void> {
		return;
	}
}
