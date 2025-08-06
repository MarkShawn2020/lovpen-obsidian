import {Notice} from "obsidian";
import TemplateManager from "../template-manager";
import TemplateKitManager from "../template-kit-manager";
import {logger} from "@lovpen/shared";
import {TemplateKit, TemplateKitBasicInfo, TemplateKitOperationResult} from "../template-kit-types";

/**
 * React API服务类
 * 统一管理React组件与Obsidian插件之间的API交互
 * 避免重复代码，提供类型安全的接口
 */
export class ReactAPIService {
	private static instance: ReactAPIService;

	private constructor() {
	}

	public static getInstance(): ReactAPIService {
		if (!ReactAPIService.instance) {
			ReactAPIService.instance = new ReactAPIService();
		}
		return ReactAPIService.instance;
	}

	/**
	 * 加载所有模板套装
	 * @implements {TemplateKitAPI.loadTemplateKits} 从 @lovpen/shared
	 */
	async loadTemplateKits(): Promise<TemplateKit[]> {
		try {
			const templateManager = TemplateManager.getInstance();
			const kits = await templateManager.getAvailableKits();
			logger.debug(`Loaded ${kits.length} template kits`);
			return kits;
		} catch (error) {
			logger.error('Failed to load template kits:', error);
			throw error;
		}
	}

	/**
	 * 加载所有模板
	 * @implements {TemplateKitAPI.loadTemplates} 从 @lovpen/shared
	 */
	async loadTemplates(): Promise<string[]> {
		try {
			const templateManager = TemplateManager.getInstance();
			const templateNames = templateManager.getTemplateNames();
			logger.debug(`Loaded ${templateNames.length} templates`);
			return templateNames;
		} catch (error) {
			logger.error('Failed to load templates:', error);
			throw error;
		}
	}

	/**
	 * 应用模板套装
	 */
	async applyTemplateKit(
		kitId: string,
		onRenderMarkdown?: () => Promise<void>,
		onUpdateReactComponent?: () => Promise<void>
	): Promise<TemplateKitOperationResult> {
		try {
			const templateManager = TemplateManager.getInstance();
			const result = await templateManager.applyTemplateKit(kitId, {
				overrideExisting: true,
				applyStyles: true,
				applyTemplate: true,
				applyPlugins: true,
				showConfirmDialog: false
			});

			if (result.success) {
				logger.debug(`Template kit ${kitId} applied successfully`);

				// 执行回调函数
				if (onRenderMarkdown) {
					await onRenderMarkdown();
				}
				if (onUpdateReactComponent) {
					await onUpdateReactComponent();
				}

				new Notice(`模板套装应用成功！`);
			} else {
				logger.error('Failed to apply template kit:', result.error);
				new Notice(`应用套装失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error('Error applying template kit:', error);
			new Notice(`应用套装时出错: ${error.message}`);
			return {
				success: false,
				error: error.message || 'Unknown error occurred'
			};
		}
	}

	/**
	 * 创建模板套装
	 */
	async createTemplateKit(basicInfo: TemplateKitBasicInfo): Promise<TemplateKitOperationResult> {
		try {
			const templateManager = TemplateManager.getInstance();
			const result = await templateManager.createKitFromCurrentSettings(basicInfo);

			if (result.success) {
				logger.debug(`Template kit "${basicInfo.name}" created successfully`);
				new Notice(`模板套装 "${basicInfo.name}" 创建成功！`);
			} else {
				logger.error('Failed to create template kit:', result.error);
				new Notice(`创建套装失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error('Error creating template kit:', error);
			new Notice(`创建套装时出错: ${error.message}`);
			return {
				success: false,
				error: error.message || 'Unknown error occurred'
			};
		}
	}

	/**
	 * 删除模板套装
	 */
	async deleteTemplateKit(kitId: string): Promise<TemplateKitOperationResult> {
		try {
			const kitManager = TemplateKitManager.getInstance();
			const result = await kitManager.deleteKit(kitId);

			if (result.success) {
				logger.debug(`Template kit ${kitId} deleted successfully`);
				new Notice(`模板套装删除成功！`);
			} else {
				logger.error('Failed to delete template kit:', result.error);
				new Notice(`删除套装失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error('Error deleting template kit:', error);
			new Notice(`删除套装时出错: ${error.message}`);
			return {
				success: false,
				error: error.message || 'Unknown error occurred'
			};
		}
	}
}
