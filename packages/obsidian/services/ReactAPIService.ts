import {Notice} from "obsidian";
import TemplateManager from "../template-manager";
import TemplateKitManager from "../template-kit-manager";
import {logger} from "@lovpen/shared";
import type {Template} from "@lovpen/shared";
import type {TemplateKitBasicInfo, TemplateKitOperationResult} from "../template-kit-types";

export class ReactAPIService {
	private static instance: ReactAPIService;

	private constructor() {}

	public static getInstance(): ReactAPIService {
		if (!ReactAPIService.instance) {
			ReactAPIService.instance = new ReactAPIService();
		}
		return ReactAPIService.instance;
	}

	async loadTemplateKits(): Promise<Template[]> {
		try {
			const templateManager = TemplateManager.getInstance();
			return await templateManager.getAvailableKits();
		} catch (error) {
			logger.error('Failed to load template kits:', error);
			throw error;
		}
	}

	async loadTemplates(): Promise<string[]> {
		try {
			const templateManager = TemplateManager.getInstance();
			return templateManager.getTemplateNames();
		} catch (error) {
			logger.error('Failed to load templates:', error);
			throw error;
		}
	}

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
				if (onRenderMarkdown) await onRenderMarkdown();
				if (onUpdateReactComponent) await onUpdateReactComponent();
			} else {
				new Notice(`应用模板失败: ${result.error}`);
			}

			return result;
		} catch (error) {
			logger.error('Error applying template:', error);
			return {success: false, error: error.message};
		}
	}

	async createTemplateKit(basicInfo: TemplateKitBasicInfo): Promise<TemplateKitOperationResult> {
		try {
			const templateManager = TemplateManager.getInstance();
			return await templateManager.createKitFromCurrentSettings(basicInfo);
		} catch (error) {
			logger.error('Error creating template:', error);
			return {success: false, error: error.message};
		}
	}

	async deleteTemplateKit(kitId: string): Promise<TemplateKitOperationResult> {
		try {
			const kitManager = TemplateKitManager.getInstance();
			return await kitManager.deleteKit(kitId);
		} catch (error) {
			logger.error('Error deleting template:', error);
			return {success: false, error: error.message};
		}
	}

	async exportTemplate(kitId: string): Promise<Template | null> {
		try {
			const kitManager = TemplateKitManager.getInstance();
			return await kitManager.exportKit(kitId);
		} catch (error) {
			logger.error('Error exporting template:', error);
			return null;
		}
	}

	async importTemplate(template: Template): Promise<TemplateKitOperationResult> {
		try {
			const kitManager = TemplateKitManager.getInstance();
			return await kitManager.importKit(template);
		} catch (error) {
			logger.error('Error importing template:', error);
			return {success: false, error: error.message};
		}
	}
}
