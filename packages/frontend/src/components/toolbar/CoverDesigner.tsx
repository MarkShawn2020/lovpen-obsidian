import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';
import {CoverPreview} from "@/components/toolbar/CoverPreview";
import {CoverData} from "@/components/toolbar/CoverData";
import {CoverEditor} from "@/components/toolbar/CoverEditor";
import {CoverAspectRatio, CoverImageSource, ExtractedImage, GenerationStatus} from "@/components/toolbar/cover/types";
import {logger} from "../../../../shared/src/logger";
import {Download, Image, Layers, RotateCcw, Settings} from "lucide-react";
import {persistentStorageService} from '../../services/persistentStorage';

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
	// 当前选中的封面 (1 或 2)
	const [selectedCover, setSelectedCover] = useState<1 | 2>(1);

	// 封面预览状态
	const [cover1PreviewCovers, setCover1PreviewCovers] = useState<CoverData[]>([]);
	const [cover2PreviewCovers, setCover2PreviewCovers] = useState<CoverData[]>([]);

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
		if (!cover.imageUrl.startsWith('blob:')) {
			return cover;
		}

		try {
			if (!data.originalFileName) return cover;

			const matchedFile = await findMatchedFile(data.originalFileName, data.savedAt);
			if (matchedFile) {
				const newUrl = await persistentStorageService.getFileUrl(matchedFile);
				logger.info(`[CoverDesigner] 恢复封面${coverNumber}图片: ${matchedFile.name}`);
				return {...cover, imageUrl: newUrl};
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

			if (coverNumber === 1) {
				setCover1PreviewCovers(restoredCovers);
			} else {
				setCover2PreviewCovers(restoredCovers);
			}
		} catch (error) {
			logger.error(`[CoverDesigner] 加载封面${coverNumber}持久化数据失败:`, error);
		}
	}, [restoreCoverFromData]);

	// 初始化时加载持久化数据
	useEffect(() => {
		const loadPersistedData = async () => {
			await Promise.all([
				loadCoverData(1),
				loadCoverData(2)
			]);
			logger.info('[CoverDesigner] 加载封面预览持久化数据完成');
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

			// 如果是档案库来源，尝试从文件列表中获取原始文件名
			if (source === 'upload' && imageUrl.startsWith('blob:')) {
				try {
					const files = await persistentStorageService.getFiles();
					const imageFiles = files.filter(f => f.type.startsWith('image/'));
					// 根据最近使用时间推测文件
					if (imageFiles.length > 0) {
						const latestFile = imageFiles.sort((a, b) =>
							new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
						)[0];
						originalFileName = latestFile.name;
					}
				} catch (error) {
					logger.error('[CoverDesigner] 获取原始文件名失败:', error);
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
			setCover1PreviewCovers([coverData]);
		} else {
			setCover2PreviewCovers([coverData]);
		}
	}, []);

	const createCover = useCallback(async (imageUrl: string, source: CoverImageSource, coverNum: 1 | 2) => {
		logger.info(`[CoverDesigner] 开始创建封面${coverNum}`, {imageUrl: imageUrl.substring(0, 100), source});

		const dimensions = getDimensions(coverNum);

		// 直接创建封面数据，使用原始图片URL进行预览
		const coverData: CoverData = {
			id: `cover${coverNum}-${Date.now()}-${Math.random()}`,
			imageUrl: imageUrl, // 直接使用原始图片URL
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

	const handleDownloadCovers = useCallback(async () => {
		const covers = [...cover1PreviewCovers, ...cover2PreviewCovers];
		onDownloadCovers(covers);
	}, [cover1PreviewCovers, cover2PreviewCovers, onDownloadCovers]);


	// 通用的清空封面预览函数
	const clearCoverPreview = useCallback((coverNumber: 1 | 2) => {
		// 清空状态
		if (coverNumber === 1) {
			setCover1PreviewCovers([]);
		} else {
			setCover2PreviewCovers([]);
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
		<div className="@container space-y-6">
			{/* 头部说明 */}
			<div className="text-center">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">封面设计工作室</h3>
				<p className="text-gray-600">为您的文章制作专业的多尺寸封面图片</p>
			</div>

			{/* 封面配置卡片 */}
			<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 bg-orange-100 rounded-lg">
						<Settings className="h-5 w-5 text-orange-600"/>
					</div>
					<div>
						<h4 className="font-semibold text-gray-900">封面配置</h4>
						<p className="text-sm text-gray-600">选择要编辑的封面和管理输出</p>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3">
					<div className="flex-1">
						<Select value={selectedCover.toString()}
								onValueChange={(value) => setSelectedCover(parseInt(value) as 1 | 2)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="选择要设置的封面"/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">
									<div className="flex items-center gap-2">
										<Layers className="h-4 w-4 text-blue-600"/>
										<span>封面1 (2.25:1 横版)</span>
									</div>
								</SelectItem>
								<SelectItem value="2">
									<div className="flex items-center gap-2">
										<Image className="h-4 w-4 text-purple-600"/>
										<span>封面2 (1:1 方形)</span>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-2">
						<button
							onClick={() => handleClearPreviews(selectedCover)}
							className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
							title={`清空封面${selectedCover}预览`}
						>
							<RotateCcw className="h-4 w-4"/>
						</button>
						<button
							onClick={handleDownloadCovers}
							className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={cover1PreviewCovers.length === 0 && cover2PreviewCovers.length === 0}
						>
							<Download className="h-4 w-4"/>
							<span className="text-sm font-medium hidden @md:block">
								下载封面 ({(cover1PreviewCovers.length > 0 ? 1 : 0) + (cover2PreviewCovers.length > 0 ? 1 : 0)})
							</span>
						</button>
						<button
							disabled={cover1PreviewCovers.length === 0 && cover2PreviewCovers.length === 0}
							onClick={clearAllPreviews}
							className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<RotateCcw className="h-4 w-4"/>
							<span className="text-sm font-medium hidden @md:block">清空全部</span>
						</button>
					</div>
				</div>
			</div>


			{/* 预览区域 */}
			<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 bg-blue-100 rounded-lg">
						<Image className="h-5 w-5 text-blue-600"/>
					</div>
					<div>
						<h4 className="font-semibold text-gray-900">封面预览</h4>
						<p className="text-sm text-gray-600"> 查看生成的封面效果</p>
					</div>
				</div>

				<div className="grid grid-cols-[2.25fr_1fr] gap-6 w-full">
					<CoverPreview
						coverData={cover1PreviewCovers[0]}
						aspectRatio={2.25}
						label="封面1"
						onClear={() => handleClearPreviews(1)}
						placeholder="暂无封面1预览"
					/>
					<CoverPreview
						coverData={cover2PreviewCovers[0]}
						aspectRatio={1}
						label="封面2"
						onClear={() => handleClearPreviews(2)}
						placeholder="暂无封面2预览"
					/>
				</div>
			</div>

			{/* 图片来源选择 */}
			<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
				<CoverEditor
					coverNumber={selectedCover}
					aspectRatio={selectedCover === 1 ? '2.25:1' : '1:1'}
					selectedImages={selectedImages}
					onCreateCover={async (imageUrl, source) => await createCover(imageUrl, source, selectedCover)}
					getDimensions={() => getDimensions(selectedCover)}
					generationStatus={generationStatus}
					setGenerationStatus={setGenerationStatus}
					generationError={generationError}
					setGenerationError={setGenerationError}
				/>
			</div>

			{/* 隐藏的 canvas 元素 */}
			<canvas ref={canvasRef} style={{display: 'none'}}/>
		</div>
	);
};
