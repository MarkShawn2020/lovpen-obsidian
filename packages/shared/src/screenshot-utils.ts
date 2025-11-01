/**
 * 截图工具函数 - 跨平台共享逻辑
 * 用于统一 Obsidian 插件和 Web 前端的截图元素查找逻辑
 */

import { logger } from './logger';

/**
 * 截图元素选择器优先级列表
 * 按照从高到低的优先级排序
 */
export const SCREENSHOT_ELEMENT_SELECTORS = [
	{
		selector: '.claude-main-content',
		description: '包含模板的完整内容：meta + lovpen',
		includesTemplate: true,
	},
	{
		selector: '.rich_media_content',
		description: '微信公众号样式的最外层容器',
		includesTemplate: true,
	},
	{
		selector: '.lovpen',
		description: '仅文章内容，不包含模板元信息',
		includesTemplate: false,
	},
	{
		selector: '.lovpen-content-container',
		description: '内容容器包装器',
		includesTemplate: false,
	},
] as const;

/**
 * 查找结果接口
 */
export interface FindElementResult {
	/** 找到的元素 */
	element: HTMLElement;
	/** 使用的选择器 */
	selector: string;
	/** 是否包含模板信息 */
	includesTemplate: boolean;
}

/**
 * 查找截图目标元素
 * @param container - 搜索容器（Obsidian 中是 reactContainer，Web 中是 document）
 * @returns 找到的元素及其元数据，未找到则返回 null
 */
export function findScreenshotElement(
	container: HTMLElement | Document
): FindElementResult | null {
	logger.debug('🎯 [截图工具] 开始查找截图元素...');

	for (const { selector, description, includesTemplate } of SCREENSHOT_ELEMENT_SELECTORS) {
		const element = container.querySelector(selector) as HTMLElement;
		if (element) {
			logger.debug(`🎯 [截图工具] 找到元素: ${selector} - ${description}`);
			logger.debug(`🎯 [截图工具] 元素尺寸: ${element.offsetWidth}x${element.offsetHeight}`);

			return {
				element,
				selector,
				includesTemplate,
			};
		}
	}

	logger.error('🎯 [截图工具] 未找到任何可截图的元素');
	return null;
}

/**
 * 获取截图元素的调试信息
 */
export function getScreenshotDebugInfo(result: FindElementResult | null): string {
	if (!result) {
		return '未找到截图元素';
	}

	const { element, selector, includesTemplate } = result;
	return `
选择器: ${selector}
尺寸: ${element.offsetWidth}x${element.offsetHeight}
包含模板: ${includesTemplate ? '是' : '否'}
类名: ${element.className}
标签: ${element.tagName}
	`.trim();
}

/**
 * 验证元素是否适合截图
 */
export function validateScreenshotElement(element: HTMLElement): {
	valid: boolean;
	reason?: string;
} {
	// 检查元素是否可见
	if (element.offsetWidth === 0 || element.offsetHeight === 0) {
		return {
			valid: false,
			reason: '元素尺寸为0，可能未渲染或被隐藏',
		};
	}

	// 检查元素是否在文档中
	if (!document.body.contains(element)) {
		return {
			valid: false,
			reason: '元素不在DOM树中',
		};
	}

	return { valid: true };
}
