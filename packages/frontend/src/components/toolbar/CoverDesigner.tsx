import React, {useCallback, useEffect, useRef, useState} from 'react';
import {CoverData} from "@/components/toolbar/CoverData";
import {CoverCard} from "@/components/toolbar/CoverCard";
import {ImageSelectionModal} from "@/components/toolbar/ImageSelectionModal";
import {CoverAspectRatio, CoverImageSource, ExtractedImage, GenerationStatus} from "@/components/toolbar/cover/types";
import {logger} from "../../../../shared/src/logger";
import {Download, RotateCcw} from "lucide-react";
import {persistentStorageService} from '../../services/persistentStorage';
import {ViteReactSettings, UploadedImage} from '../../types';

// 本地存储键名（与 Toolbar 共用）
const UPLOADED_IMAGES_STORAGE_KEY = 'lovpen-uploaded-images';

// 获取已上传图片列表
const getUploadedImages = (): UploadedImage[] => {
	try {
		const data = localStorage.getItem(UPLOADED_IMAGES_STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
};

interface CoverDesignerProps {
	articleHTML: string;
	onDownloadCovers: (covers: CoverData[]) => void;
	onClose: () => void;
	settings?: ViteReactSettings;
	onOpenAISettings?: () => void;
}


export const CoverDesigner: React.FC<CoverDesignerProps> = ({
																articleHTML,
																onDownloadCovers,
																onClose,
																settings,
																onOpenAISettings
															}) => {
	// 封面预览状态
	const [cover1Data, setCover1Data] = useState<CoverData | undefined>(undefined);
	const [cover2Data, setCover2Data] = useState<CoverData | undefined>(undefined);

	// 模态框状态
	const [selectedCoverNumber, setSelectedCoverNumber] = useState<1 | 2 | null>(null);
	const [showImageSelection, setShowImageSelection] = useState(false);

	// 共享状态
	const [selectedImages, setSelectedImages] = useState<ExtractedImage[]>([]);
	const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(() => getUploadedImages());
	const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
		isGenerating: false,
		progress: 0,
		message: ''
	});
	const [generationError, setGenerationError] = useState<string>('');

	// 监听 storage 变化刷新上传图片列表
	useEffect(() => {
		const handleStorageChange = () => {
			setUploadedImages(getUploadedImages());
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('lovpen-images-updated', handleStorageChange);
		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('lovpen-images-updated', handleStorageChange);
		};
	}, []);

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
	// 返回 null 表示无法恢复，应清空该封面
	const restoreCoverFromData = useCallback(async (cover: CoverData, data: any, coverNumber: number): Promise<CoverData | null> => {
		try {
			// 检查是否需要恢复图片URL（blob URL 在页面刷新后会失效）
			const needsRestore = cover.imageUrl.startsWith('blob:');

			if (!needsRestore) {
				// 非 blob URL（如 http/https），直接返回
				return cover;
			}

			// blob URL 需要恢复，优先使用 originalImageUrl
			if (cover.originalImageUrl && !cover.originalImageUrl.startsWith('blob:')) {
				// 原始图片是可持久化的 URL（http/https/data:）
				logger.info(`[CoverDesigner] 使用原始图片URL恢复封面${coverNumber}`, {
					originalImageUrl: cover.originalImageUrl.substring(0, 80)
				});
				return {...cover, imageUrl: cover.originalImageUrl};
			}

			// 如果原始图片也是 blob URL，尝试通过文件名从档案库恢复
			if (cover.originalFileName) {
				const matchedFile = await findMatchedFile(cover.originalFileName, data.savedAt);
				if (matchedFile) {
					const newUrl = await persistentStorageService.getFileUrl(matchedFile);
					logger.info(`[CoverDesigner] 从档案库恢复封面${coverNumber}: ${matchedFile.name}`);
					return {...cover, imageUrl: newUrl};
				} else {
					logger.warn(`[CoverDesigner] 未找到匹配的档案库文件: ${cover.originalFileName}`);
				}
			}

			// 兼容旧数据：尝试使用 data.originalFileName
			if (data.originalFileName) {
				const matchedFile = await findMatchedFile(data.originalFileName, data.savedAt);
				if (matchedFile) {
					const newUrl = await persistentStorageService.getFileUrl(matchedFile);
					logger.info(`[CoverDesigner] 从档案库恢复封面${coverNumber}(旧数据): ${matchedFile.name}`);
					return {...cover, imageUrl: newUrl};
				}
			}

			logger.warn(`[CoverDesigner] 封面${coverNumber}无法恢复，清空`);
			return null;
		} catch (error) {
			logger.error('[CoverDesigner] 恢复封面图片失败:', error);
			return null;
		}
	}, [findMatchedFile]);

	// 通用的加载封面数据函数
	const loadCoverData = useCallback(async (coverNumber: 1 | 2) => {
		try {
			const storageKey = `cover-designer-preview-${coverNumber}`;
			const saved = localStorage.getItem(storageKey);

			if (!saved) return;

			const data = JSON.parse(saved);
			if (!data.covers || !Array.isArray(data.covers)) return;

			// 调试：打印保存的数据
			console.log(`[CoverDesigner] 加载封面${coverNumber}数据`, {
				imageUrl: data.covers[0]?.imageUrl?.substring(0, 80),
				originalImageUrl: data.covers[0]?.originalImageUrl?.substring(0, 80),
				originalFileName: data.covers[0]?.originalFileName,
				source: data.source
			});

			const restoredCovers = await Promise.all(
				data.covers.map((cover: CoverData) => restoreCoverFromData(cover, data, coverNumber))
			);

			// 过滤掉 null（无法恢复的封面）
			const validCovers = restoredCovers.filter((c): c is CoverData => c !== null);

			if (validCovers.length > 0) {
				if (coverNumber === 1) {
					setCover1Data(validCovers[0]);
				} else {
					setCover2Data(validCovers[0]);
				}
			} else {
				// 所有封面都无法恢复，清空持久化数据
				localStorage.removeItem(storageKey);
				logger.info(`[CoverDesigner] 清空封面${coverNumber}无效的持久化数据`);
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
	const saveCoverData = useCallback(async (coverNum: 1 | 2, coverData: CoverData, source: CoverImageSource) => {
		try {
			const storageKey = `cover-designer-preview-${coverNum}`;

			const persistData = {
				covers: [coverData],
				source,
				savedAt: new Date().toISOString()
			};

			localStorage.setItem(storageKey, JSON.stringify(persistData));

			// 验证保存成功
			const saved = localStorage.getItem(storageKey);
			console.log(`[CoverDesigner] 保存封面${coverNum}`, {
				storageKey,
				imageUrl: coverData.imageUrl?.substring(0, 80),
				originalImageUrl: coverData.originalImageUrl?.substring(0, 80),
				originalFileName: coverData.originalFileName,
				saved: !!saved
			});
		} catch (error) {
			logger.error(`[CoverDesigner] 保存封面${coverNum}持久化数据失败:`, error);
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

	const createCover = useCallback(async (imageUrl: string, source: CoverImageSource, coverNum: 1 | 2, originalImageUrl?: string, originalFileName?: string) => {
		// 验证图片URL
		if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
			logger.error('[CoverDesigner] 无效的图片URL:', imageUrl);
			return;
		}

		const dimensions = getDimensions(coverNum);

		// 如果是 blob URL，需要保存到持久化存储
		let persistedFileName = originalFileName;
		if (imageUrl.startsWith('blob:')) {
			try {
				const fileName = `cover-${coverNum}-${Date.now()}.png`;
				const savedFile = await persistentStorageService.saveFileFromUrl(imageUrl, fileName, 'image/png');
				persistedFileName = savedFile.name;
				logger.info(`[CoverDesigner] 封面${coverNum}图片已保存到持久化存储`, {fileName: savedFile.name});
			} catch (error) {
				logger.error(`[CoverDesigner] 保存封面${coverNum}图片到持久化存储失败:`, error);
			}
		}

		// 直接创建封面数据，使用裁切后的图片URL进行预览
		const coverData: CoverData = {
			id: `cover${coverNum}-${Date.now()}-${Math.random()}`,
			imageUrl: imageUrl.trim(), // 裁切后的 blob URL（显示用）
			aspectRatio: dimensions.aspectRatio,
			width: dimensions.width,
			height: dimensions.height,
			title: '',
			description: '',
			// 保存原始信息用于持久化恢复
			originalImageUrl: originalImageUrl || imageUrl,
			originalFileName: persistedFileName // 使用持久化后的文件名
		};

		logger.info(`[CoverDesigner] 封面${coverNum}创建成功`, {
			imageUrl: imageUrl.substring(0, 80),
			originalImageUrl: originalImageUrl?.substring(0, 80),
			aspectRatio: dimensions.aspectRatio,
			dimensions: `${dimensions.width}x${dimensions.height}`,
			originalFileName: persistedFileName
		});

		setCoverPreview(coverNum, coverData);
		await saveCoverData(coverNum, coverData, source);
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
	const handleImageSelect = async (imageUrl: string, source: CoverImageSource, originalImageUrl?: string, originalFileName?: string) => {
		if (!selectedCoverNumber) return;

		try {
			await createCover(imageUrl, source, selectedCoverNumber, originalImageUrl, originalFileName);
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
			<div className="grid grid-cols-1 sm:grid-cols-[2.25fr_1fr] gap-2 sm:gap-3 w-full">
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
					settings={settings}
					onOpenAISettings={onOpenAISettings}
					uploadedImages={uploadedImages}
				/>
			)}

			{/* 隐藏的 canvas 元素 */}
			<canvas ref={canvasRef} style={{display: 'none'}}/>
		</div>
	);
};
