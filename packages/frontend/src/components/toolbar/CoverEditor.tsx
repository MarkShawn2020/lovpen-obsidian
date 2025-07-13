import React, {useCallback, useEffect, useState} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../ui/tabs';
import {PersistentFileManager} from './PersistentFileManager';
import {persistentStorageService} from '../../services/persistentStorage';

import {CoverAspectRatio, CoverImageSource} from "@/components/toolbar/cover/types";
import {logger} from "../../../../shared/src/logger";
import {imageGenerationService} from '@/services/imageGenerationService';

interface ExtractedImage {
	src: string;
	alt: string;
	width?: number;
	height?: number;
}

interface AIGenerateParams {
	prompt: string;
	style: string;
	aspectRatio: CoverAspectRatio;
}

interface GenerationStatus {
	isGenerating: boolean;
	progress: number;
	message: string;
}

interface CoverEditorProps {
	coverNumber: 1 | 2;
	aspectRatio: CoverAspectRatio;
	selectedImages: ExtractedImage[];
	onCreateCover: (imageUrl: string, source: CoverImageSource) => Promise<void>;
	getDimensions: () => { width: number; height: number; aspectRatio: CoverAspectRatio };
	generationStatus: GenerationStatus;
	setGenerationStatus: (status: GenerationStatus) => void;
	generationError: string;
	setGenerationError: (error: string) => void;
}

export const CoverEditor: React.FC<CoverEditorProps> = ({
															coverNumber,
															aspectRatio,
															selectedImages,
															onCreateCover,
															getDimensions,
															generationStatus,
															setGenerationStatus,
															generationError,
															setGenerationError
														}) => {
	const [activeTab, setActiveTab] = useState<CoverImageSource>(() => {
		try {
			const storageKey = `lovpen-cover-editor-active-tab-${coverNumber}`;
			const saved = localStorage.getItem(storageKey) as CoverImageSource;
			return saved || 'article';
		} catch {
			return 'article';
		}
	});
	const [aiPrompt, setAiPrompt] = useState<string>('');
	const [aiStyle, setAiStyle] = useState<string>('realistic');
	const [generatedImages, setGeneratedImages] = useState<string[]>([]);
	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');

	// 初始化时加载持久化数据
	useEffect(() => {
		const loadPersistedData = async () => {
			try {
				const storageKey = `cover-editor-${coverNumber}`;
				const saved = localStorage.getItem(storageKey);
				if (saved) {
					const data = JSON.parse(saved);
					setActiveTab(data.activeTab || 'article');
					setAiPrompt(data.aiPrompt || '');
					setAiStyle(data.aiStyle || 'realistic');
					setGeneratedImages(data.generatedImages || []);
					setTitle(data.title || '');
					setDescription(data.description || '');

					logger.info(`[CoverEditor] 加载封面${coverNumber}持久化数据`);
				}
			} catch (error) {
				logger.error(`[CoverEditor] 加载封面${coverNumber}持久化数据失败:`, error);
			}
		};

		loadPersistedData();
	}, [coverNumber]);

	// 保存持久化数据
	const savePersistedData = useCallback(() => {
		try {
			const storageKey = `cover-editor-${coverNumber}`;
			const data = {
				activeTab,
				aiPrompt,
				aiStyle,
				generatedImages,
				title,
				description,
				updatedAt: new Date().toISOString()
			};
			localStorage.setItem(storageKey, JSON.stringify(data));
			logger.debug(`[CoverEditor] 保存封面${coverNumber}持久化数据`);
		} catch (error) {
			logger.error(`[CoverEditor] 保存封面${coverNumber}持久化数据失败:`, error);
		}
	}, [coverNumber, activeTab, aiPrompt, aiStyle, generatedImages, title, description]);

	// 监听状态变化并保存
	useEffect(() => {
		savePersistedData();
	}, [savePersistedData]);

	const generateAIImage = useCallback(async (params: AIGenerateParams) => {
		setGenerationStatus({
			isGenerating: true,
			progress: 0,
			message: '正在准备生成...'
		});
		setGenerationError('');
		logger.info('[CoverEditor] 开始生成AI图片', params);

		try {
			const progressUpdates = [
				{progress: 20, message: '正在处理提示词...'},
				{progress: 40, message: '正在生成图像...'},
				{progress: 60, message: '正在优化细节...'},
				{progress: 80, message: '正在后处理...'},
				{progress: 100, message: '生成完成!'}
			];

			for (const update of progressUpdates) {
				setGenerationStatus({
					isGenerating: true,
					progress: update.progress,
					message: update.message
				});
				await new Promise(resolve => setTimeout(resolve, 500));
			}

			const dimensions = getDimensions();
			const result = await imageGenerationService.generateImage({
				prompt: params.prompt,
				style: params.style,
				aspectRatio: params.aspectRatio,
				width: dimensions.width,
				height: dimensions.height
			});

			if (result.success && result.imageUrl) {
				setGeneratedImages(prev => {
					const newImages = [...prev, result.imageUrl!];

					// 保存AI生成的图片URL到持久化存储（不需要保存为文件，只保存URL）
					persistentStorageService.saveFileFromUrl(
						result.imageUrl!,
						`ai-generated-cover-${coverNumber}-${Date.now()}.png`,
						'image/png'
					).catch(error => {
						logger.error('[CoverEditor] 保存AI生成图片失败:', error);
					});

					return newImages;
				});
				logger.info(`[CoverEditor] 封面${coverNumber} AI图片生成成功`);
			} else {
				throw new Error(result.error || '生成失败');
			}
		} catch (error) {
			logger.error('[CoverEditor] AI图片生成失败', error);
			setGenerationError(error instanceof Error ? error.message : '生成失败，请重试');
		} finally {
			setGenerationStatus({
				isGenerating: false,
				progress: 0,
				message: ''
			});
		}
	}, [coverNumber, getDimensions, setGenerationStatus, setGenerationError]);


	// 删除AI生成的图片
	const handleDeleteGeneratedImage = useCallback(async (url: string, index: number) => {
		try {
			setGeneratedImages(prev => prev.filter((_, i) => i !== index));
			// 删除后立即保存持久化数据
			setTimeout(() => savePersistedData(), 100);
			logger.info(`[CoverEditor] 删除AI生成图片 ${index + 1}`);
		} catch (error) {
			logger.error(`[CoverEditor] 删除AI生成图片失败:`, error);
		}
	}, [savePersistedData]);

	const renderImageGrid = useCallback((images: string[], onImageClick: (url: string) => Promise<void>, onImageDelete?: (url: string, index: number) => Promise<void>) => {
		logger.info(`[CoverEditor] 封面${coverNumber}渲染图片网格`, {
			imageCount: images.length,
			firstImageUrl: images[0]?.substring(0, 100)
		});

		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3">
				{images.map((imageUrl, index) => (
					<div
						key={index}
						className="relative border border-gray-200 rounded overflow-hidden hover:border-blue-500 transition-colors group"
					>
						<img
							src={imageUrl}
							alt={`Image ${index + 1}`}
							className="w-full h-16 sm:h-20 object-cover cursor-pointer"
							onClick={() => onImageClick(imageUrl)}
							onLoad={(e) => {
								logger.info(`[CoverEditor] 封面${coverNumber}图片加载成功 ${index + 1}`, {
									src: imageUrl.substring(0, 100),
									naturalWidth: e.currentTarget.naturalWidth,
									naturalHeight: e.currentTarget.naturalHeight
								});
							}}
							onError={(e) => {
								logger.error(`[CoverEditor] 封面${coverNumber}图片加载失败 ${index + 1}`, {
									src: imageUrl,
									error: e
								});
							}}
						/>
						<div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white text-xs sm:text-sm p-1">
							{index + 1}
						</div>
						{onImageDelete && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onImageDelete(imageUrl, index);
								}}
								className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
								title="删除图片"
							>
								×
							</button>
						)}
					</div>
				))}
			</div>
		);
	}, [coverNumber]);

	return (
		<div className="space-y-4">
			<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
				🖼️ 封面{coverNumber}图片来源
			</label>
			<Tabs value={activeTab} onValueChange={(value) => {
				const tabValue = value as CoverImageSource;
				setActiveTab(tabValue);
				// 持久化保存选中的tab
				try {
					const storageKey = `lovpen-cover-editor-active-tab-${coverNumber}`;
					localStorage.setItem(storageKey, tabValue);
				} catch (error) {
					console.warn('Failed to save cover editor tab to localStorage:', error);
				}
				savePersistedData();
			}}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="article" className="text-xs sm:text-sm px-2 sm:px-4">文中图片</TabsTrigger>
					<TabsTrigger value="library" className="text-xs sm:text-sm px-2 sm:px-4">我的档案库</TabsTrigger>
					<TabsTrigger value="ai" className="text-xs sm:text-sm px-2 sm:px-4">AI生成</TabsTrigger>
				</TabsList>

				<TabsContent value="article" className="mt-3 sm:mt-4">
					<div className="space-y-3 sm:space-y-4">
						<p className="text-xs sm:text-sm text-gray-600">
							从文章中选择图片制作封面
						</p>
						<div className="mb-2 text-xs sm:text-sm text-gray-600">
							调试信息: 找到 {selectedImages.length} 张图片
							{selectedImages.length > 0 && (
								<div className="mt-1">
									第一张: {selectedImages[0]?.src?.substring(0, 80)}...
								</div>
							)}
						</div>

						{selectedImages.length > 0 ? (
							renderImageGrid(
								selectedImages.map(img => img.src),
								async (url) => await onCreateCover(url, 'article')
							)
						) : (
							<div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
								文章中没有找到图片
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="library" className="mt-3 sm:mt-4">
					<PersistentFileManager
						onFileSelect={async (fileUrl) => await onCreateCover(fileUrl, 'upload')}
						acceptedTypes={['image/*']}
						title={`封面${coverNumber}档案库`}
					/>
				</TabsContent>


				<TabsContent value="ai" className="mt-3 sm:mt-4">
					<div className="space-y-3 sm:space-y-4">
						<div className="space-y-3 sm:space-y-4">
							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
									描述你想要的封面
								</label>
								<textarea
									value={aiPrompt}
									onChange={(e) => setAiPrompt(e.target.value)}
									placeholder="例如：一个现代简约的技术博客封面，蓝色主色调..."
									className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 sm:h-24 resize-none text-xs sm:text-sm"
								/>
							</div>

							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
									风格选择
								</label>
								<select
									value={aiStyle}
									onChange={(e) => setAiStyle(e.target.value)}
									className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
								>
									<option value="realistic">写实风格</option>
									<option value="illustration">插画风格</option>
									<option value="minimalist">简约风格</option>
									<option value="abstract">抽象风格</option>
									<option value="vintage">复古风格</option>
								</select>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
								<div>
									<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
										标题
									</label>
									<input
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="封面标题"
										className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
									/>
								</div>
								<div>
									<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
										副标题
									</label>
									<input
										type="text"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="副标题或描述"
										className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
									/>
								</div>
							</div>

							<button
								onClick={() => generateAIImage({prompt: aiPrompt, style: aiStyle, aspectRatio})}
								disabled={generationStatus.isGenerating || !aiPrompt.trim()}
								className="w-full px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
							>
								{generationStatus.isGenerating ? '正在生成...' : `生成封面${coverNumber}AI图片`}
							</button>

							{generationStatus.isGenerating && (
								<div className="space-y-2">
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-purple-500 h-2 rounded-full transition-all duration-300"
											style={{width: `${generationStatus.progress}%`}}
										/>
									</div>
									<p className="text-xs sm:text-sm text-gray-600 text-center">{generationStatus.message}</p>
								</div>
							)}

							{generationError && (
								<div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-xs sm:text-sm text-red-600">{generationError}</p>
								</div>
							)}
						</div>

						{generatedImages.length > 0 && (
							<div>
								<h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">AI生成的图片</h4>
								{renderImageGrid(
									generatedImages,
									async (url) => await onCreateCover(url, 'ai'),
									handleDeleteGeneratedImage
								)}
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};
