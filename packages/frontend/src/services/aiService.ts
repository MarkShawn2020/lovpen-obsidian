import { ViteReactSettings, AIModel } from '../types';
import { logger } from '../../../shared/src/logger';

// ============ 持久化模型缓存 ============
const CACHE_KEY = 'lovpen-model-cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24小时缓存

interface ModelCacheEntry {
	models: AIModel[];
	timestamp: number;
}

interface ModelCacheStore {
	claude?: ModelCacheEntry;
	openrouter?: ModelCacheEntry;
	zenmux?: ModelCacheEntry;
}

// 从 localStorage 读取缓存
function getModelCache(): ModelCacheStore {
	try {
		const stored = localStorage.getItem(CACHE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		logger.warn('Failed to read model cache from localStorage:', e);
	}
	return {};
}

// 写入 localStorage 缓存
function setModelCache(cache: ModelCacheStore): void {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch (e) {
		logger.warn('Failed to write model cache to localStorage:', e);
	}
}

// 获取指定 provider 的缓存
function getCachedModels(provider: 'claude' | 'openrouter' | 'zenmux'): AIModel[] | null {
	const cache = getModelCache();
	const entry = cache[provider];
	if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
		logger.info(`Using cached ${provider} models (${entry.models.length} models)`);
		return entry.models;
	}
	return null;
}

// 设置指定 provider 的缓存
function setCachedModels(provider: 'claude' | 'openrouter' | 'zenmux', models: AIModel[]): void {
	const cache = getModelCache();
	cache[provider] = { models, timestamp: Date.now() };
	setModelCache(cache);
}

// 空模型列表 - 需要通过 API 动态获取
export const CLAUDE_MODELS: AIModel[] = [];
export const OPENROUTER_MODELS: AIModel[] = [];
export const ZENMUX_MODELS: AIModel[] = [];

// ============ 动态模型获取 ============

// 从 Anthropic API 获取模型列表
export async function fetchClaudeModels(apiKey: string): Promise<AIModel[]> {
	// 优先使用 localStorage 缓存
	const cached = getCachedModels('claude');
	if (cached) {
		return cached;
	}

	if (!window.lovpenReactAPI?.requestUrl) {
		logger.warn('requestUrl not available, using fallback models');
		return CLAUDE_MODELS as AIModel[];
	}

	try {
		const response = await window.lovpenReactAPI.requestUrl({
			url: 'https://api.anthropic.com/v1/models',
			method: 'GET',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			}
		});

		if (response.status !== 200) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = response.json;
		const models: AIModel[] = (data.data || []).map((m: any) => ({
			id: m.id,
			name: m.display_name || m.id,
			description: inferDescription(m.id),
			category: inferCategory(m.id),
			pricing: inferPricing(m.id),
			recommended: m.id.includes('haiku-4-5')
		}));

		// 按类型排序: fast -> balanced -> powerful
		models.sort((a, b) => {
			const order = { fast: 0, balanced: 1, powerful: 2 };
			return order[a.category] - order[b.category];
		});

		// 持久化到 localStorage
		setCachedModels('claude', models);
		logger.info(`Fetched ${models.length} Claude models from API`);
		return models;
	} catch (error) {
		logger.error('Failed to fetch Claude models:', error);
		return CLAUDE_MODELS as AIModel[];
	}
}

// 从 OpenRouter API 获取模型列表
export async function fetchOpenRouterModels(apiKey: string): Promise<AIModel[]> {
	// 优先使用 localStorage 缓存
	const cached = getCachedModels('openrouter');
	if (cached) {
		return cached;
	}

	if (!window.lovpenReactAPI?.requestUrl) {
		return OPENROUTER_MODELS as AIModel[];
	}

	try {
		const response = await window.lovpenReactAPI.requestUrl({
			url: 'https://openrouter.ai/api/v1/models',
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`
			}
		});

		if (response.status !== 200) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = response.json;
		// OpenRouter 返回 { data: [...] } 格式
		const allModels = data.data || data || [];

		// 筛选推荐模型 (主流厂商的热门模型)
		const preferredPrefixes = ['openai/', 'anthropic/', 'google/', 'deepseek/', 'meta-llama/', 'qwen/', 'x-ai/'];
		const filtered = allModels.filter((m: any) =>
			preferredPrefixes.some(p => m.id?.startsWith(p))
		).slice(0, 20); // 限制数量

		const models: AIModel[] = filtered.map((m: any) => ({
			id: m.id,
			name: m.name || m.id.split('/').pop(),
			description: m.description?.slice(0, 30) || inferDescription(m.id),
			category: inferCategoryFromContext(m),
			pricing: inferPricingFromCost(m),
			recommended: m.id === 'openai/gpt-5-mini' || m.id === 'anthropic/claude-haiku-4.5'
		}));

		// 持久化到 localStorage
		setCachedModels('openrouter', models);
		logger.info(`Fetched ${models.length} OpenRouter models from API`);
		return models;
	} catch (error) {
		logger.error('Failed to fetch OpenRouter models:', error);
		return OPENROUTER_MODELS as AIModel[];
	}
}

// 从 ZenMux 前端 API 获取模型列表
export async function fetchZenMuxModels(_apiKey: string): Promise<AIModel[]> {
	// 优先使用 localStorage 缓存
	const cached = getCachedModels('zenmux');
	if (cached) {
		return cached;
	}

	if (!window.lovpenReactAPI?.requestUrl) {
		logger.warn('[ZenMux] requestUrl not available');
		return ZENMUX_MODELS as AIModel[];
	}

	const apiUrl = 'https://zenmux.ai/api/frontend/model/listByFilter';
	logger.info(`[ZenMux] Fetching models from: ${apiUrl}`);

	try {
		// ZenMux 使用前端 API 获取模型列表，不需要认证
		// 注意：Obsidian requestUrl 可能对某些 headers 敏感，尝试最小化 headers
		const response = await window.lovpenReactAPI.requestUrl({
			url: apiUrl,
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		});

		logger.info(`[ZenMux] Response status: ${response.status}`);

		if (response.status !== 200) {
			logger.error(`[ZenMux] API returned non-200 status: ${response.status}, text: ${response.text?.slice(0, 200)}`);
			throw new Error(`API error: ${response.status}`);
		}

		const data = response.json;
		logger.debug('[ZenMux] Response data keys:', Object.keys(data || {}));

		// ZenMux 前端 API 返回格式: { success: true, data: [...] }
		const allModels = data?.data || data?.data?.list || data?.list || [];
		logger.info(`[ZenMux] Found ${allModels.length} models`);

		const models: AIModel[] = allModels.map((m: any) => ({
			id: m.slug || m.id,
			name: m.name || m.slug?.split('/').pop() || m.id,
			description: m.description?.slice(0, 30) || '',
			category: 'balanced' as const,
			pricing: 'medium' as const,
			recommended: false
		}));

		// 持久化到 localStorage
		setCachedModels('zenmux', models);
		logger.info(`[ZenMux] Cached ${models.length} models to localStorage`);
		return models;
	} catch (error: any) {
		// 提取更详细的错误信息
		const errorMsg = error?.message || String(error);
		const errorName = error?.name || 'Unknown';
		const errorStack = error?.stack?.split('\n').slice(0, 3).join('\n') || '';

		logger.error(`[ZenMux] Failed to fetch models:`, {
			name: errorName,
			message: errorMsg,
			url: apiUrl,
			stack: errorStack
		});

		// 重新抛出错误，让上层能感知到具体问题
		throw new Error(`ZenMux API 请求失败: ${errorMsg}`);
	}
}

// 清除模型缓存
export function clearModelCache(provider?: 'claude' | 'openrouter' | 'zenmux') {
	const cache = getModelCache();
	if (provider) {
		delete cache[provider];
	} else {
		// 清除所有
		localStorage.removeItem(CACHE_KEY);
		return;
	}
	setModelCache(cache);
}

// 辅助函数: 从模型ID推断描述
function inferDescription(id: string): string {
	if (id.includes('haiku')) return '快速高效';
	if (id.includes('sonnet')) return '平衡智能';
	if (id.includes('opus')) return '最强推理';
	if (id.includes('gpt-5') && id.includes('mini')) return '快速经济';
	if (id.includes('gpt-5')) return 'OpenAI旗舰';
	if (id.includes('gemini') && id.includes('flash')) return 'Google快速';
	if (id.includes('gemini') && id.includes('pro')) return 'Google旗舰';
	if (id.includes('deepseek')) return '深度推理';
	if (id.includes('qwen')) return '通义千问';
	if (id.includes('llama')) return 'Meta开源';
	if (id.includes('grok')) return 'xAI模型';
	return '';
}

// 辅助函数: 从模型ID推断类别
function inferCategory(id: string): 'fast' | 'balanced' | 'powerful' {
	if (id.includes('haiku') || id.includes('mini') || id.includes('flash') || id.includes('nano')) {
		return 'fast';
	}
	if (id.includes('opus') || id.includes('pro') || id.includes('max') || id.includes('405b')) {
		return 'powerful';
	}
	return 'balanced';
}

// 辅助函数: 从模型ID推断价格
function inferPricing(id: string): 'low' | 'medium' | 'high' {
	if (id.includes('haiku') || id.includes('mini') || id.includes('flash') || id.includes('nano')) {
		return 'low';
	}
	if (id.includes('opus') || id.includes('pro') || id.includes('max')) {
		return 'high';
	}
	return 'medium';
}

// 辅助函数: 从上下文推断类别
function inferCategoryFromContext(m: any): 'fast' | 'balanced' | 'powerful' {
	const id = m.id || '';
	const ctx = m.context_length || 0;
	if (id.includes('mini') || id.includes('flash') || id.includes('haiku') || id.includes('nano')) {
		return 'fast';
	}
	if (id.includes('opus') || id.includes('pro') || id.includes('max') || ctx > 500000) {
		return 'powerful';
	}
	return 'balanced';
}

// 辅助函数: 从成本推断价格
function inferPricingFromCost(m: any): 'low' | 'medium' | 'high' {
	const pricing = m.pricing || {};
	const inputCost = parseFloat(pricing.prompt || pricing.input || '0');
	if (inputCost < 0.5) return 'low';
	if (inputCost > 5) return 'high';
	return 'medium';
}

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
	} else if (provider === 'zenmux') {
		return analyzeWithZenMux(content, filename, promptTemplate, settings, frontmatter);
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
	if (!settings.aiModel) {
		throw new Error('请选择或输入Claude模型ID');
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
			model: settings.aiModel,
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
	if (!settings.openRouterModel) {
		throw new Error('请选择或输入OpenRouter模型ID');
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
			model: settings.openRouterModel,
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

// 使用ZenMux API分析（OpenAI兼容协议）
async function analyzeWithZenMux(
	content: string,
	filename: string,
	promptTemplate: string,
	settings: ViteReactSettings,
	frontmatter: any
): Promise<ArticleInfoResult> {
	if (!settings.zenmuxApiKey) {
		throw new Error('请配置ZenMux API密钥');
	}
	if (!settings.zenmuxModel) {
		throw new Error('请选择或输入ZenMux模型ID');
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

	logger.info('Using ZenMux API for analysis');

	// 构建JSON Schema
	const jsonSchema = {
		name: 'article_metadata',
		strict: true,
		schema: {
			type: 'object',
			properties: {
				articleTitle: { type: 'string', description: '文章标题' },
				articleSubtitle: { type: 'string', description: '副标题或摘要' },
				episodeNum: { type: 'string', description: '期数' },
				seriesName: { type: 'string', description: '系列名称' },
				tags: { type: 'array', items: { type: 'string' }, description: '标签数组' },
				author: { type: 'string', description: '作者' },
				publishDate: { type: 'string', description: '发布日期' },
				recommendation: { type: 'string', description: '推荐语' }
			} as any,
			required: ['articleTitle', 'articleSubtitle', 'tags', 'author', 'publishDate', 'recommendation'],
			additionalProperties: false
		}
	};

	if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
		throw new Error('此功能仅在Obsidian环境中可用');
	}

	const requestUrl = window.lovpenReactAPI.requestUrl;
	const response = await requestUrl({
		url: 'https://zenmux.ai/api/v1/chat/completions',
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${settings.zenmuxApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: settings.zenmuxModel,
			messages: [{ role: 'user', content: prompt }],
			response_format: { type: 'json_schema', json_schema: jsonSchema }
		})
	});

	if (response.status !== 200) {
		const errorData = response.json;
		throw new Error(`ZenMux API调用失败: ${errorData?.error?.message || response.status}`);
	}

	const result = response.json;
	const aiResponse = result.choices[0].message.content;

	try {
		// 尝试直接解析
		return JSON.parse(aiResponse);
	} catch {
		// 如果失败，尝试提取 markdown 代码块中的 JSON
		const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[1].trim());
			} catch {
				logger.error('解析ZenMux响应失败:', aiResponse);
				throw new Error('无法解析ZenMux的响应格式');
			}
		}
		logger.error('解析ZenMux响应失败:', aiResponse);
		throw new Error('无法解析ZenMux的响应格式');
	}
}

// 测试API连接
export async function testAIConnection(settings: ViteReactSettings): Promise<void> {
	const provider = settings.aiProvider || 'claude';

	if (provider === 'openrouter') {
		return testOpenRouterConnection(settings);
	} else if (provider === 'zenmux') {
		return testZenMuxConnection(settings);
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
			model: settings.aiModel || 'claude-3-5-haiku-20241022',
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
			model: settings.openRouterModel,
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

// 测试ZenMux连接
async function testZenMuxConnection(settings: ViteReactSettings): Promise<void> {
	if (!settings.zenmuxApiKey) {
		throw new Error('请输入ZenMux API密钥');
	}

	if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
		throw new Error('此功能仅在Obsidian环境中可用');
	}

	const requestUrl = window.lovpenReactAPI.requestUrl;
	const response = await requestUrl({
		url: 'https://zenmux.ai/api/v1/chat/completions',
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${settings.zenmuxApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: settings.zenmuxModel,
			messages: [{ role: 'user', content: 'Hi' }],
			max_tokens: 10
		})
	});

	if (response.status !== 200) {
		const errorData = response.json;
		throw new Error(`API调用失败: ${errorData?.error?.message || response.status}`);
	}
}