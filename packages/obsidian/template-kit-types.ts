/**
 * 模板系统类型定义（简化版）
 * 从 shared 包导入核心类型，本文件仅提供 Obsidian 端需要的扩展类型
 */

export type {Template, TemplateCollection} from '@lovpen/shared';

// 兼容旧代码的别名
export type {Template as TemplateKit} from '@lovpen/shared';
export type {TemplateCollection as TemplateKitCollection} from '@lovpen/shared';

// Obsidian 端的基本信息类型（用于创建模板）
export interface TemplateKitBasicInfo {
	id: string;
	name: string;
	description: string;
	author: string;
	version: string;
	tags: string[];
}

export interface TemplateKitOperationResult {
	success: boolean;
	error?: string;
	data?: any;
}

export interface TemplateKitApplyOptions {
	overrideExisting: boolean;
	applyStyles: boolean;
	applyTemplate: boolean;
	applyPlugins: boolean;
	showConfirmDialog: boolean;
}
