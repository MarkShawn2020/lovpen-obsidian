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

/**
 * 代码块样式备份结构
 */
export interface CodeBlockStyleBackup {
	overflow: string;
	maxWidth: string;
	width: string;
	zoom: string;
}

/**
 * 代码块缩放处理结果
 */
export interface CodeBlockScaleResult {
	/** 被处理的代码块及其备份样式 */
	backups: Map<HTMLElement, CodeBlockStyleBackup>;
	/** 恢复函数 */
	restore: () => void;
}

/**
 * 处理代码块缩放 - 使溢出的代码块适应容器宽度
 * 使用 CSS zoom 属性实现，比 transform: scale() 更适合截图场景
 * 因为 zoom 会真正改变布局尺寸，截图库可以正确处理
 * @param container - 包含代码块的容器元素
 * @returns 处理结果，包含备份和恢复函数
 */
export function applyCodeBlockScale(container: HTMLElement): CodeBlockScaleResult {
	const preElements = container.querySelectorAll('pre');
	const backups = new Map<HTMLElement, CodeBlockStyleBackup>();

	preElements.forEach((pre) => {
		const preEl = pre as HTMLElement;

		// 记录原始尺寸（在任何修改之前）
		const targetWidth = preEl.clientWidth;

		// 检测横向溢出：scrollWidth > clientWidth
		if (preEl.scrollWidth > targetWidth + 1) {
			logger.debug(`[代码块缩放] 检测到溢出: scrollWidth=${preEl.scrollWidth}, targetWidth=${targetWidth}`);

			// 备份原始样式
			backups.set(preEl, {
				overflow: preEl.style.overflow,
				maxWidth: preEl.style.maxWidth,
				width: preEl.style.width,
				zoom: preEl.style.getPropertyValue('zoom'),
			});

			// 设置 fit-content 让代码块完整展开
			preEl.style.overflow = 'visible';
			preEl.style.maxWidth = 'none';
			preEl.style.width = 'fit-content';

			// 获取展开后的实际宽度
			const actualWidth = preEl.offsetWidth;

			// 计算缩放比例
			const scaleRatio = targetWidth / actualWidth;
			logger.debug(`[代码块缩放] 应用缩放: actualWidth=${actualWidth}, targetWidth=${targetWidth}, zoom=${scaleRatio.toFixed(3)}`);

			// 使用 zoom 进行缩放
			// zoom 会真正改变元素的布局尺寸，截图库可以正确处理
			// 不需要负 margin 补偿，因为布局会自动调整
			preEl.style.setProperty('zoom', String(scaleRatio));
		}
	});

	// 强制重排，确保样式生效后再截图
	if (backups.size > 0) {
		void container.offsetHeight;
	}

	// 创建恢复函数
	const restore = () => {
		backups.forEach((backup, preEl) => {
			preEl.style.overflow = backup.overflow;
			preEl.style.maxWidth = backup.maxWidth;
			preEl.style.width = backup.width;
			preEl.style.setProperty('zoom', backup.zoom);
		});
		logger.debug(`[代码块缩放] 已恢复 ${backups.size} 个代码块的原始样式`);
	};

	logger.debug(`[代码块缩放] 处理完成，共 ${backups.size} 个代码块被缩放`);

	return { backups, restore };
}
