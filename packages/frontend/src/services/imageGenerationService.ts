import {logger} from "../../../shared/src/logger";

export interface ImageGenerationParams {
	prompt: string;
	style: string;
	aspectRatio: string;
	width: number;
	height: number;
}

export interface ImageGenerationResult {
	success: boolean;
	imageUrl?: string;
	error?: string;
}

export class ImageGenerationService {
	private static instance: ImageGenerationService;
	private baseUrl: string = '/api/image-generation';

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
			// 首先尝试调用实际的API（如果配置了）
			const apiResult = await this.tryApiGeneration(params);
			if (apiResult.success) {
				return apiResult;
			}

			// 如果API调用失败，使用本地模拟生成
			return this.generateMockImage(params);
		} catch (error) {
			logger.error('[ImageGenerationService] 图像生成失败', error);
			return {
				success: false,
				error: '图像生成服务暂时不可用'
			};
		}
	}

	private async tryApiGeneration(params: ImageGenerationParams): Promise<ImageGenerationResult> {
		try {
			const response = await fetch(`${this.baseUrl}/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				throw new Error(`API调用失败: ${response.status}`);
			}

			const data = await response.json();
			logger.info('[ImageGenerationService] API生成成功', {imageUrl: data.imageUrl});

			return {
				success: true,
				imageUrl: data.imageUrl
			};
		} catch (error) {
			logger.warn('[ImageGenerationService] API调用失败，将使用模拟生成', error);
			return {success: false, error: error instanceof Error ? error.message : 'Unknown error'};
		}
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
