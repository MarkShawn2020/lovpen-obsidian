import { Notice } from "obsidian";
import TemplateManager from "../template-manager";
import TemplateKitManager from "../template-kit-manager";
import { logger } from "@lovpen/shared";
import { TemplateKit, TemplateKitBasicInfo, TemplateKitOperationResult } from "../template-kit-types";

/**
 * React API服务类
 * 统一管理React组件与Obsidian插件之间的API交互
 * 避免重复代码，提供类型安全的接口
 */
export class ReactAPIService {
	private static instance: ReactAPIService;

	private constructor() {}

	public static getInstance(): ReactAPIService {
		if (!ReactAPIService.instance) {
			ReactAPIService.instance = new ReactAPIService();
		}
		return ReactAPIService.instance;
	}

	/**
	 * 加载所有模板套装
	 */
	async loadTemplateKits(): Promise<TemplateKit[]> {
		logger.debug(`[ReactAPIService.loadTemplateKits] 加载模板套装列表`);
		try {
			const templateManager = TemplateManager.getInstance();
			const kits = await templateManager.getAvailableKits();
			logger.info(`[ReactAPIService.loadTemplateKits] 加载到 ${kits.length} 个套装`);
			return kits;
		} catch (error) {
			logger.error(`[ReactAPIService.loadTemplateKits] 加载套装时出错:`, error);
			throw error;
		}
	}

	/**
	 * 加载所有模板
	 */
	async loadTemplates(): Promise<string[]> {
		logger.debug(`[ReactAPIService.loadTemplates] 加载模板列表`);
		try {
			const templateManager = TemplateManager.getInstance();
			const templateNames = templateManager.getTemplateNames();
			logger.info(`[ReactAPIService.loadTemplates] 加载到 ${templateNames.length} 个模板:`, templateNames);
			return templateNames;
		} catch (error) {
			logger.error(`[ReactAPIService.loadTemplates] 加载模板时出错:`, error);
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
		logger.debug(`[ReactAPIService.applyTemplateKit] 应用模板套装: ${kitId}`);
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
				logger.info(`[ReactAPIService.applyTemplateKit] 套装 ${kitId} 应用成功`);
				
				// 执行回调函数
				if (onRenderMarkdown) {
					await onRenderMarkdown();
				}
				if (onUpdateReactComponent) {
					await onUpdateReactComponent();
				}
				
				new Notice(`模板套装应用成功！`);
			} else {
				logger.error(`[ReactAPIService.applyTemplateKit] 套装应用失败:`, result.error);
				new Notice(`应用套装失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error(`[ReactAPIService.applyTemplateKit] 应用套装时出错:`, error);
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
		logger.debug(`[ReactAPIService.createTemplateKit] 创建模板套装:`, basicInfo);
		try {
			const templateManager = TemplateManager.getInstance();
			const result = await templateManager.createKitFromCurrentSettings(basicInfo);

			if (result.success) {
				logger.info(`[ReactAPIService.createTemplateKit] 套装 ${basicInfo.name} 创建成功`);
				new Notice(`模板套装 "${basicInfo.name}" 创建成功！`);
			} else {
				logger.error(`[ReactAPIService.createTemplateKit] 套装创建失败:`, result.error);
				new Notice(`创建套装失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error(`[ReactAPIService.createTemplateKit] 创建套装时出错:`, error);
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
		logger.debug(`[ReactAPIService.deleteTemplateKit] 删除模板套装: ${kitId}`);
		try {
			const kitManager = TemplateKitManager.getInstance();
			const result = await kitManager.deleteKit(kitId);

			if (result.success) {
				logger.info(`[ReactAPIService.deleteTemplateKit] 套装 ${kitId} 删除成功`);
				new Notice(`模板套装删除成功！`);
			} else {
				logger.error(`[ReactAPIService.deleteTemplateKit] 套装删除失败:`, result.error);
				new Notice(`删除套装失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error(`[ReactAPIService.deleteTemplateKit] 删除套装时出错:`, error);
			new Notice(`删除套装时出错: ${error.message}`);
			return {
				success: false,
				error: error.message || 'Unknown error occurred'
			};
		}
	}
}