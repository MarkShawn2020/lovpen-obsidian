import React, {useCallback, useEffect, useState} from 'react';
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerPortal,
	DrawerOverlay,
} from '../ui/drawer';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../ui/tabs';
import {Button} from '../ui/button';
import {ImageGrid} from './ImageGrid';
import {PersistentFileManager} from './PersistentFileManager';
import {CoverAspectRatio, CoverImageSource, ExtractedImage, GenerationStatus} from './cover/types';
import {X, Palette, Sparkles, Image as ImageIcon} from 'lucide-react';
import {imageGenerationService} from '@/services/imageGenerationService';
import {logger} from '../../../../shared/src/logger';

interface ImageSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImageSelect: (imageUrl: string, source: CoverImageSource) => void;
	coverNumber: 1 | 2;
	aspectRatio: CoverAspectRatio;
	selectedImages: ExtractedImage[];
	getDimensions: () => { width: number; height: number; aspectRatio: CoverAspectRatio };
}

export const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
	isOpen,
	onClose,
	onImageSelect,
	coverNumber,
	aspectRatio,
	selectedImages,
	getDimensions
}) => {
	const [activeTab, setActiveTab] = useState<CoverImageSource>('article');
	const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
	
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
		}
	}, [isOpen]);

	const handleImageSelect = (imageUrl: string) => {
		setSelectedImageUrl(imageUrl);
	};

	const handleConfirm = () => {
		if (selectedImageUrl) {
			onImageSelect(selectedImageUrl, activeTab);
			onClose();
		}
	};

	const generateAIImage = useCallback(async () => {
		if (!aiPrompt.trim()) return;

		setGenerationStatus({
			isGenerating: true,
			progress: 0,
			message: '正在准备生成...'
		});
		setGenerationError('');
		logger.info('[ImageSelectionModal] 开始生成AI图片', {prompt: aiPrompt, style: aiStyle});

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
				prompt: aiPrompt,
				style: aiStyle,
				aspectRatio: aspectRatio,
				width: dimensions.width,
				height: dimensions.height
			});

			if (result.success && result.imageUrl) {
				setGeneratedImages(prev => [...prev, result.imageUrl!]);
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
	}, [aiPrompt, aiStyle, aspectRatio, getDimensions, coverNumber]);

	const toolbarContainer = document.getElementById('lovpen-toolbar-container');
	
	
	if (!toolbarContainer) {
		console.warn('[ImageSelectionModal] 找不到工具栏容器');
		return null;
	}

	return (
		<Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DrawerPortal container={toolbarContainer}>
				<DrawerOverlay className="absolute inset-0 bg-black/50" />
				<div 
					className="absolute bottom-0 left-0 right-0 z-50 bg-white flex flex-col max-h-[85vh] rounded-t-lg border-t shadow-lg transition-transform"
					data-vaul-drawer-direction="bottom"
					data-slot="drawer-content"
				>
					{/* 拖拽手柄 */}
					<div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-gray-300" />
					
					<DrawerHeader className="pb-4">
						<DrawerTitle className="text-lg sm:text-xl">
							选择封面图片 - 封面{coverNumber} ({aspectRatio})
						</DrawerTitle>
						<DrawerDescription className="text-sm text-gray-600">
							选择图片来源，点击图片预览效果
						</DrawerDescription>
					</DrawerHeader>
				
				{/* 内容区域 */}
				<div className="flex-1 px-4 sm:px-6 overflow-y-auto min-h-0">
					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CoverImageSource)}>
						<TabsList className="grid w-full grid-cols-3 mb-4">
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

						<TabsContent value="article">
							<ImageGrid
								images={selectedImages.map(img => img.src)}
								selectedImage={selectedImageUrl}
								onImageSelect={handleImageSelect}
								emptyMessage="文章中没有找到图片"
							/>
						</TabsContent>

						<TabsContent value="library">
							<PersistentFileManager
								onFileSelect={(fileUrl) => handleImageSelect(fileUrl)}
								acceptedTypes={['image/*']}
								title="从档案库选择图片"
								showAsGrid={true}
								selectedFileUrl={selectedImageUrl}
							/>
						</TabsContent>

						<TabsContent value="ai">
							<div className="space-y-4">
								{/* AI 生成控制 */}
								<div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
									<div className="space-y-4">
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
													className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
												>
													{generationStatus.isGenerating ? '生成中...' : '生成图片'}
												</button>
											</div>
										</div>

										{generationStatus.isGenerating && (
											<div className="space-y-2">
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className="bg-purple-500 h-2 rounded-full transition-all duration-300"
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
				<div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t bg-gray-50 mt-auto shrink-0">
					<div className="text-sm text-gray-500">
						{selectedImageUrl ? '已选择图片' : '请选择一张图片'}
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
			</DrawerPortal>
		</Drawer>
	);
};