import themesData from '../../../assets/themes.json';
import highlightsData from '../../../assets/highlights.json';

import {logger} from "../../../shared/src/logger";

export interface ThemeOption {
	name: string;
	className: string;
	desc?: string;
	author?: string;
}

export interface HighlightOption {
	name: string;
	url?: string;
}

export interface TemplateOption {
	name: string;
	filename: string;
}

export interface ResourceLoader {
	loadThemes(): Promise<ThemeOption[]>;

	loadHighlights(): Promise<HighlightOption[]>;

	loadTemplates(): Promise<TemplateOption[]>;
}

class LocalResourceLoader implements ResourceLoader {
	async loadThemes(): Promise<ThemeOption[]> {
		try {
			logger.debug('Loading themes from imported data');
			logger.debug('Loaded themes:', themesData.length);

			return themesData.map((theme: any) => ({
				name: theme.name,
				className: theme.className,
				desc: theme.desc,
				author: theme.author
			}));
		} catch (error) {
			console.error('Failed to load themes:', error);
			console.error('Using fallback themes');
			return [
				{name: "默认主题", className: "default"},
				{name: "深色主题", className: "dark"},
				{name: "浅色主题", className: "light"}
			];
		}
	}

	async loadHighlights(): Promise<HighlightOption[]> {
		try {
			logger.debug('Loading highlights from imported data');
			logger.debug('Loaded highlights:', highlightsData.length);

			return highlightsData.map((highlight: any) => ({
				name: highlight.name,
				url: highlight.url
			}));
		} catch (error) {
			console.error('Failed to load highlights:', error);
			console.error('Using fallback highlights');
			return [
				{name: "default"},
				{name: "github"},
				{name: "vscode"}
			];
		}
	}

	async loadTemplates(): Promise<TemplateOption[]> {
		try {
			logger.debug('Loading templates dynamically from backend API');
			
			// 尝试从后端API加载模板
			if (window.lovpenReactAPI && window.lovpenReactAPI.loadTemplates) {
				try {
					const templateNames = await window.lovpenReactAPI.loadTemplates();
					logger.info('Loaded templates from backend:', templateNames);
					
					// 转换为前端需要的格式，添加"不使用模板"选项
					const templates: TemplateOption[] = [
						{name: "不使用模板", filename: "none"}
					];
					
					// 添加从后端获取的模板
					templateNames.forEach((templateName: string) => {
						templates.push({
							name: templateName,
							filename: templateName
						});
					});
					
					return templates;
				} catch (apiError) {
					logger.error('Failed to load templates from backend API:', apiError);
					// 继续使用静态列表作为后备
				}
			}
			
			// 后备：使用静态列表
			logger.debug('Using static template list as fallback');
			return [
				{name: "不使用模板", filename: "none"},
				{name: "Bento 1", filename: "Bento 1"},
				{name: "Bento 2", filename: "Bento 2"},
				{name: "Bento 3", filename: "Bento 3"},
				{name: "Bento 4", filename: "Bento 4"},
				{name: "Bento 5", filename: "Bento 5"},
				{name: "张小珺风格", filename: "张小珺风格"},
				{name: "手工川 - 2", filename: "手工川 - 2"},
				{name: "手工川 - 3", filename: "手工川 - 3"},
				{name: "手工川 - 张小珺风格", filename: "手工川 - 张小珺风格"}
			];
		} catch (error) {
			console.error('Failed to load templates:', error);
			console.error('Using minimal fallback templates');
			return [
				{name: "不使用模板", filename: "none"},
				{name: "默认模板", filename: "default"},
				{name: "极简模板", filename: "minimal"}
			];
		}
	}
}

export const resourceLoader = new LocalResourceLoader();
