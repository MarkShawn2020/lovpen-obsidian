import { ViteReactSettings } from '../types';
import { logger } from '../../../shared/src/logger';

// AI模型配置
export const OPENROUTER_MODELS = [
	{
		id: 'openai/gpt-4o',
		name: 'GPT-4o',
		description: 'OpenAI最新的多模态模型',
		category: 'powerful',
		pricing: 'medium'
	},
	{
		id: 'openai/gpt-4o-mini',
		name: 'GPT-4o Mini',
		description: '快速轻量版GPT-4o',
		category: 'fast',
		pricing: 'low'
	},
	{
		id: 'anthropic/claude-3.5-sonnet',
		name: 'Claude 3.5 Sonnet (via OpenRouter)',
		description: '通过OpenRouter访问Claude',
		category: 'balanced',
		pricing: 'medium'
	},
	{
		id: 'meta-llama/llama-3.1-405b-instruct',
		name: 'Llama 3.1 405B',
		description: 'Meta最强大的开源模型',
		category: 'powerful',
		pricing: 'high'
	},
	{
		id: 'google/gemini-2.0-flash-exp:free',
		name: 'Gemini 2.0 Flash (免费)',
		description: 'Google快速模型免费版',
		category: 'fast',
		pricing: 'low'
	}
];

// 文章信息数据结构
export interface ArticleInfoResult {
	articleTitle?: string;
	articleSubtitle?: string;
	episodeNum?: string;
	seriesName?: string;
	tags?: string[];
	author?: string;
	publishDate?: string;
	summary?: string;
	recommendation?: string;
}

// AI服务主函数
export async function analyzeContentWithAI(
	content: string,
	filename: string,
	promptTemplate: string,
	settings: ViteReactSettings,
	frontmatter: any = {}
): Promise<ArticleInfoResult> {
	const provider = settings.aiProvider || 'claude';
	
	if (provider === 'openrouter') {
		return analyzeWithOpenRouter(content, filename, promptTemplate, settings, frontmatter);
	} else {
		return analyzeWithClaude(content, filename, promptTemplate, settings, frontmatter);
	}
}

// 使用Claude API分析
async function analyzeWithClaude(
	content: string,
	filename: string,
	promptTemplate: string,
	settings: ViteReactSettings,
	frontmatter: any
): Promise<ArticleInfoResult> {
	if (!settings.authKey) {
		throw new Error('请配置Claude API密钥');
	}

	// 准备模板数据
	const templateData = {
		content: content,
		filename: filename,
		personalInfo: settings.personalInfo || {},
		frontmatter: frontmatter,
		today: new Date().toISOString().split('T')[0]
	};

	// 使用Handlebars渲染模板
	const Handlebars = (await import('handlebars')).default;
	const template = Handlebars.compile(promptTemplate);
	const prompt = template(templateData);

	logger.info('Using Claude API for analysis');

	// 调用Claude API
	if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
		throw new Error('此功能仅在Obsidian环境中可用');
	}
	
	const requestUrl = window.lovpenReactAPI.requestUrl;
	const response = await requestUrl({
		url: 'https://api.anthropic.com/v1/messages',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': settings.authKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: settings.aiModel || 'claude-3-5-haiku-latest',
			max_tokens: 1000,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		})
	});

	if (response.status !== 200) {
		throw new Error(`Claude API调用失败: ${response.status}`);
	}

	const result = response.json;
	const aiResponse = result.content[0].text;

	// 解析JSON响应
	try {
		return JSON.parse(aiResponse);
	} catch (parseError) {
		logger.warn('解析Claude响应失败，尝试提取JSON:', aiResponse);
		const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
		throw new Error('无法解析Claude的响应格式');
	}
}

// 使用OpenRouter API分析（结构化输出）
async function analyzeWithOpenRouter(
	content: string,
	filename: string,
	promptTemplate: string,
	settings: ViteReactSettings,
	frontmatter: any
): Promise<ArticleInfoResult> {
	if (!settings.openRouterApiKey) {
		throw new Error('请配置OpenRouter API密钥');
	}

	// 准备模板数据
	const templateData = {
		content: content,
		filename: filename,
		personalInfo: settings.personalInfo || {},
		frontmatter: frontmatter,
		today: new Date().toISOString().split('T')[0]
	};

	// 使用Handlebars渲染模板
	const Handlebars = (await import('handlebars')).default;
	const template = Handlebars.compile(promptTemplate);
	const prompt = template(templateData);

	logger.info('Using OpenRouter API with structured output');

	// 根据prompt判断是否为学术风格（是否需要summary）
	const isAcademicStyle = promptTemplate.includes('学术研究分析专家');

	// 构建JSON Schema
	const jsonSchema = {
		name: 'article_metadata',
		strict: true,
		schema: {
			type: 'object',
			properties: {
				articleTitle: {
					type: 'string',
					description: '文章标题'
				},
				articleSubtitle: {
					type: 'string',
					description: '副标题或摘要'
				},
				episodeNum: {
					type: 'string',
					description: '期数，格式如"第 X 期"'
				},
				seriesName: {
					type: 'string',
					description: '系列名称'
				},
				tags: {
					type: 'array',
					items: {
						type: 'string'
					},
					description: '相关标签数组，3-5个'
				},
				author: {
					type: 'string',
					description: '作者名称'
				},
				publishDate: {
					type: 'string',
					description: '发布日期，YYYY-MM-DD格式'
				},
				recommendation: {
					type: 'string',
					description: '推荐语，50-100字'
				}
			} as any,
			required: ['articleTitle', 'articleSubtitle', 'tags', 'author', 'publishDate', 'recommendation'],
			additionalProperties: false
		}
	};

	// 如果是学术风格，添加summary字段
	if (isAcademicStyle) {
		jsonSchema.schema.properties.summary = {
			type: 'string',
			description: '文章摘要，100-200字'
		};
		jsonSchema.schema.required.push('summary');
	}

	// 调用OpenRouter API
	if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
		throw new Error('此功能仅在Obsidian环境中可用');
	}
	
	const requestUrl = window.lovpenReactAPI.requestUrl;
	const response = await requestUrl({
		url: 'https://openrouter.ai/api/v1/chat/completions',
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${settings.openRouterApiKey}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://obsidian.md',
			'X-Title': 'LovPen Obsidian Plugin'
		},
		body: JSON.stringify({
			model: settings.openRouterModel || 'openai/gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: prompt
				}
			],
			response_format: {
				type: 'json_schema',
				json_schema: jsonSchema
			}
		})
	});

	if (response.status !== 200) {
		const errorData = response.json;
		throw new Error(`OpenRouter API调用失败: ${errorData?.error?.message || response.status}`);
	}

	const result = response.json;
	const aiResponse = result.choices[0].message.content;

	// OpenRouter的结构化输出应该直接返回JSON
	try {
		return JSON.parse(aiResponse);
	} catch (parseError) {
		logger.error('解析OpenRouter响应失败:', aiResponse);
		throw new Error('无法解析OpenRouter的响应格式');
	}
}

// 测试API连接
export async function testAIConnection(settings: ViteReactSettings): Promise<void> {
	const provider = settings.aiProvider || 'claude';
	
	if (provider === 'openrouter') {
		return testOpenRouterConnection(settings);
	} else {
		return testClaudeConnection(settings);
	}
}

// 测试Claude连接
async function testClaudeConnection(settings: ViteReactSettings): Promise<void> {
	if (!settings.authKey) {
		throw new Error('请输入Claude API密钥');
	}

	if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
		throw new Error('此功能仅在Obsidian环境中可用');
	}
	
	const requestUrl = window.lovpenReactAPI.requestUrl;
	const response = await requestUrl({
		url: 'https://api.anthropic.com/v1/messages',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': settings.authKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: settings.aiModel || 'claude-3-5-haiku-latest',
			max_tokens: 10,
			messages: [
				{
					role: 'user',
					content: '测试连接'
				}
			]
		})
	});

	if (response.status !== 200) {
		throw new Error(`API调用失败: ${response.status}`);
	}
}

// 测试OpenRouter连接
async function testOpenRouterConnection(settings: ViteReactSettings): Promise<void> {
	if (!settings.openRouterApiKey) {
		throw new Error('请输入OpenRouter API密钥');
	}

	if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
		throw new Error('此功能仅在Obsidian环境中可用');
	}
	
	const requestUrl = window.lovpenReactAPI.requestUrl;
	const response = await requestUrl({
		url: 'https://openrouter.ai/api/v1/chat/completions',
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${settings.openRouterApiKey}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://obsidian.md',
			'X-Title': 'LovPen Obsidian Plugin'
		},
		body: JSON.stringify({
			model: settings.openRouterModel || 'openai/gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: 'Hi'
				}
			],
			max_tokens: 10
		})
	});

	if (response.status !== 200) {
		const errorData = response.json;
		throw new Error(`API调用失败: ${errorData?.error?.message || response.status}`);
	}
}