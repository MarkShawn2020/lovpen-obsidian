import Handlebars from 'handlebars';
import {App, Notice} from 'obsidian';


import {logger} from "../shared/src/logger";
import { TemplateKit, TemplateKitOperationResult } from './template-kit-types';

// 定义模板数据类型
export interface TemplateData {
	epigraph?: string[];
	content?: string;

	// 注意：索引类型必须包含所有特定属性类型
	[key: string]: string | string[] | number | boolean | object | undefined;
}

export interface Template {
	name: string;
	path: string;
	content: string;
}

export default class TemplateManager {
	private static instance: TemplateManager;
	private app: App;
	private templates: Map<string, Template> = new Map();
	private templateDir: string;

	private constructor() {
	}

	public static getInstance(): TemplateManager {
		if (!TemplateManager.instance) {
			TemplateManager.instance = new TemplateManager();
		}
		return TemplateManager.instance;
	}

	public setup(app: App): void {
		this.app = app;
		this.templateDir = `${this.app.vault.configDir}/plugins/obsidian-lovpen/assets/templates/`;
		logger.info('模板目录:', this.templateDir);
	}

	// 加载所有模板
	public async loadTemplates(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;
			logger.info('[TemplateManager] 检查模板目录:', this.templateDir);
			const templateExists = await adapter.exists(this.templateDir);

			if (!templateExists) {
				logger.warn('[TemplateManager] 模板目录不存在，尝试创建:', this.templateDir);
				await adapter.mkdir(this.templateDir);
			}

			const files = await adapter.list(this.templateDir);
			logger.info('[TemplateManager] 发现文件:', files.files);
			this.templates.clear();

			for (const file of files.files) {
				if (file.endsWith('.html')) {
					const fileName = file.split('/').pop()?.replace('.html', '') || '';
					const content = await adapter.read(file);

					this.templates.set(fileName, {
						name: fileName,
						path: file,
						content: content
					});
					
					logger.info('[TemplateManager] 加载模板:', fileName, '路径:', file);
				}
			}

			logger.info('[TemplateManager] 模板加载完成，共加载', this.templates.size, '个模板');
			logger.info('[TemplateManager] 可用模板列表:', Array.from(this.templates.keys()));
		} catch (error) {
			logger.error('[TemplateManager] Error loading templates:', error);
			new Notice('加载模板失败！');
		}
	}

	// 获取模板列表
	public getTemplateNames(): string[] {
		return Array.from(this.templates.keys());
	}

	// 获取指定模板
	public getTemplate(name: string): Template | undefined {
		return this.templates.get(name);
	}

	// 应用模板到内容
	public applyTemplate(content: string, templateName: string, meta: TemplateData = {}): string {
		logger.info(`[TemplateManager] 尝试应用模板: "${templateName}"`);
		logger.info(`[TemplateManager] 当前可用模板:`, Array.from(this.templates.keys()));
		logger.info(`[TemplateManager] 模板数量:`, this.templates.size);
		
		// 容错处理：尝试去掉可能的扩展名
		const cleanTemplateName = templateName.replace('.html', '');
		
		// 先尝试原始名称，再尝试清理后的名称
		let template = this.templates.get(templateName);
		if (!template && templateName !== cleanTemplateName) {
			logger.info(`[TemplateManager] 尝试使用清理后的模板名称: "${cleanTemplateName}"`);
			template = this.templates.get(cleanTemplateName);
		}
		
		if (!template) {
			logger.warn(`[TemplateManager] 未找到模板 "${templateName}"`);
			logger.warn(`[TemplateManager] 可用的模板列表:`, Array.from(this.templates.keys()));
			return content;
		}
		
		logger.info(`[TemplateManager] 成功找到模板: "${template.name}"`);
		

		// 确保 meta 中有 epigraph，默认为 ["这篇文章写地贼累！"]
		if (!meta.epigraph) {
			meta.epigraph = ["这篇文章写地贼累！"];
		} else if (!Array.isArray(meta.epigraph)) {
			// 如果 epigraph 不是数组，转换为数组
			meta.epigraph = [meta.epigraph];
		}

		// 使用 Handlebars 渲染模板

		// 在传递数据时，要确保 content 不会被 meta 中的同名属性覆盖
		const templateData = {
			...meta,  // 先展开 meta
			content   // 再设置 content，优先级更高
		};

		// 预编译模板，可提高性能
		const compiledTemplate = Handlebars.compile(template.content, {noEscape: true}); // noEscape 参数避免 HTML 转义

		// 注册一些常用的辅助函数
		Handlebars.registerHelper('isFirst', function (options) {
			return options.data.first ? options.fn(this) : options.inverse(this);
		});

		Handlebars.registerHelper('isLast', function (options) {
			return options.data.last ? options.fn(this) : options.inverse(this);
		});

		// 注册 or 辅助函数，用于条件判断
		Handlebars.registerHelper('or', function (...args) {
			// 移除最后一个参数（Handlebars options对象）
			const values = args.slice(0, -1);
			// 检查是否有任何值为真值
			return values.some(value => !!value);
		});

		const data = compiledTemplate(templateData, {
			data: {  // 这里可以传递一些额外的上下文数据
				root: templateData
			}
		});

		logger.debug('使用模板数据渲染:', {templateName, templateData});
		return data;
	}

	// 创建新模板
	public async createTemplate(name: string, content: string): Promise<void> {
		try {
			const fileName = `${name}.html`;
			const filePath = `${this.templateDir}${fileName}`;

			await this.app.vault.adapter.write(filePath, content);

			this.templates.set(name, {
				name: name,
				path: filePath,
				content: content
			});

			new Notice(`模板 ${name} 创建成功！`);
		} catch (error) {
			console.error('Error creating template:', error);
			new Notice('创建模板失败！');
		}
	}

	// 删除模板
	public async deleteTemplate(name: string): Promise<void> {
		try {
			const template = this.templates.get(name);
			if (!template) {
				new Notice(`模板 ${name} 不存在！`);
				return;
			}

			await this.app.vault.adapter.remove(template.path);
			this.templates.delete(name);

			new Notice(`模板 ${name} 删除成功！`);
		} catch (error) {
			console.error('Error deleting template:', error);
			new Notice('删除模板失败！');
		}
	}

	// === 模板套装支持方法 ===

	/**
	 * 获取模板套装管理器
	 */
	private getTemplateKitManager(): any {
		// 延迟导入避免循环依赖
		try {
			const TemplateKitManager = require('./template-kit-manager').default;
			return TemplateKitManager.getInstance();
		} catch (error) {
			logger.error('[TemplateManager] Failed to get TemplateKitManager:', error);
			return null;
		}
	}

	/**
	 * 获取所有可用的模板套装
	 */
	public async getAvailableKits(): Promise<TemplateKit[]> {
		try {
			const kitManager = this.getTemplateKitManager();
			if (!kitManager) {
				logger.warn('[TemplateManager] TemplateKitManager not available');
				return [];
			}
			return await kitManager.getAllKits();
		} catch (error) {
			logger.error('[TemplateManager] Error getting available kits:', error);
			return [];
		}
	}

	/**
	 * 应用模板套装
	 * @param kitId 套装ID
	 * @param options 应用选项
	 */
	public async applyTemplateKit(kitId: string, options: any = {}): Promise<TemplateKitOperationResult> {
		try {
			const kitManager = this.getTemplateKitManager();
			if (!kitManager) {
				return {
					success: false,
					error: 'TemplateKitManager not available'
				};
			}

			logger.info(`[TemplateManager] Applying template kit: ${kitId}`);
			const result = await kitManager.applyKit(kitId, options);
			
			if (result.success) {
				// 重新加载模板以确保新模板可用
				await this.loadTemplates();
				logger.info(`[TemplateManager] Template kit ${kitId} applied successfully`);
			}
			
			return result;
		} catch (error) {
			logger.error('[TemplateManager] Error applying template kit:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while applying template kit'
			};
		}
	}

	/**
	 * 根据当前设置创建模板套装
	 * @param basicInfo 套装基本信息
	 */
	public async createKitFromCurrentSettings(basicInfo: any): Promise<TemplateKitOperationResult> {
		try {
			const kitManager = this.getTemplateKitManager();
			if (!kitManager) {
				return {
					success: false,
					error: 'TemplateKitManager not available'
				};
			}

			logger.info(`[TemplateManager] Creating kit from current settings: ${basicInfo.name}`);
			return await kitManager.createKitFromCurrentSettings(basicInfo);
		} catch (error) {
			logger.error('[TemplateManager] Error creating kit from current settings:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred while creating kit'
			};
		}
	}

	/**
	 * 验证模板是否适用于套装
	 * @param templateName 模板名称
	 * @param kitId 套装ID
	 */
	public async validateTemplateForKit(templateName: string, kitId: string): Promise<boolean> {
		try {
			const template = this.getTemplate(templateName);
			if (!template) {
				logger.warn(`[TemplateManager] Template ${templateName} not found`);
				return false;
			}

			const kits = await this.getAvailableKits();
			const kit = kits.find(k => k.basicInfo.id === kitId);
			if (!kit) {
				logger.warn(`[TemplateManager] Kit ${kitId} not found`);
				return false;
			}

			// 验证模板是否与套装配置匹配
			return kit.templateConfig.templateFileName === `${templateName}.html`;
		} catch (error) {
			logger.error('[TemplateManager] Error validating template for kit:', error);
			return false;
		}
	}

	/**
	 * 获取套装的模板预览
	 * @param kitId 套装ID
	 * @param sampleContent 示例内容
	 */
	public async getKitPreview(kitId: string, sampleContent: string = ''): Promise<string> {
		try {
			const kitManager = this.getTemplateKitManager();
			if (!kitManager) {
				logger.warn('[TemplateManager] TemplateKitManager not available');
				return sampleContent;
			}

			const preview = await kitManager.generatePreview(kitId, sampleContent);
			return preview.previewHtml;
		} catch (error) {
			logger.error('[TemplateManager] Error generating kit preview:', error);
			return sampleContent;
		}
	}

	/**
	 * 检查模板是否为套装专用模板
	 * @param templateName 模板名称
	 */
	public async isKitTemplate(templateName: string): Promise<boolean> {
		try {
			const kits = await this.getAvailableKits();
			return kits.some(kit => 
				kit.templateConfig.templateFileName === `${templateName}.html`
			);
		} catch (error) {
			logger.error('[TemplateManager] Error checking if template is kit template:', error);
			return false;
		}
	}

	/**
	 * 获取模板关联的套装信息
	 * @param templateName 模板名称
	 */
	public async getTemplateKitInfo(templateName: string): Promise<TemplateKit[]> {
		try {
			const kits = await this.getAvailableKits();
			return kits.filter(kit => 
				kit.templateConfig.templateFileName === `${templateName}.html`
			);
		} catch (error) {
			logger.error('[TemplateManager] Error getting template kit info:', error);
			return [];
		}
	}

	/**
	 * 应用模板时自动应用套装样式
	 * @param content 内容
	 * @param templateName 模板名称 
	 * @param meta 模板数据
	 * @param autoApplyKitStyles 是否自动应用套装样式
	 */
	public async applyTemplateWithKitSupport(
		content: string, 
		templateName: string, 
		meta: TemplateData = {},
		autoApplyKitStyles: boolean = true
	): Promise<string> {
		try {
			// 先应用基础模板
			let result = this.applyTemplate(content, templateName, meta);

			// 如果启用了自动应用套装样式，查找并应用对应套装
			if (autoApplyKitStyles) {
				const kitInfo = await this.getTemplateKitInfo(templateName);
				if (kitInfo.length > 0) {
					const kit = kitInfo[0]; // 使用第一个匹配的套装
					logger.info(`[TemplateManager] Auto-applying kit styles for: ${kit.basicInfo.name}`);
					
					// 这里可以添加样式注入逻辑
					// 将套装的CSS变量和自定义样式注入到结果中
					if (kit.styleConfig.cssVariables || kit.styleConfig.customCSS) {
						result = this.injectKitStyles(result, kit);
					}
				}
			}

			return result;
		} catch (error) {
			logger.error('[TemplateManager] Error applying template with kit support:', error);
			return this.applyTemplate(content, templateName, meta);
		}
	}

	/**
	 * 向HTML结果中注入套装样式
	 * @param html HTML内容
	 * @param kit 模板套装
	 */
	private injectKitStyles(html: string, kit: TemplateKit): string {
		try {
			let styles = '';

			// 添加CSS变量
			if (kit.styleConfig.cssVariables) {
				styles += ':root {\n';
				for (const [key, value] of Object.entries(kit.styleConfig.cssVariables)) {
					styles += `  ${key}: ${value};\n`;
				}
				styles += '}\n';
			}

			// 添加自定义CSS
			if (kit.styleConfig.customCSS) {
				styles += kit.styleConfig.customCSS;
			}

			// 注入样式到HTML
			if (styles) {
				const styleTag = `<style>\n${styles}\n</style>`;
				
				// 尝试在head标签中插入，如果没有head则在开头插入
				if (html.includes('<head>')) {
					html = html.replace('<head>', `<head>\n${styleTag}`);
				} else if (html.includes('</head>')) {
					html = html.replace('</head>', `${styleTag}\n</head>`);
				} else {
					html = styleTag + '\n' + html;
				}
			}

			return html;
		} catch (error) {
			logger.error('[TemplateManager] Error injecting kit styles:', error);
			return html;
		}
	}
}
