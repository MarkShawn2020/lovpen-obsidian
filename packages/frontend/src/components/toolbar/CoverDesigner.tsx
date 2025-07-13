import React, {useCallback, useEffect, useRef, useState} from 'react';
import {CoverData} from "@/components/toolbar/CoverData";
import {CoverCard} from "@/components/toolbar/CoverCard";
import {ImageSelectionModal} from "@/components/toolbar/ImageSelectionModal";
import {CoverAspectRatio, CoverImageSource, ExtractedImage, GenerationStatus} from "@/components/toolbar/cover/types";
import {logger} from "../../../../shared/src/logger";
import {Download, RotateCcw} from "lucide-react";
import {persistentStorageService} from '../../services/persistentStorage';
import {PersistentFile} from '../../types';

interface CoverDesignerProps {
	articleHTML: string;
	onDownloadCovers: (covers: CoverData[]) => void;
	onClose: () => void;
}


export const CoverDesigner: React.FC<CoverDesignerProps> = ({
																articleHTML,
																onDownloadCovers,
																onClose
															}) => {
	// 封面预览状态
	const [cover1Data, setCover1Data] = useState<CoverData | undefined>(undefined);
	const [cover2Data, setCover2Data] = useState<CoverData | undefined>(undefined);

	// 模态框状态
	const [selectedCoverNumber, setSelectedCoverNumber] = useState<1 | 2 | null>(null);
	const [showImageSelection, setShowImageSelection] = useState(false);

	// 共享状态
	const [selectedImages, setSelectedImages] = useState<ExtractedImage[]>([]);
	const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
		isGenerating: false,
		progress: 0,
		message: ''
	});
	const [generationError, setGenerationError] = useState<string>('');

	const canvasRef = useRef<HTMLCanvasElement>(null);

	const getDimensions = useCallback((coverNum: 1 | 2) => {
		if (coverNum === 1) {
			// 封面1固定为2.25:1比例，提高分辨率
			return {width: 1350, height: 600, aspectRatio: '2.25:1' as CoverAspectRatio};
		} else {
			// 封面2固定为1:1比例，高度与封面1保持一致
			return {width: 600, height: 600, aspectRatio: '1:1' as CoverAspectRatio};
		}
	}, []);

	// Helper function to load image and get dimensions
	const loadImageDimensions = useCallback((src: string): Promise<{ src: string, width: number, height: number }> => {
		return new Promise((resolve, reject) => {
			const img = document.createElement('img');
			img.onload = () => {
				logger.info('[CoverDesigner] 图片加载成功', {
					src: src.substring(0, 100),
					width: img.naturalWidth,
					height: img.naturalHeight
				});
				resolve({
					src: img.src,
					width: img.naturalWidth,
					height: img.naturalHeight
				});
			};
			img.onerror = (error) => {
				logger.error('[CoverDesigner] 图片加载失败', {src: src.substring(0, 100), error});
				reject(error);
			};
			img.src = src;
		});
	}, []);

	const extractImagesFromHTML = useCallback(async (html: string): Promise<ExtractedImage[]> => {
		logger.info('[CoverDesigner] 开始提取图片', {htmlLength: html.length});

		// 首先尝试从实际DOM获取已加载的图片
		const actualImages = document.querySelectorAll('img');
		const loadedImagesMap = new Map<string, ExtractedImage>();

		actualImages.forEach((img, index) => {
			if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
				loadedImagesMap.set(img.src, {
					src: img.src,
					alt: img.alt || `图片 ${index + 1}`,
					width: img.naturalWidth,
					height: img.naturalHeight
				});
				logger.info(`[CoverDesigner] 从DOM获取已加载图片 ${index + 1}`, {
					src: img.src.substring(0, 100),
					width: img.naturalWidth,
					height: img.naturalHeight
				});
			}
		});

		// 然后解析HTML并匹配/加载缺失的图片
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const htmlImages = doc.querySelectorAll('img');

		logger.info('[CoverDesigner] 找到HTML图片元素', {count: htmlImages.length});

		const extractedImages: ExtractedImage[] = [];

		for (const img of htmlImages) {
			let src = img.src || img.getAttribute('src') || '';

			// 如果是空的或者无效的src，尝试其他属性
			if (!src || src === '' || src === window.location.href) {
				const dataSrc = img.getAttribute('data-obsidian');
				const lazySrc = img.getAttribute('lazy-obsidian');
				src = dataSrc || lazySrc || '';
				logger.info(`[CoverDesigner] 尝试备用属性`, {dataSrc, lazySrc, finalSrc: src});
			}

			// 处理相对路径
			if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:')) {
				const originalSrc = src;

				try {
					if (src.startsWith('./') || src.startsWith('../')) {
						src = new URL(src, window.location.href).href;
					} else if (src.startsWith('/')) {
						src = window.location.origin + src;
					} else if (!src.includes('://')) {
						// 相对路径，相对于当前页面
						src = new URL(src, window.location.href).href;
					}

					logger.info(`[CoverDesigner] 路径转换`, {originalSrc, convertedSrc: src});
				} catch (error) {
					logger.error(`[CoverDesigner] 路径转换失败`, {originalSrc, error});
				}
			}

			// 验证URL有效性
			const isValidUrl = src &&
				src !== '' &&
				src !== window.location.href &&
				!src.endsWith('#') &&
				(src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:'));

			if (!isValidUrl) {
				logger.warn('[CoverDesigner] 跳过无效图片', {src, reason: '无效的URL格式'});
				continue;
			}

			// 检查是否已从DOM中获取
			if (loadedImagesMap.has(src)) {
				extractedImages.push(loadedImagesMap.get(src)!);
				logger.info('[CoverDesigner] 使用DOM缓存图片', {src: src.substring(0, 100)});
			} else {
				// 尝试加载图片获取尺寸
				try {
					const dimensions = await loadImageDimensions(src);
					extractedImages.push({
						src: dimensions.src,
						alt: img.alt || `图片 ${extractedImages.length + 1}`,
						width: dimensions.width,
						height: dimensions.height
					});
					logger.info('[CoverDesigner] 成功加载新图片', {src: src.substring(0, 100)});
				} catch (error) {
					logger.error('[CoverDesigner] 获取图片尺寸失败', {src: src.substring(0, 100), error});
					// 即使加载失败，也添加图片但设置默认尺寸
					extractedImages.push({
						src: src,
						alt: img.alt || `图片 ${extractedImages.length + 1}`,
						width: 400, // 默认宽度
						height: 300 // 默认高度
					});
				}
			}
		}

		logger.info('[CoverDesigner] 提取完成', {
			totalFound: htmlImages.length,
			validImages: extractedImages.length,
			fromDOM: loadedImagesMap.size,
			validSrcs: extractedImages.map(img => img.src.substring(0, 100))
		});

		return extractedImages;
	}, [loadImageDimensions]);

	// 通用的图片匹配函数
	const findMatchedFile = useCallback(async (originalFileName: string, savedAt: string) => {
		const files = await persistentStorageService.getFiles();
		const imageFiles = files.filter(f => f.type.startsWith('image/'));

		// 1. 首先按原始文件名精确匹配
		let matchedFile = imageFiles.find(f => f.name === originalFileName);

		// 2. 如果没找到，按文件名包含匹配
		if (!matchedFile) {
			matchedFile = imageFiles.find(f => f.name.includes(originalFileName));
		}

		// 3. 如果还没找到，按保存时间附近匹配（前后5分钟内）
		if (!matchedFile && savedAt) {
			const savedTime = new Date(savedAt).getTime();
			matchedFile = imageFiles.find(f => {
				const fileTime = new Date(f.createdAt).getTime();
				return Math.abs(savedTime - fileTime) < 5 * 60 * 1000; // 5分钟内
			});
		}

		// 4. 最后选择最近使用的图片文件
		if (!matchedFile && imageFiles.length > 0) {
			matchedFile = imageFiles.sort((a, b) =>
				new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
			)[0];
		}

		return matchedFile;
	}, []);

	// 通用的封面恢复函数
	const restoreCoverFromData = useCallback(async (cover: CoverData, data: any, coverNumber: number): Promise<CoverData> => {
		try {
			// 检查是否需要恢复图片URL
			const needsRestore = cover.imageUrl.startsWith('blob:') || 
								(data.source === 'upload' && data.originalFileName);

			if (!needsRestore) {
				return cover;
			}

			if (!data.originalFileName) {
				logger.warn(`[CoverDesigner] 封面${coverNumber}缺少原始文件名，无法恢复`);
				return cover;
			}

			const matchedFile = await findMatchedFile(data.originalFileName, data.savedAt);
			if (matchedFile) {
				const newUrl = await persistentStorageService.getFileUrl(matchedFile);
				logger.info(`[CoverDesigner] 恢复封面${coverNumber}图片: ${matchedFile.name}`);
				return {...cover, imageUrl: newUrl};
			} else {
				logger.warn(`[CoverDesigner] 未找到匹配的档案库文件: ${data.originalFileName}`);
			}
		} catch (error) {
			logger.error('[CoverDesigner] 恢复档案库图片失败:', error);
		}

		return cover;
	}, [findMatchedFile]);

	// 通用的加载封面数据函数
	const loadCoverData = useCallback(async (coverNumber: 1 | 2) => {
		try {
			const storageKey = `cover-designer-preview-${coverNumber}`;
			const saved = localStorage.getItem(storageKey);

			if (!saved) return;

			const data = JSON.parse(saved);
			if (!data.covers || !Array.isArray(data.covers)) return;

			const restoredCovers = await Promise.all(
				data.covers.map((cover: CoverData) => restoreCoverFromData(cover, data, coverNumber))
			);

			if (restoredCovers.length > 0) {
				if (coverNumber === 1) {
					setCover1Data(restoredCovers[0]);
				} else {
					setCover2Data(restoredCovers[0]);
				}
			}
		} catch (error) {
			logger.error(`[CoverDesigner] 加载封面${coverNumber}持久化数据失败:`, error);
		}
	}, [restoreCoverFromData]);

	// 初始化时加载持久化数据
	useEffect(() => {
		const loadPersistedData = async () => {
			// 临时：清空可能损坏的缓存数据用于调试
			if (window.location.search.includes('clear-cover-cache')) {
				localStorage.removeItem('cover-designer-preview-1');
				localStorage.removeItem('cover-designer-preview-2');
				return;
			}
			
			await Promise.all([
				loadCoverData(1),
				loadCoverData(2)
			]);
		};

		loadPersistedData();
	}, [loadCoverData]);

	useEffect(() => {
		const extractImages = async () => {
			try {
				const images = await extractImagesFromHTML(articleHTML);
				setSelectedImages(images);
				logger.info('[CoverDesigner] 从文章中提取图片', {count: images.length});
			} catch (error) {
				logger.error('[CoverDesigner] 提取图片失败', {error});
				setSelectedImages([]);
			}
		};

		extractImages();
	}, [articleHTML, extractImagesFromHTML]);


	// 通用的保存封面持久化数据函数
	const saveCoverData = useCallback(async (coverNum: 1 | 2, coverData: CoverData, source: CoverImageSource, imageUrl: string) => {
		try {
			const storageKey = `cover-designer-preview-${coverNum}`;
			let originalFileName = '';

			// 如果是档案库来源，尝试匹配文件信息
			if (source === 'upload' || (source === 'library' && imageUrl.startsWith('blob:'))) {
				try {
					const files = await persistentStorageService.getFiles();
					const imageFiles = files.filter(f => f.type.startsWith('image/'));
					
					// 尝试通过URL匹配找到对应的文件
					let matchedFile: PersistentFile | null = null;
					for (const file of imageFiles) {
						try {
							const fileUrl = await persistentStorageService.getFileUrl(file);
							if (fileUrl === imageUrl) {
								matchedFile = file;
								break;
							}
						} catch (error) {
							// 忽略单个文件的错误
							continue;
						}
					}
					
					// 如果没找到匹配的，使用最近使用的文件作为备选
					if (!matchedFile && imageFiles.length > 0) {
						const sortedFiles = imageFiles.sort((a, b) =>
							new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
						);
						matchedFile = sortedFiles[0];
					}
					
					if (matchedFile) {
						originalFileName = matchedFile.name;
						logger.info(`[CoverDesigner] 匹配到档案库文件: ${originalFileName}`);
					}
				} catch (error) {
					logger.error('[CoverDesigner] 匹配档案库文件失败:', error);
				}
			}

			const persistData = {
				covers: [coverData],
				source,
				originalFileName,
				savedAt: new Date().toISOString()
			};

			localStorage.setItem(storageKey, JSON.stringify(persistData));
			logger.debug(`[CoverDesigner] 保存封面${coverNum}预览持久化数据`);
		} catch (error) {
			logger.error(`[CoverDesigner] 保存封面${coverNum}预览持久化数据失败:`, error);
		}
	}, []);

	// 通用的设置封面预览函数
	const setCoverPreview = useCallback((coverNum: 1 | 2, coverData: CoverData) => {
		if (coverNum === 1) {
			setCover1Data(coverData);
		} else {
			setCover2Data(coverData);
		}
	}, []);

	const createCover = useCallback(async (imageUrl: string, source: CoverImageSource, coverNum: 1 | 2) => {
		// 验证图片URL
		if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
			logger.error('[CoverDesigner] 无效的图片URL:', imageUrl);
			return;
		}

		const dimensions = getDimensions(coverNum);

		// 直接创建封面数据，使用原始图片URL进行预览
		const coverData: CoverData = {
			id: `cover${coverNum}-${Date.now()}-${Math.random()}`,
			imageUrl: imageUrl.trim(), // 使用trim后的URL
			aspectRatio: dimensions.aspectRatio,
			width: dimensions.width,
			height: dimensions.height,
			title: '',
			description: ''
		};

		logger.info(`[CoverDesigner] 封面${coverNum}创建成功（使用原始图片预览）`, {
			originalUrl: imageUrl.substring(0, 100),
			aspectRatio: dimensions.aspectRatio,
			dimensions: `${dimensions.width}x${dimensions.height}`
		});

		setCoverPreview(coverNum, coverData);
		await saveCoverData(coverNum, coverData, source, imageUrl);
	}, [getDimensions, setCoverPreview, saveCoverData]);

	// 处理封面卡片点击
	const handleCoverCardClick = (coverNumber: 1 | 2) => {
		logger.info(`[CoverDesigner] 封面卡片点击事件触发: 封面${coverNumber}`);
		console.log(`[CoverDesigner] 点击封面${coverNumber}，设置状态:`, {
			showImageSelection: true,
			selectedCoverNumber: coverNumber
		});
			setSelectedCoverNumber(coverNumber);
		setShowImageSelection(true);
	};

	// 处理图片选择
	const handleImageSelect = async (imageUrl: string, source: CoverImageSource) => {
		if (!selectedCoverNumber) return;

		try {
			await createCover(imageUrl, source, selectedCoverNumber);
			setShowImageSelection(false);
			setSelectedCoverNumber(null);
		} catch (error) {
			logger.error('[CoverDesigner] Error creating cover:', error);
		}
	};

	// 清空封面
	const handleClearCover = (coverNumber: 1 | 2) => {
		if (coverNumber === 1) {
			setCover1Data(undefined);
		} else {
			setCover2Data(undefined);
		}
		clearCoverPreview(coverNumber);
	};

	const handleDownloadCovers = useCallback(async () => {
		const covers = [cover1Data, cover2Data].filter(Boolean) as CoverData[];
		onDownloadCovers(covers);
	}, [cover1Data, cover2Data, onDownloadCovers]);


	// 通用的清空封面预览函数
	const clearCoverPreview = useCallback((coverNumber: 1 | 2) => {
		// 清空状态
		if (coverNumber === 1) {
			setCover1Data(undefined);
		} else {
			setCover2Data(undefined);
		}

		// 清空持久化数据
		try {
			const storageKey = `cover-designer-preview-${coverNumber}`;
			localStorage.removeItem(storageKey);
			logger.debug(`[CoverDesigner] 清空封面${coverNumber}持久化数据`);
		} catch (error) {
			logger.error(`[CoverDesigner] 清空封面${coverNumber}持久化数据失败:`, error);
		}

		logger.info(`[CoverDesigner] 清空封面${coverNumber}预览`);
	}, []);

	// 清空单个封面预览的功能
	const handleClearPreviews = useCallback((coverNumber: 1 | 2) => {
		clearCoverPreview(coverNumber);
	}, [clearCoverPreview]);

	// 清空全部封面预览
	const clearAllPreviews = useCallback(() => {
		clearCoverPreview(1);
		clearCoverPreview(2);
		logger.debug('[CoverDesigner] 清空全部封面持久化数据');
	}, [clearCoverPreview]);

	return (
		<div className="@container space-y-3 sm:space-y-4 relative">
			{/* 头部和操作按钮 */}
			<div className="w-full space-y-3 sm:space-y-4">
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
					<h3 className="text-base sm:text-lg font-semibold">封面设计</h3>
					<div className="flex space-x-1 sm:space-x-2">
						<button
							onClick={handleDownloadCovers}
							className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
							disabled={!cover1Data && !cover2Data}
						>
							<Download className="h-3 w-3 sm:h-4 sm:w-4"/>
							<span className="hidden @md:inline">
								下载封面 ({(cover1Data ? 1 : 0) + (cover2Data ? 1 : 0)})
							</span>
						</button>
						<button
							disabled={!cover1Data && !cover2Data}
							onClick={() => {
								setCover1Data(undefined);
								setCover2Data(undefined);
								clearCoverPreview(1);
								clearCoverPreview(2);
							}}
							className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm border border-gray-300"
						>
							<RotateCcw className="h-3 w-3 sm:h-4 sm:w-4"/>
							<span className="hidden @md:inline">清空全部</span>
						</button>
					</div>
				</div>
			</div>

			{/* 封面卡片区域 - 并排布局模拟最终3.25:1拼接效果 */}
			<div className="grid grid-cols-[2.25fr_1fr] gap-2 sm:gap-3 w-full">
				<CoverCard
					coverData={cover1Data}
					aspectRatio={2.25}
					label="封面1 (2.25:1)"
					placeholder="点击添加封面1"
					isGenerating={generationStatus.isGenerating && selectedCoverNumber === 1}
					generationProgress={generationStatus.progress}
					onClick={() => handleCoverCardClick(1)}
					onClear={() => handleClearCover(1)}
				/>
				<CoverCard
					coverData={cover2Data}
					aspectRatio={1}
					label="封面2 (1:1)"
					placeholder="点击添加封面2"
					isGenerating={generationStatus.isGenerating && selectedCoverNumber === 2}
					generationProgress={generationStatus.progress}
					onClick={() => handleCoverCardClick(2)}
					onClear={() => handleClearCover(2)}
				/>
			</div>

			{/* 图片选择模态框 */}
			{showImageSelection && selectedCoverNumber && (
				<ImageSelectionModal
					isOpen={showImageSelection}
					onClose={() => {
						setShowImageSelection(false);
						setSelectedCoverNumber(null);
					}}
					onImageSelect={handleImageSelect}
					coverNumber={selectedCoverNumber!}
					aspectRatio={selectedCoverNumber === 1 ? '2.25:1' : '1:1'}
					selectedImages={selectedImages}
					getDimensions={() => getDimensions(selectedCoverNumber!)}
				/>
			)}

			{/* 隐藏的 canvas 元素 */}
			<canvas ref={canvasRef} style={{display: 'none'}}/>
		</div>
	);
};
