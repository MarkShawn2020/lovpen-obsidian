import React, {useCallback, useEffect, useState} from 'react';
import {Drawer, DrawerDescription, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle,} from '../ui/drawer';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../ui/tabs';
import {Button} from '../ui/button';
import {ImageGrid} from './ImageGrid';
import {CropArea, ImageCropModal} from './ImageCropModal';
import {CoverAspectRatio, CoverImageSource, ExtractedImage, GenerationStatus} from './cover/types';
import {Image as ImageIcon, Palette, Sparkles, Settings} from 'lucide-react';
import {imageGenerationService} from '@/services/imageGenerationService';
import {logger} from '../../../../shared/src/logger';
import {ViteReactSettings, UploadedImage} from '../../types';
import {useShadowRoot} from '../../providers/ShadowRootProvider';

interface ImageSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImageSelect: (imageUrl: string, source: CoverImageSource) => void;
	coverNumber: 1 | 2;
	aspectRatio: CoverAspectRatio;
	selectedImages: ExtractedImage[];
	getDimensions: () => { width: number; height: number; aspectRatio: CoverAspectRatio };
	settings?: ViteReactSettings;
	onOpenAISettings?: () => void;
	uploadedImages?: UploadedImage[];
}

export const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
																			isOpen,
																			onClose,
																			onImageSelect,
																			coverNumber,
																			aspectRatio,
																			selectedImages,
																			getDimensions,
																			settings,
																			onOpenAISettings,
																			uploadedImages = []
																		}) => {
	const [activeTab, setActiveTab] = useState<CoverImageSource>('article');
	const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

	// 图片裁切相关状态
	const [showCropModal, setShowCropModal] = useState<boolean>(false);
	const [imageToProcess, setImageToProcess] = useState<string>('');
	const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');

	// AI 生成相关状态
	const [aiPrompt, setAiPrompt] = useState<string>('');
	const [aiStyle, setAiStyle] = useState<string>('realistic');
	const [generatedImages, setGeneratedImages] = useState<string[]>([]);
	const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
		isGenerating: false,
		progress: 0,
		message: ''
	});
	const [generationError, setGenerationError] = useState<string>('');

	// 重置状态当模态框关闭时
	useEffect(() => {
		if (!isOpen) {
			setSelectedImageUrl('');
			setGenerationError('');
			setShowCropModal(false);
			setImageToProcess('');
			setCroppedImageUrl('');
		}
	}, [isOpen]);

	const handleImageSelect = (imageUrl: string) => {
		setImageToProcess(imageUrl);
		setShowCropModal(true);
	};

	const handleCropComplete = (croppedUrl: string, cropArea: CropArea) => {
		setCroppedImageUrl(croppedUrl);
		setSelectedImageUrl(croppedUrl);
		setShowCropModal(false);
	};

	const handleCropCancel = () => {
		setShowCropModal(false);
		setImageToProcess('');
	};

	const handleConfirm = () => {
		if (selectedImageUrl) {
			onImageSelect(selectedImageUrl, activeTab);
			onClose();
		}
	};

	// 检查 AI 生成是否可用（ZenMux 配置了密钥）
	const isAIGenerationAvailable = settings?.aiProvider === 'zenmux' && !!settings?.zenmuxApiKey?.trim();

	const generateAIImage = useCallback(async () => {
		if (!aiPrompt.trim()) return;

		setGenerationStatus({
			isGenerating: true,
			progress: 0,
			message: '正在准备生成...'
		});
		setGenerationError('');
		logger.info('[ImageSelectionModal] 开始生成AI图片', {prompt: aiPrompt, style: aiStyle, provider: settings?.aiProvider});

		try {
			// 进度动画
			const progressUpdates = isAIGenerationAvailable
				? [
					{progress: 10, message: '正在连接 ZenMux...'},
					{progress: 30, message: '正在生成图像...'},
				]
				: [
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
				if (!isAIGenerationAvailable) {
					await new Promise(resolve => setTimeout(resolve, 500));
				}
			}

			const dimensions = getDimensions();
			const result = await imageGenerationService.generateImage({
				prompt: aiPrompt,
				style: aiStyle,
				aspectRatio: aspectRatio,
				width: dimensions.width,
				height: dimensions.height,
				settings
			});

			if (result.success && result.imageUrl) {
				setGeneratedImages(prev => [...prev, result.imageUrl!]);
				setGenerationStatus({
					isGenerating: false,
					progress: 100,
					message: '生成完成!'
				});
				logger.info(`[ImageSelectionModal] 封面${coverNumber} AI图片生成成功`);
			} else {
				throw new Error(result.error || '生成失败');
			}
		} catch (error) {
			logger.error('[ImageSelectionModal] AI图片生成失败', error);
			setGenerationError(error instanceof Error ? error.message : '生成失败，请重试');
		} finally {
			setGenerationStatus({
				isGenerating: false,
				progress: 0,
				message: ''
			});
		}
	}, [aiPrompt, aiStyle, aspectRatio, getDimensions, coverNumber, settings, isAIGenerationAvailable]);

	// 使用 Shadow DOM 感知的 portal 容器
	const {portalContainer, isShadowDom} = useShadowRoot();

	// 尝试获取 Drawer 的 Portal 容器：优先使用固定高度的 toolbar 容器，避免挂载在滚动区导致内容撑开
	const getToolbarPortalContainer = (): HTMLElement | null => {
		if (isShadowDom && portalContainer) {
			const rootNode = portalContainer.getRootNode() as Document | ShadowRoot;
			return rootNode.getElementById('lovpen-toolbar-container')
				|| rootNode.getElementById('lovpen-toolbar-content')
				|| null;
		}
		return document.getElementById('lovpen-toolbar-container')
			|| document.getElementById('lovpen-toolbar-content');
	};

	const toolbarPortalContainer = getToolbarPortalContainer();

	if (!toolbarPortalContainer) {
		console.warn('[ImageSelectionModal] 找不到工具栏内容容器');
		return null;
	}

	return (
		<>
			<Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DrawerPortal container={toolbarPortalContainer}>
							<DrawerOverlay className="absolute inset-0 bg-black/50"/>
							<div
								className="absolute bottom-0 left-0 right-0 z-50 bg-white flex flex-col h-[85vh] max-h-[85vh] min-h-0 overflow-hidden rounded-t-lg border-t shadow-lg transition-transform"
								data-vaul-drawer-direction="bottom"
								data-slot="drawer-content"
							>
								{/* 拖拽手柄 */}
								<div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-gray-300"/>

								<DrawerHeader className="pb-4">
									<DrawerTitle className="text-lg sm:text-xl">
										选择封面图片 - 封面{coverNumber} ({aspectRatio})
									</DrawerTitle>
									<DrawerDescription className="text-sm text-gray-600">
										选择图片来源，点击图片预览效果
									</DrawerDescription>
							</DrawerHeader>

						{/* 内容区域 */}
						<div className="flex flex-col flex-1 px-4 sm:px-6 min-h-0 overflow-hidden">
							<Tabs
								value={activeTab}
								onValueChange={(value) => setActiveTab(value as CoverImageSource)}
								className="flex flex-col flex-1 min-h-0"
							>
								<TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
									<TabsTrigger value="article" className="flex items-center gap-2">
										<ImageIcon className="h-4 w-4"/>
										文中图片
									</TabsTrigger>
									<TabsTrigger value="library" className="flex items-center gap-2">
										<Palette className="h-4 w-4"/>
										我的档案库
									</TabsTrigger>
									<TabsTrigger value="ai" className="flex items-center gap-2">
										<Sparkles className="h-4 w-4"/>
										AI生成
									</TabsTrigger>
								</TabsList>

								<TabsContent value="article" className="flex-1 min-h-0 overflow-y-auto">
									<ImageGrid
										images={selectedImages.map(img => img.src)}
										selectedImage={selectedImageUrl}
										onImageSelect={handleImageSelect}
										emptyMessage="文章中没有找到图片"
									/>
								</TabsContent>

								<TabsContent value="library" className="flex-1 min-h-0 overflow-y-auto">
									{uploadedImages.length > 0 ? (
										<ImageGrid
											images={uploadedImages.map(img => img.url)}
											selectedImage={selectedImageUrl}
											onImageSelect={handleImageSelect}
											emptyMessage="存储库中没有图片"
										/>
									) : (
										<div className="text-center py-8 text-gray-500">
											<Palette className="h-12 w-12 mx-auto mb-3 opacity-50"/>
											<p className="text-sm">存储库中没有图片</p>
											<p className="text-xs mt-1 text-gray-400">请先在"存储库"中上传图片</p>
										</div>
									)}
								</TabsContent>

								<TabsContent value="ai" className="flex-1 min-h-0 overflow-y-auto">
									<div className="space-y-4">
										{/* 未配置 ZenMux 时的提示 */}
										{!isAIGenerationAvailable && (
											<div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
												<div className="flex items-start gap-3">
													<Sparkles className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"/>
													<div className="flex-1">
														<p className="text-sm font-medium text-amber-800">AI 图片生成需要配置</p>
														<p className="text-xs text-amber-700 mt-1">
															请在 AI 设置中选择 ZenMux 作为提供商并配置 API 密钥，即可使用 Gemini 2.0 Flash 生成封面图片。
														</p>
														{onOpenAISettings && (
															<button
																onClick={() => {
																	onClose();
																	onOpenAISettings();
																}}
																className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
															>
																<Settings className="h-3.5 w-3.5"/>
																前往 AI 设置
															</button>
														)}
													</div>
												</div>
											</div>
										)}

										{/* AI 生成控制 */}
										<div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
											<div className="space-y-4">
												{isAIGenerationAvailable && (
													<div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
														<Sparkles className="h-3.5 w-3.5"/>
														<span>使用 ZenMux Gemini 2.0 Flash 生成</span>
													</div>
												)}

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														描述你想要的封面
													</label>
													<textarea
														value={aiPrompt}
														onChange={(e) => setAiPrompt(e.target.value)}
														placeholder="例如：一个现代简约的技术博客封面，蓝色主色调..."
														className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
													/>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">
															风格选择
														</label>
														<select
															value={aiStyle}
															onChange={(e) => setAiStyle(e.target.value)}
															className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
														>
															<option value="realistic">写实风格</option>
															<option value="illustration">插画风格</option>
															<option value="minimalist">简约风格</option>
															<option value="abstract">抽象风格</option>
															<option value="vintage">复古风格</option>
														</select>
													</div>

													<div className="flex items-end">
														<button
															onClick={generateAIImage}
															disabled={generationStatus.isGenerating || !aiPrompt.trim()}
															className={`w-full px-4 py-2 text-white rounded-lg transition-colors text-sm ${
																isAIGenerationAvailable
																	? 'bg-[#CC785C] hover:bg-[#B86A4E] disabled:bg-gray-400'
																	: 'bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400'
															} disabled:cursor-not-allowed`}
														>
															{generationStatus.isGenerating ? '生成中...' : (isAIGenerationAvailable ? 'AI 生成' : '模拟生成')}
														</button>
													</div>
												</div>

												{generationStatus.isGenerating && (
													<div className="space-y-2">
														<div className="w-full bg-gray-200 rounded-full h-2">
															<div
																className={`h-2 rounded-full transition-all duration-300 ${isAIGenerationAvailable ? 'bg-[#CC785C]' : 'bg-purple-500'}`}
																style={{width: `${generationStatus.progress}%`}}
															/>
														</div>
														<p className="text-sm text-gray-600 text-center">{generationStatus.message}</p>
													</div>
												)}

												{generationError && (
													<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
														<p className="text-sm text-red-600">{generationError}</p>
													</div>
												)}
											</div>
										</div>

										{/* AI 生成的图片 */}
										{generatedImages.length > 0 && (
											<div>
												<h4 className="text-sm font-medium text-gray-700 mb-3">AI生成的图片</h4>
												<ImageGrid
													images={generatedImages}
													selectedImage={selectedImageUrl}
													onImageSelect={handleImageSelect}
												/>
											</div>
										)}
									</div>
								</TabsContent>
							</Tabs>
						</div>

						{/* 底部操作栏 */}
						<div className="px-4 sm:px-6 py-4 border-t bg-gray-50 mt-auto shrink-0">
							{/* 选中图片预览 */}
							{selectedImageUrl && (
								<div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
									<div className="flex items-center gap-3">
										<img
											src={selectedImageUrl}
											alt="选中的图片"
											className="w-16 h-16 object-cover rounded-md border"
										/>
										<div className="flex-1">
											<p className="text-sm font-medium text-gray-900">已选择并裁切完成</p>
											<p className="text-xs text-gray-500">
												{aspectRatio === '2.25:1' ? '公众号封面比例 (900×400)' : '正方形比例 (400×400)'}
											</p>
										</div>
									</div>
								</div>
							)}

							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-500">
									{selectedImageUrl ? '已选择并裁切图片' : '请选择一张图片进行裁切'}
								</div>
								<div className="flex gap-3">
									<Button variant="outline" onClick={onClose} size="sm">
										取消
									</Button>
									<Button
										onClick={handleConfirm}
										disabled={!selectedImageUrl}
										className="bg-blue-600 hover:bg-blue-700"
										size="sm"
									>
										确定使用
									</Button>
								</div>
							</div>
						</div>
					</div>
				</DrawerPortal>
			</Drawer>

			{/* 图片裁切模态框 */}
			<ImageCropModal
				isOpen={showCropModal}
				onClose={handleCropCancel}
				imageUrl={imageToProcess}
				onCropComplete={handleCropComplete}
				title={`裁切封面${coverNumber} - ${aspectRatio}`}
			/>
		</>
	);
};
