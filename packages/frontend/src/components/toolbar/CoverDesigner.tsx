import React, {useCallback, useEffect, useRef, useState} from 'react';
import {CoverData} from "@/components/toolbar/CoverData";
import {CoverCard} from "@/components/toolbar/CoverCard";
import {ImageSelectionModal} from "@/components/toolbar/ImageSelectionModal";
import {CoverAspectRatio, CoverImageSource, ExtractedImage, GenerationStatus} from "@/components/toolbar/cover/types";
import {logger} from "../../../../shared/src/logger";
import {Download, RotateCcw, Sparkles, Settings, Eye, X, Check, Copy} from "lucide-react";
import {persistentStorageService} from '../../services/persistentStorage';
import {imageGenerationService} from '../../services/imageGenerationService';
import {ViteReactSettings, UploadedImage} from '../../types';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';

// 本地存储键名（与 Toolbar 共用）
const UPLOADED_IMAGES_STORAGE_KEY = 'lovpen-uploaded-images';
const AI_GENERATION_STATE_KEY = 'lovpen-ai-generation-state';

// AI 图片生成模型
const AI_IMAGE_MODELS = [
	{value: 'nano-banana-pro', label: 'Nano Banana Pro', description: 'Gemini 2.5 Pro'},
	{value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: '快速生成'},
] as const;

// AI 生成图片元数据
interface AIImageMeta {
	style: string;
	model: string;
	targetCover: 1 | 2;
	aspectRatio: string;
	width: number;
	height: number;
	createdAt: string;
}

// AI 生成状态持久化接口
interface AIGenerationState {
	aiStyle: string;
	aiTargetCover: 1 | 2;
	aiModel: string;
	aiBatchCount: number; // 一次生成数量
	aiGeneratedImageIds: string[]; // 存储文件 ID，最多 10 张
	aiImageMetas: Record<string, AIImageMeta>; // fileId -> 生成参数
}

// 获取 AI 生成状态
const getAIGenerationState = (): Partial<AIGenerationState> => {
	try {
		const data = localStorage.getItem(AI_GENERATION_STATE_KEY);
		return data ? JSON.parse(data) : {};
	} catch {
		return {};
	}
};

// 保存 AI 生成状态
const saveAIGenerationState = (state: Partial<AIGenerationState>) => {
	try {
		const existing = getAIGenerationState();
		const merged = {...existing, ...state};
		// 限制生成图片数量为 10 张
		if (merged.aiGeneratedImageIds && merged.aiGeneratedImageIds.length > 10) {
			merged.aiGeneratedImageIds = merged.aiGeneratedImageIds.slice(0, 10);
		}
		localStorage.setItem(AI_GENERATION_STATE_KEY, JSON.stringify(merged));
	} catch (error) {
		logger.error('[CoverDesigner] 保存 AI 生成状态失败:', error);
	}
};

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

	// AI 智能生成相关状态（从 localStorage 恢复）
	const [aiStyle, setAiStyle] = useState<string>(() => getAIGenerationState().aiStyle || 'illustration');
	const [aiModel, setAiModel] = useState<string>(() => getAIGenerationState().aiModel || 'nano-banana-pro');
	const [aiBatchCount, setAiBatchCount] = useState<number>(() => getAIGenerationState().aiBatchCount || 1);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	// 正在生成中的骨架屏数量
	const [pendingSkeletons, setPendingSkeletons] = useState(0);
	// 存储文件 ID 列表（持久化）
	const [aiGeneratedImageIds, setAiGeneratedImageIds] = useState<string[]>(() => getAIGenerationState().aiGeneratedImageIds || []);
	// 存储 ID -> URL 的映射（运行时）
	const [aiImageUrlMap, setAiImageUrlMap] = useState<Map<string, string>>(new Map());
	// 存储 ID -> 生成参数的映射（持久化）
	const [aiImageMetas, setAiImageMetas] = useState<Record<string, AIImageMeta>>(() => getAIGenerationState().aiImageMetas || {});
	const [aiTargetCover, setAiTargetCover] = useState<1 | 2>(() => getAIGenerationState().aiTargetCover || 1);
	// 预览的图片 ID（改为存 fileId 以便获取元数据）
	const [previewImageId, setPreviewImageId] = useState<string | null>(null);

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

	// 持久化 AI 生成状态
	useEffect(() => {
		saveAIGenerationState({aiStyle});
	}, [aiStyle]);

	useEffect(() => {
		saveAIGenerationState({aiModel});
	}, [aiModel]);

	useEffect(() => {
		saveAIGenerationState({aiTargetCover});
	}, [aiTargetCover]);

	useEffect(() => {
		saveAIGenerationState({aiBatchCount});
	}, [aiBatchCount]);

	useEffect(() => {
		// 只保存最近 10 张生成的图片 ID
		saveAIGenerationState({aiGeneratedImageIds: aiGeneratedImageIds.slice(0, 10)});
	}, [aiGeneratedImageIds]);

	useEffect(() => {
		saveAIGenerationState({aiImageMetas});
	}, [aiImageMetas]);

	// 初始化时从持久化存储恢复图片 URL
	useEffect(() => {
		const restoreImageUrls = async () => {
			if (aiGeneratedImageIds.length === 0) return;

			const files = await persistentStorageService.getFiles();
			const newUrlMap = new Map<string, string>();

			for (const id of aiGeneratedImageIds) {
				const file = files.find(f => f.id === id);
				if (file) {
					try {
						const url = await persistentStorageService.getFileUrl(file);
						newUrlMap.set(id, url);
					} catch (error) {
						logger.warn(`[CoverDesigner] 恢复 AI 生成图片失败: ${id}`, error);
					}
				}
			}

			setAiImageUrlMap(newUrlMap);

			// 清理无效的 ID
			const validIds = aiGeneratedImageIds.filter(id => newUrlMap.has(id));
			if (validIds.length !== aiGeneratedImageIds.length) {
				setAiGeneratedImageIds(validIds);
			}
		};

		restoreImageUrls();
	}, []); // 只在初始化时运行一次

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

	// AI 生成是否可用
	const isAIAvailable = settings?.aiProvider === 'zenmux' && !!settings?.zenmuxApiKey?.trim();

	// AI 一键生成封面（整合 prompt 生成 + 图片生成，支持批量）
	const handleOneClickGenerate = useCallback(async () => {
		if (!isAIAvailable) return;

		setIsGeneratingImage(true);
		setGenerationError('');
		setPendingSkeletons(aiBatchCount); // 显示骨架屏
		setGenerationStatus({isGenerating: true, progress: 5, message: '正在分析文章...'});

		try {
			// Step 1: 生成 prompt（只需一次）
			logger.info('[CoverDesigner] 开始一键生成封面 - 分析文章', {batchCount: aiBatchCount});
			const promptResult = await imageGenerationService.generateCoverPrompt(articleHTML, aiStyle, settings);
			if (!promptResult.success || !promptResult.positivePrompt) {
				throw new Error(promptResult.error || '分析文章失败');
			}
			logger.info('[CoverDesigner] 提示词生成成功', {prompt: promptResult.positivePrompt.substring(0, 100)});

			const dimensions = getDimensions(aiTargetCover);
			let successCount = 0;

			// Step 2: 批量生成图片，每张实时更新
			for (let i = 0; i < aiBatchCount; i++) {
				const progressBase = 20 + (i / aiBatchCount) * 70;
				setGenerationStatus({isGenerating: true, progress: progressBase, message: `正在生成第 ${i + 1}/${aiBatchCount} 张...`});

				const result = await imageGenerationService.generateImage({
					prompt: promptResult.positivePrompt,
					negativePrompt: promptResult.negativePrompt,
					style: aiStyle,
					aspectRatio: dimensions.aspectRatio,
					width: dimensions.width,
					height: dimensions.height,
					settings,
					useNanoBananaPro: aiModel === 'nano-banana-pro'
				});

				if (result.success && result.imageUrl) {
					const fileName = `ai-cover-${Date.now()}-${i}.png`;
					const savedFile = await persistentStorageService.saveFileFromUrl(result.imageUrl, fileName, 'image/png');
					const meta: AIImageMeta = {
						style: aiStyle,
						model: aiModel,
						targetCover: aiTargetCover,
						aspectRatio: dimensions.aspectRatio,
						width: dimensions.width,
						height: dimensions.height,
						createdAt: new Date().toISOString()
					};

					// 实时更新状态
					setAiGeneratedImageIds(prev => [savedFile.id, ...prev].slice(0, 10));
					setAiImageUrlMap(prev => new Map(prev).set(savedFile.id, result.imageUrl!));
					setAiImageMetas(prev => ({...prev, [savedFile.id]: meta}));
					setPendingSkeletons(prev => Math.max(0, prev - 1)); // 减少骨架屏

					successCount++;
					logger.info(`[CoverDesigner] AI 封面 ${i + 1}/${aiBatchCount} 生成成功`, {fileId: savedFile.id});
				} else {
					setPendingSkeletons(prev => Math.max(0, prev - 1)); // 失败也减少
					logger.warn(`[CoverDesigner] AI 封面 ${i + 1}/${aiBatchCount} 生成失败:`, result.error);
				}
			}

			if (successCount > 0) {
				setGenerationStatus({isGenerating: false, progress: 100, message: `生成完成! (${successCount}/${aiBatchCount})`});
			} else {
				throw new Error('所有图片生成失败');
			}
		} catch (error) {
			logger.error('[CoverDesigner] AI 封面生成失败:', error);
			setGenerationError(error instanceof Error ? error.message : '生成封面失败');
			setGenerationStatus({isGenerating: false, progress: 0, message: ''});
		} finally {
			setIsGeneratingImage(false);
			setPendingSkeletons(0); // 确保清空骨架屏
		}
	}, [articleHTML, aiStyle, aiModel, aiTargetCover, aiBatchCount, settings, isAIAvailable, getDimensions]);

	// 选择 AI 生成的图片作为封面
	const handleSelectAiImage = useCallback(async (fileId: string) => {
		const url = aiImageUrlMap.get(fileId);
		if (url) {
			await createCover(url, 'ai', aiTargetCover, url);
		}
	}, [createCover, aiTargetCover, aiImageUrlMap]);

	return (
		<div className="@container space-y-4 relative">
			{/* 卡片1: 封面设计 */}
			<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm space-y-3">
				{/* 头部和操作按钮 */}
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
					<h4 className="text-sm font-medium text-foreground">封面预览</h4>
					<div className="flex space-x-1 sm:space-x-2">
						<button
							onClick={handleDownloadCovers}
							className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
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
							className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm border border-border"
						>
							<RotateCcw className="h-3 w-3 sm:h-4 sm:w-4"/>
							<span className="hidden @md:inline">清空全部</span>
						</button>
					</div>
				</div>

				{/* 封面卡片区域 - Grid 布局，宽度比例 2.25:1 使高度自然相等 */}
				<div className="grid grid-cols-1 sm:grid-cols-[2.25fr_1fr] gap-2 sm:gap-3 w-full [&>*]:min-w-0">
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
			</div>

			{/* 卡片2: AI 智能生成区域 */}
			<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
				<div className="flex items-center gap-2 mb-3">
					<Sparkles className="h-4 w-4 text-primary"/>
					<h4 className="text-sm font-serif font-medium text-foreground">AI 智能生成</h4>
				</div>

				{!isAIAvailable ? (
					<div className="text-center py-4">
						<p className="text-sm text-muted-foreground mb-2">需要配置 ZenMux API 才能使用 AI 生成</p>
						{onOpenAISettings && (
							<button
								onClick={onOpenAISettings}
								className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
							>
								<Settings className="h-3.5 w-3.5"/>
								前往 AI 设置
							</button>
						)}
					</div>
				) : (
					<div className="space-y-3">
						{/* 选项行：模型 + 风格 + 目标封面 */}
						<div className="flex flex-wrap gap-2 items-center">
							<select
								value={aiModel}
								onChange={(e) => setAiModel(e.target.value)}
								className="px-2 py-1.5 text-xs border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
							>
								{AI_IMAGE_MODELS.map(m => (
									<option key={m.value} value={m.value}>{m.label}</option>
								))}
							</select>

							<select
								value={aiStyle}
								onChange={(e) => setAiStyle(e.target.value)}
								className="px-2 py-1.5 text-xs border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
							>
								<option value="illustration">插画风格</option>
								<option value="realistic">写实风格</option>
								<option value="minimalist">简约风格</option>
								<option value="abstract">抽象风格</option>
								<option value="vintage">复古风格</option>
							</select>

							<select
								value={aiTargetCover}
								onChange={(e) => setAiTargetCover(Number(e.target.value) as 1 | 2)}
								className="px-2 py-1.5 text-xs border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
							>
								<option value={1}>封面1 (2.25:1)</option>
								<option value={2}>封面2 (1:1)</option>
							</select>

							<Select value={String(aiBatchCount)} onValueChange={(v) => setAiBatchCount(Number(v))}>
								<SelectTrigger size="sm" className="w-auto text-xs">
									<SelectValue placeholder="数量"/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">1张</SelectItem>
									<SelectItem value="2">2张</SelectItem>
									<SelectItem value="3">3张</SelectItem>
									<SelectItem value="4">4张</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* 一键生成按钮 */}
						<button
							onClick={handleOneClickGenerate}
							disabled={isGeneratingImage}
							className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Sparkles className={`h-4 w-4 ${isGeneratingImage ? 'animate-pulse' : ''}`}/>
							{isGeneratingImage ? generationStatus.message || '生成中...' : '一键生成封面'}
						</button>

						{/* 进度条 */}
						{isGeneratingImage && (
							<div className="w-full bg-muted rounded-full h-1.5">
								<div
									className="h-1.5 rounded-full bg-primary transition-all duration-300"
									style={{width: `${generationStatus.progress}%`}}
								/>
							</div>
						)}

						{/* 错误提示 */}
						{generationError && (
							<p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{generationError}</p>
						)}

						{/* 生成的图片预览 */}
						{(aiGeneratedImageIds.length > 0 || pendingSkeletons > 0) && (
							<div className="space-y-2">
								<p className="text-xs text-muted-foreground">生成历史，单击预览</p>
								<div className="grid grid-cols-3 gap-2">
									{/* 骨架屏 - 显示在最前面 */}
									{Array.from({length: pendingSkeletons}).map((_, index) => (
										<div
											key={`skeleton-${index}`}
											className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted animate-pulse"
										>
											<div className="absolute inset-0 flex items-center justify-center">
												<Sparkles className="h-5 w-5 text-primary/50 animate-spin"/>
											</div>
										</div>
									))}
									{/* 已生成的图片 */}
									{aiGeneratedImageIds.map((fileId) => {
										const url = aiImageUrlMap.get(fileId);
										if (!url) return null;
										return (
											<button
												key={fileId}
												onClick={() => setPreviewImageId(fileId)}
												onDoubleClick={() => handleSelectAiImage(fileId)}
												className="relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
											>
												<img src={url} alt="AI 生成图片" className="w-full h-full object-cover"/>
												<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
													<Eye className="h-4 w-4 text-white"/>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				)}
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

			{/* AI 生成图片预览弹窗 */}
			{previewImageId && (() => {
				const previewUrl = aiImageUrlMap.get(previewImageId);
				const previewMeta = aiImageMetas[previewImageId];
				if (!previewUrl) return null;

				// 风格标签映射
				const styleLabels: Record<string, string> = {
					illustration: '插画',
					realistic: '写实',
					minimalist: '简约',
					abstract: '抽象',
					vintage: '复古'
				};

				return (
					<div
						className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
						onClick={() => setPreviewImageId(null)}
					>
						<div
							className="relative max-w-3xl max-h-[80vh] bg-card rounded-xl overflow-hidden shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							<img
								src={previewUrl}
								alt="预览"
								className="max-w-full max-h-[60vh] object-contain"
							/>
							{/* 参数信息 */}
							{previewMeta && (
								<div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
									<span className="px-2 py-1 text-xs bg-black/60 text-white rounded-md">
										{AI_IMAGE_MODELS.find(m => m.value === previewMeta.model)?.label || previewMeta.model}
									</span>
									<span className="px-2 py-1 text-xs bg-black/60 text-white rounded-md">
										{styleLabels[previewMeta.style] || previewMeta.style}
									</span>
									<span className="px-2 py-1 text-xs bg-black/60 text-white rounded-md">
										{previewMeta.aspectRatio}
									</span>
									<span className="px-2 py-1 text-xs bg-black/60 text-white rounded-md">
										{previewMeta.width}×{previewMeta.height}
									</span>
								</div>
							)}
							<div className="absolute top-2 right-2 flex gap-2">
								<button
									onClick={() => setPreviewImageId(null)}
									className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
									title="关闭"
								>
									<X className="h-5 w-5"/>
								</button>
							</div>
							<div className="p-3 bg-card border-t border-border flex justify-between items-center gap-2">
								{/* 时间信息 */}
								<span className="text-xs text-muted-foreground">
									{previewMeta?.createdAt ? new Date(previewMeta.createdAt).toLocaleString() : ''}
								</span>
								<div className="flex gap-2">
									<button
										onClick={() => setPreviewImageId(null)}
										className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										取消
									</button>
									<button
										onClick={async () => {
											try {
												const response = await fetch(previewUrl);
												const blob = await response.blob();
												await navigator.clipboard.write([
													new ClipboardItem({[blob.type]: blob})
												]);
											} catch (err) {
												logger.error('复制图片失败:', err);
											}
										}}
										className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
									>
										<Copy className="h-4 w-4"/>
										复制
									</button>
									<button
										onClick={async () => {
											try {
												const response = await fetch(previewUrl);
												const blob = await response.blob();
												const url = URL.createObjectURL(blob);
												const a = document.createElement('a');
												a.href = url;
												a.download = `cover-${Date.now()}.png`;
												a.click();
												URL.revokeObjectURL(url);
											} catch (err) {
												logger.error('下载图片失败:', err);
											}
										}}
										className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
									>
										<Download className="h-4 w-4"/>
										下载
									</button>
									<button
										onClick={async () => {
											await createCover(previewUrl, 'ai', 1, previewUrl);
											setPreviewImageId(null);
										}}
										className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
									>
										<Check className="h-4 w-4"/>
										封面1
									</button>
									<button
										onClick={async () => {
											await createCover(previewUrl, 'ai', 2, previewUrl);
											setPreviewImageId(null);
										}}
										className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
									>
										<Check className="h-4 w-4"/>
										封面2
									</button>
								</div>
							</div>
						</div>
					</div>
				);
			})()}

			{/* 隐藏的 canvas 元素 */}
			<canvas ref={canvasRef} style={{display: 'none'}}/>
		</div>
	);
};
