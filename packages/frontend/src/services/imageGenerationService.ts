import {logger} from "../../../shared/src/logger";
import {ViteReactSettings} from "../types";

export interface ImageGenerationParams {
	prompt: string;
	negativePrompt?: string;
	style: string;
	aspectRatio: string;
	width: number;
	height: number;
	settings?: ViteReactSettings;
	useNanoBananaPro?: boolean; // 使用 Nano Banana Pro 模型
}

export interface ImageGenerationResult {
	success: boolean;
	imageUrl?: string;
	error?: string;
}

export interface CoverPromptResult {
	success: boolean;
	positivePrompt?: string;
	negativePrompt?: string;
	error?: string;
}

export class ImageGenerationService {
	private static instance: ImageGenerationService;

	private constructor() {
	}

	static getInstance(): ImageGenerationService {
		if (!ImageGenerationService.instance) {
			ImageGenerationService.instance = new ImageGenerationService();
		}
		return ImageGenerationService.instance;
	}

	async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
		logger.info('[ImageGenerationService] 开始生成图像', params);

		try {
			// 检查是否配置了 ZenMux 并使用 ZenMux 作为 AI Provider
			if (params.settings?.aiProvider === 'zenmux' && params.settings?.zenmuxApiKey) {
				const zenmuxResult = await this.generateWithZenMux(params);
				if (zenmuxResult.success) {
					return zenmuxResult;
				}
				// ZenMux 失败时回退到 mock
				logger.warn('[ImageGenerationService] ZenMux生成失败，回退到模拟生成');
			}

			// 使用本地模拟生成
			return this.generateMockImage(params);
		} catch (error) {
			logger.error('[ImageGenerationService] 图像生成失败', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : '图像生成服务暂时不可用'
			};
		}
	}

	// 基于文章内容生成封面提示词
	async generateCoverPrompt(articleHTML: string, style: string, settings?: ViteReactSettings): Promise<CoverPromptResult> {
		if (!settings?.zenmuxApiKey) {
			return {success: false, error: '请先配置 ZenMux API 密钥'};
		}

		if (!settings?.zenmuxModel?.trim()) {
			return {success: false, error: '请先在 AI 设置中选择模型'};
		}

		if (!window.lovpenReactAPI?.requestUrl) {
			return {success: false, error: '此功能仅在 Obsidian 环境中可用'};
		}

		try {
			// 从 HTML 提取纯文本
			const parser = new DOMParser();
			const doc = parser.parseFromString(articleHTML, 'text/html');
			const textContent = doc.body.textContent || '';
			// 截取前 2000 字符作为分析内容
			const truncatedContent = textContent.substring(0, 2000);

			const styleDescMap: Record<string, string> = {
				realistic: 'photorealistic, 8k, highly detailed',
				illustration: 'digital illustration, vibrant colors, artistic',
				minimalist: 'minimalist, clean, modern design, simple composition',
				abstract: 'abstract art, geometric shapes, creative',
				vintage: 'vintage, retro, film grain, nostalgic'
			};
			const styleDesc = styleDescMap[style] || 'best quality, masterpiece';

			const systemPrompt = `You are an expert prompt engineer for image generation. Analyze the article content and generate an optimized prompt for creating a cover image.

Output format (respond with ONLY the JSON, no extra text):
{
  "positivePrompt": "detailed description with style descriptors and quality tags",
  "negativePrompt": "elements to avoid"
}

Guidelines:
1. The positive prompt should describe a visually appealing cover that captures the article's theme
2. Include style: ${styleDesc}
3. Add quality tags: best quality, masterpiece, ultra high res
4. Focus on visual elements, not text
5. Keep the prompt concise but descriptive (under 200 words)
6. The negative prompt should exclude: nsfw, lowres, bad anatomy, text, watermark, blurry`;

			const userPrompt = `Generate a cover image prompt for this article:\n\n${truncatedContent}`;

			logger.info('[ImageGenerationService] 生成封面提示词', {
				contentLength: truncatedContent.length,
				style,
				model: settings.zenmuxModel
			});

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
					messages: [
						{role: 'system', content: systemPrompt},
						{role: 'user', content: userPrompt}
					],
					max_tokens: 500
				})
			});

			if (response.status !== 200) {
				const errorData = response.json;
				throw new Error(errorData?.error?.message || `API调用失败: ${response.status}`);
			}

			const result = response.json;
			const aiResponse = result.choices[0].message.content;

			// 解析 JSON 响应
			const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				return {
					success: true,
					positivePrompt: parsed.positivePrompt,
					negativePrompt: parsed.negativePrompt
				};
			}

			throw new Error('无法解析 AI 响应');
		} catch (error) {
			logger.error('[ImageGenerationService] 生成提示词失败:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : '生成提示词失败'
			};
		}
	}

	// 使用 ZenMux (Gemini) 生成图片
	private async generateWithZenMux(params: ImageGenerationParams): Promise<ImageGenerationResult> {
		const {prompt, negativePrompt, style, aspectRatio, settings, useNanoBananaPro} = params;

		if (!settings?.zenmuxApiKey) {
			return {success: false, error: '请先配置 ZenMux API 密钥'};
		}

		if (!window.lovpenReactAPI?.requestUrl) {
			return {success: false, error: '此功能仅在 Obsidian 环境中可用'};
		}

		try {
			const requestUrl = window.lovpenReactAPI.requestUrl;

			// Nano Banana Pro 使用 VertexAI 格式
			if (useNanoBananaPro) {
				return await this.generateWithNanoBananaPro(prompt, negativePrompt, settings, requestUrl);
			}

			// 旧模型使用 OpenAI 兼容格式
			const stylePrompts: Record<string, string> = {
				realistic: '写实风格，高清细腻',
				illustration: '插画风格，色彩丰富',
				minimalist: '简约风格，留白清新',
				abstract: '抽象艺术风格',
				vintage: '复古胶片风格',
			};
			const styleDesc = stylePrompts[style] || '';
			const enhancedPrompt = `${prompt}。${styleDesc}。比例 ${aspectRatio}，适合用作文章封面图。`;

			logger.info('[ImageGenerationService] 使用 Gemini 2.0 Flash 生成图片', {prompt: enhancedPrompt.substring(0, 100)});

			const response = await requestUrl({
				url: 'https://zenmux.ai/api/v1/images/generations',
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${settings.zenmuxApiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					model: 'gemini-2.0-flash-exp-image-generation',
					prompt: enhancedPrompt,
					n: 1,
					response_format: 'b64_json'
				})
			});

			if (response.status !== 200) {
				const errorData = response.json;
				throw new Error(errorData?.error?.message || `API调用失败: ${response.status}`);
			}

			const result = response.json;

			// ZenMux 返回 OpenAI 兼容格式
			if (result.data && result.data[0]) {
				const imageData = result.data[0];
				let imageUrl: string;

				if (imageData.b64_json) {
					imageUrl = `data:image/png;base64,${imageData.b64_json}`;
				} else if (imageData.url) {
					imageUrl = imageData.url;
				} else {
					throw new Error('未获取到图片数据');
				}

				logger.info('[ImageGenerationService] ZenMux 生成成功');
				return {
					success: true,
					imageUrl
				};
			}

			throw new Error('API返回格式异常');
		} catch (error) {
			logger.error('[ImageGenerationService] ZenMux生成失败:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'ZenMux图片生成失败'
			};
		}
	}

	// 使用 Nano Banana Pro (Vertex AI 协议)
	private async generateWithNanoBananaPro(
		prompt: string,
		negativePrompt: string | undefined,
		settings: ViteReactSettings,
		requestUrl: typeof window.lovpenReactAPI.requestUrl
	): Promise<ImageGenerationResult> {
		const negPrompt = negativePrompt || 'nsfw, lowres, bad anatomy, text, watermark, blurry';
		const fullPrompt = `${prompt}\n\nNegative: ${negPrompt}`;

		logger.info('[ImageGenerationService] 使用 Nano Banana Pro 生成图片', {prompt: fullPrompt.substring(0, 100)});

		// 使用 Vertex AI 协议 (ZenMux 官方文档要求)
		const response = await requestUrl({
			url: 'https://zenmux.ai/api/vertex-ai/v1/models/google/gemini-3-pro-image-preview:generateContent',
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${settings.zenmuxApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				contents: [
					{
						role: 'user',
						parts: [{text: fullPrompt}]
					}
				],
				generationConfig: {
					responseModalities: ['TEXT', 'IMAGE']
				}
			})
		});

		if (response.status !== 200) {
			const errorData = response.json;
			logger.error('[ImageGenerationService] Nano Banana Pro 错误响应', {
				status: response.status,
				error: JSON.stringify(errorData)
			});
			throw new Error(errorData?.error?.message || `Nano Banana Pro 调用失败: ${response.status}`);
		}

		const result = response.json;
		logger.info('[ImageGenerationService] Nano Banana Pro 响应', {hasCandiates: !!result.candidates});

		// 解析 Vertex AI 响应格式
		if (result.candidates && result.candidates[0]?.content?.parts) {
			for (const part of result.candidates[0].content.parts) {
				if (part.inlineData?.data) {
					const mimeType = part.inlineData.mimeType || 'image/png';
					const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
					logger.info('[ImageGenerationService] Nano Banana Pro 生成成功');
					return {success: true, imageUrl};
				}
			}
		}

		logger.error('[ImageGenerationService] Nano Banana Pro 响应格式异常', {result: JSON.stringify(result).substring(0, 500)});
		throw new Error('Nano Banana Pro 未返回图片数据');
	}

	private generateMockImage(params: ImageGenerationParams): ImageGenerationResult {
		logger.info('[ImageGenerationService] 使用模拟生成');

		const {prompt, style, width, height} = params;

		// 根据风格选择背景颜色
		const styleColors: Record<string, string> = {
			realistic: '#4a90e2',
			illustration: '#f5a623',
			minimalist: '#7ed321',
			abstract: '#bd10e0',
			tech: '#50e3c2'
		};

		const backgroundColor = styleColors[style] || '#cccccc';
		const textColor = this.getContrastColor(backgroundColor);

		// 生成SVG图像
		const svg = `
			<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:0.8" />
						<stop offset="100%" style="stop-color:${this.lightenColor(backgroundColor, 20)};stop-opacity:0.9" />
					</linearGradient>
					<pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
						<path d="M 40 0 L 0 0 0 40" fill="none" stroke="${textColor}" stroke-width="0.5" opacity="0.1"/>
					</pattern>
				</defs>
				
				<rect width="100%" height="100%" fill="url(#bgGradient)"/>
				<rect width="100%" height="100%" fill="url(#gridPattern)"/>
				
				<!-- 装饰性图形 -->
				<circle cx="${width * 0.2}" cy="${height * 0.3}" r="30" fill="${textColor}" opacity="0.1"/>
				<circle cx="${width * 0.8}" cy="${height * 0.7}" r="20" fill="${textColor}" opacity="0.1"/>
				
				<!-- 主要文本 -->
				<text x="50%" y="45%" text-anchor="middle" dominant-baseline="middle" 
					  fill="${textColor}" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
					${this.truncateText(prompt, 40)}
				</text>
				
				<!-- 风格标签 -->
				<text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" 
					  fill="${textColor}" font-family="Arial, sans-serif" font-size="12" opacity="0.8">
					${style.charAt(0).toUpperCase() + style.slice(1)} Style
				</text>
				
				<!-- 尺寸信息 -->
				<text x="50%" y="85%" text-anchor="middle" dominant-baseline="middle" 
					  fill="${textColor}" font-family="Arial, sans-serif" font-size="10" opacity="0.6">
					${width} × ${height}
				</text>
			</svg>
		`;

		const imageUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

		logger.info('[ImageGenerationService] 模拟生成完成', {
			prompt: prompt.substring(0, 50),
			style,
			dimensions: `${width}x${height}`
		});

		return {
			success: true,
			imageUrl
		};
	}

	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}

	private getContrastColor(hexColor: string): string {
		// 简单的对比色计算
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 128 ? '#000000' : '#ffffff';
	}

	private lightenColor(hexColor: string, percent: number): string {
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);

		const newR = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
		const newG = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
		const newB = Math.min(255, Math.floor(b + (255 - b) * percent / 100));

		return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
	}
}

export const imageGenerationService = ImageGenerationService.getInstance();
