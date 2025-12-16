import {
	ArticleInfoData,
	PersistentArticleInfo,
	PersistentCover,
	PersistentFile,
	PersistentPersonalInfo,
	PersistentPluginConfig,
	PersistentStyleSettings,
	PersistentTemplateKit,
	PersonalInfo,
	TemplateKit
} from '../types';

const STORAGE_KEYS = {
	FILES: 'lovpen-persistent-files',
	COVERS: 'lovpen-persistent-covers',
	TEMPLATE_KITS: 'lovpen-persistent-template-kits',
	PLUGIN_CONFIGS: 'lovpen-persistent-plugin-configs',
	PERSONAL_INFO: 'lovpen-persistent-personal-info',
	ARTICLE_INFO: 'lovpen-persistent-article-info',
	STYLE_SETTINGS: 'lovpen-persistent-style-settings'
} as const;

export class PersistentStorageService {
	private static instance: PersistentStorageService;
	private obsidianVault: any;
	private urlCache: Map<string, string> = new Map(); // 文件路径 -> blob URL 的缓存

	private constructor() {
		this.obsidianVault = (window as any).app?.vault;
	}

	static getInstance(): PersistentStorageService {
		if (!PersistentStorageService.instance) {
			PersistentStorageService.instance = new PersistentStorageService();
		}
		return PersistentStorageService.instance;
	}

	async saveFile(file: File, customName?: string): Promise<PersistentFile> {
		const id = this.generateId();
		const name = customName || file.name;
		const fileName = `lovpen-files/${id}-${name}`;

		try {
			// 确保目录存在
			await this.ensureDirectoryExists('lovpen-files');

			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			if (this.obsidianVault?.adapter?.write) {
				await this.obsidianVault.adapter.write(fileName, uint8Array);
			}

			const persistentFile: PersistentFile = {
				id,
				name,
				path: fileName,
				type: file.type,
				size: file.size,
				createdAt: new Date().toISOString(),
				lastUsed: new Date().toISOString()
				// 不保存 blob，因为它无法序列化到 localStorage
			};

			await this.addFileToIndex(persistentFile);
			return persistentFile;
		} catch (error) {
			console.error('保存文件失败:', error);
			throw error;
		}
	}

	async saveFileFromUrl(url: string, name: string, type: string): Promise<PersistentFile> {
		const id = this.generateId();
		const fileName = `lovpen-files/${id}-${name}`;

		try {
			// 确保目录存在
			await this.ensureDirectoryExists('lovpen-files');

			let arrayBuffer: ArrayBuffer;

			if (url.startsWith('http://') || url.startsWith('https://')) {
				// 在Obsidian环境中使用requestUrl，否则使用fetch
				if (window.lovpenReactAPI && typeof window.lovpenReactAPI.requestUrl !== 'undefined') {
					const response = await window.lovpenReactAPI.requestUrl({url, method: 'GET'});
					arrayBuffer = response.arrayBuffer;
				} else {
					const response = await fetch(url);
					arrayBuffer = await response.arrayBuffer();
				}
			} else if (url.startsWith('blob:') || url.startsWith('data:')) {
				const response = await fetch(url);
				arrayBuffer = await response.arrayBuffer();
			} else {
				throw new Error('不支持的URL类型');
			}

			const uint8Array = new Uint8Array(arrayBuffer);

			if (this.obsidianVault?.adapter?.write) {
				await this.obsidianVault.adapter.write(fileName, uint8Array);
			}

			const persistentFile: PersistentFile = {
				id,
				name,
				path: fileName,
				type,
				size: arrayBuffer.byteLength,
				createdAt: new Date().toISOString(),
				lastUsed: new Date().toISOString()
			};

			await this.addFileToIndex(persistentFile);
			return persistentFile;
		} catch (error) {
			console.error('从URL保存文件失败:', error);
			throw error;
		}
	}

	async getFiles(): Promise<PersistentFile[]> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.FILES);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('获取文件列表失败:', error);
			return [];
		}
	}

	async deleteFile(id: string): Promise<void> {
		try {
			const files = await this.getFiles();
			const fileToDelete = files.find(f => f.id === id);

			if (fileToDelete && this.obsidianVault?.adapter?.remove) {
				await this.obsidianVault.adapter.remove(fileToDelete.path);
			}

			// 清理 URL 缓存
			if (fileToDelete && this.urlCache.has(fileToDelete.path)) {
				const url = this.urlCache.get(fileToDelete.path);
				if (url) {
					URL.revokeObjectURL(url);
				}
				this.urlCache.delete(fileToDelete.path);
			}

			const updatedFiles = files.filter(f => f.id !== id);
			localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(updatedFiles));
		} catch (error) {
			console.error('删除文件失败:', error);
			throw error;
		}
	}

	async getFileUrl(file: PersistentFile): Promise<string> {
		try {
			console.log(`[PersistentStorage] 获取文件URL:`, {
				id: file.id,
				name: file.name,
				path: file.path,
				type: file.type,
				size: file.size
			});

			if (!file.path) {
				throw new Error('文件路径不存在');
			}

			// 检查缓存中是否已有有效的 URL
			const cachedUrl = this.urlCache.get(file.path);
			if (cachedUrl) {
				// 验证 blob URL 是否仍然有效
				try {
					const response = await fetch(cachedUrl, {method: 'HEAD'});
					if (response.ok) {
						console.log(`[PersistentStorage] 使用缓存的URL`);
						return cachedUrl;
					}
				} catch (error) {
					console.log(`[PersistentStorage] 缓存URL已失效，清除缓存`);
					this.urlCache.delete(file.path);
				}
			}

			if (!this.obsidianVault?.adapter?.read) {
				throw new Error('Obsidian adapter 不可用');
			}

			// 检查文件是否存在
			if (this.obsidianVault?.adapter?.exists) {
				const exists = await this.obsidianVault.adapter.exists(file.path);
				console.log(`[PersistentStorage] 文件是否存在:`, exists);
				if (!exists) {
					throw new Error(`文件不存在: ${file.path}`);
				}
			}

			// 尝试以二进制方式读取文件
			let data: any;
			console.log(`[PersistentStorage] 尝试读取文件:`, file.path);

			// 检查 Obsidian adapter 的可用方法
			console.log(`[PersistentStorage] Adapter 方法:`, {
				hasRead: !!this.obsidianVault?.adapter?.read,
				hasReadBinary: !!this.obsidianVault?.adapter?.readBinary,
				adapterType: this.obsidianVault?.adapter?.constructor?.name
			});

			// 尝试使用 readBinary 方法（如果可用）
			if (this.obsidianVault?.adapter?.readBinary) {
				console.log(`[PersistentStorage] 使用 readBinary 方法`);
				data = await this.obsidianVault.adapter.readBinary(file.path);
			} else {
				console.log(`[PersistentStorage] 使用 read 方法`);
				data = await this.obsidianVault.adapter.read(file.path);
			}

			console.log(`[PersistentStorage] 读取文件成功:`, {
				dataType: typeof data,
				constructor: data?.constructor?.name,
				size: data?.length || data?.byteLength || 'unknown',
				isArrayBuffer: data instanceof ArrayBuffer,
				isUint8Array: data instanceof Uint8Array,
				isString: typeof data === 'string'
			});

			// 处理不同的数据格式
			let binaryData: ArrayBuffer | Uint8Array;
			if (data instanceof ArrayBuffer) {
				console.log(`[PersistentStorage] 数据是 ArrayBuffer`);
				binaryData = data;
			} else if (data instanceof Uint8Array) {
				console.log(`[PersistentStorage] 数据是 Uint8Array`);
				binaryData = data;
			} else if (typeof data === 'string') {
				console.log(`[PersistentStorage] 数据是字符串，长度:`, data.length);
				// 字符串数据，可能是被错误地当作文本读取了
				// 尝试将字符串的每个字符转换为字节
				const uint8Array = new Uint8Array(data.length);
				for (let i = 0; i < data.length; i++) {
					uint8Array[i] = data.charCodeAt(i) & 0xFF; // 只取低8位
				}
				binaryData = uint8Array;
				console.log(`[PersistentStorage] 字符串转二进制完成，长度:`, uint8Array.length);
			} else {
				console.log(`[PersistentStorage] 其他数据类型，尝试转换`);
				binaryData = new Uint8Array(data);
			}

			const blob = new Blob([binaryData as BlobPart], {type: file.type || 'application/octet-stream'});
			console.log(`[PersistentStorage] 创建 blob:`, {size: blob.size, type: blob.type});

			if (blob.size === 0) {
				throw new Error('创建的 blob 为空');
			}

			const url = URL.createObjectURL(blob);
			console.log(`[PersistentStorage] 成功创建文件URL`);

			// 将新的 URL 加入缓存
			this.urlCache.set(file.path, url);

			return url;

		} catch (error) {
			console.error(`[PersistentStorage] 获取文件URL失败:`, error);
			throw error;
		}
	}

	// 清理所有缓存的 URL
	clearUrlCache(): void {
		for (const url of this.urlCache.values()) {
			URL.revokeObjectURL(url);
		}
		this.urlCache.clear();
		console.log('[PersistentStorage] 已清理所有缓存URL');
	}

	// 预加载常用文件的 URL 缓存
	async preloadFileUrls(): Promise<void> {
		try {
			const files = await this.getFiles();
			console.log(`[PersistentStorage] 预加载 ${files.length} 个文件的URL`);

			// 并发加载所有文件URL
			await Promise.allSettled(
				files.map(async (file) => {
					try {
						await this.getFileUrl(file);
					} catch (error) {
						console.warn(`预加载文件 ${file.name} 失败:`, error);
					}
				})
			);
		} catch (error) {
			console.error('[PersistentStorage] 预加载文件URL失败:', error);
		}
	}

	async updateFileUsage(id: string): Promise<void> {
		const files = await this.getFiles();
		const fileIndex = files.findIndex(f => f.id === id);

		if (fileIndex !== -1) {
			files[fileIndex].lastUsed = new Date().toISOString();
			localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
		}
	}

	async pinFile(id: string): Promise<void> {
		const files = await this.getFiles();
		const fileIndex = files.findIndex(f => f.id === id);

		if (fileIndex === -1) {
			throw new Error('文件不存在');
		}

		// 检查已pin的文件数量
		const pinnedFiles = files.filter(f => f.isPinned);
		if (pinnedFiles.length >= 3 && !files[fileIndex].isPinned) {
			throw new Error('最多只能pin 3个文件');
		}

		files[fileIndex].isPinned = true;
		files[fileIndex].pinnedAt = new Date().toISOString();
		localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
	}

	async unpinFile(id: string): Promise<void> {
		const files = await this.getFiles();
		const fileIndex = files.findIndex(f => f.id === id);

		if (fileIndex !== -1) {
			files[fileIndex].isPinned = false;
			delete files[fileIndex].pinnedAt;
			localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
		}
	}

	// Template Kit Management
	async saveTemplateKit(kitData: TemplateKit, customName?: string): Promise<PersistentTemplateKit> {
		const id = this.generateId();
		const name = customName || kitData.basicInfo.name;

		try {
			const persistentKit: PersistentTemplateKit = {
				id,
				name,
				description: kitData.basicInfo.description,
				author: kitData.basicInfo.author,
				version: kitData.basicInfo.version,
				tags: kitData.basicInfo.tags,
				configData: kitData,
				createdAt: new Date().toISOString(),
				lastUsed: new Date().toISOString()
			};

			await this.addTemplateKitToIndex(persistentKit);
			return persistentKit;
		} catch (error) {
			console.error('保存模板套装失败:', error);
			throw error;
		}
	}

	async getTemplateKits(): Promise<PersistentTemplateKit[]> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATE_KITS);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('获取模板套装列表失败:', error);
			return [];
		}
	}

	async deleteTemplateKit(id: string): Promise<void> {
		try {
			const kits = await this.getTemplateKits();
			const updatedKits = kits.filter(k => k.id !== id);
			localStorage.setItem(STORAGE_KEYS.TEMPLATE_KITS, JSON.stringify(updatedKits));
		} catch (error) {
			console.error('删除模板套装失败:', error);
			throw error;
		}
	}

	// Plugin Configuration Management
	async savePluginConfig(pluginName: string, config: any, metaConfig: any): Promise<PersistentPluginConfig> {
		try {
			const configs = await this.getPluginConfigs();
			const existingIndex = configs.findIndex(c => c.pluginName === pluginName);

			const persistentConfig: PersistentPluginConfig = {
				id: existingIndex >= 0 ? configs[existingIndex].id : this.generateId(),
				pluginName,
				config,
				metaConfig,
				updatedAt: new Date().toISOString()
			};

			if (existingIndex >= 0) {
				configs[existingIndex] = persistentConfig;
			} else {
				configs.push(persistentConfig);
			}

			localStorage.setItem(STORAGE_KEYS.PLUGIN_CONFIGS, JSON.stringify(configs));
			return persistentConfig;
		} catch (error) {
			console.error('保存插件配置失败:', error);
			throw error;
		}
	}

	async getPluginConfigs(): Promise<PersistentPluginConfig[]> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.PLUGIN_CONFIGS);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('获取插件配置失败:', error);
			return [];
		}
	}

	async getPluginConfig(pluginName: string): Promise<PersistentPluginConfig | null> {
		const configs = await this.getPluginConfigs();
		return configs.find(c => c.pluginName === pluginName) || null;
	}

	// Personal Info Management
	async savePersonalInfo(info: PersonalInfo): Promise<PersistentPersonalInfo> {
		try {
			const persistentInfo: PersistentPersonalInfo = {
				id: 'personal-info', // 单例
				data: info,
				updatedAt: new Date().toISOString()
			};

			localStorage.setItem(STORAGE_KEYS.PERSONAL_INFO, JSON.stringify(persistentInfo));
			return persistentInfo;
		} catch (error) {
			console.error('保存个人信息失败:', error);
			throw error;
		}
	}

	async getPersonalInfo(): Promise<PersistentPersonalInfo | null> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_INFO);
			return stored ? JSON.parse(stored) : null;
		} catch (error) {
			console.error('获取个人信息失败:', error);
			return null;
		}
	}

	// Article Info Management
	async saveArticleInfo(info: ArticleInfoData): Promise<PersistentArticleInfo> {
		try {
			const persistentInfo: PersistentArticleInfo = {
				id: 'article-info', // 单例
				data: info,
				updatedAt: new Date().toISOString()
			};

			localStorage.setItem(STORAGE_KEYS.ARTICLE_INFO, JSON.stringify(persistentInfo));
			return persistentInfo;
		} catch (error) {
			console.error('保存文章信息失败:', error);
			throw error;
		}
	}

	async getArticleInfo(): Promise<PersistentArticleInfo | null> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.ARTICLE_INFO);
			return stored ? JSON.parse(stored) : null;
		} catch (error) {
			console.error('获取文章信息失败:', error);
			return null;
		}
	}

	// Style Settings Management
	async saveStyleSettings(settings: {
		defaultStyle: string;
		defaultHighlight: string;
		defaultTemplate: string;
		useTemplate: boolean;
		enableThemeColor: boolean;
		themeColor: string;
	}): Promise<PersistentStyleSettings> {
		try {
			const persistentSettings: PersistentStyleSettings = {
				id: 'style-settings', // 单例
				...settings,
				updatedAt: new Date().toISOString()
			};

			localStorage.setItem(STORAGE_KEYS.STYLE_SETTINGS, JSON.stringify(persistentSettings));
			return persistentSettings;
		} catch (error) {
			console.error('保存样式设置失败:', error);
			throw error;
		}
	}

	async getStyleSettings(): Promise<PersistentStyleSettings | null> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.STYLE_SETTINGS);
			return stored ? JSON.parse(stored) : null;
		} catch (error) {
			console.error('获取样式设置失败:', error);
			return null;
		}
	}

	// Cover Management
	async saveCover(coverData: any): Promise<PersistentCover> {
		try {
			const id = this.generateId();
			const persistentCover: PersistentCover = {
				id,
				name: coverData.name || `封面-${id}`,
				coverData,
				createdAt: new Date().toISOString(),
				lastUsed: new Date().toISOString()
			};

			await this.addCoverToIndex(persistentCover);
			return persistentCover;
		} catch (error) {
			console.error('保存封面失败:', error);
			throw error;
		}
	}

	async getCovers(): Promise<PersistentCover[]> {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.COVERS);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('获取封面列表失败:', error);
			return [];
		}
	}

	async deleteCover(id: string): Promise<void> {
		try {
			const covers = await this.getCovers();
			const updatedCovers = covers.filter(cover => cover.id !== id);
			localStorage.setItem(STORAGE_KEYS.COVERS, JSON.stringify(updatedCovers));
		} catch (error) {
			console.error('删除封面失败:', error);
			throw error;
		}
	}

	// Clear all persistent data
	async clearAllPersistentData(): Promise<void> {
		try {
			Object.values(STORAGE_KEYS).forEach(key => {
				localStorage.removeItem(key);
			});
			console.log('清空所有持久化数据完成');
		} catch (error) {
			console.error('清空持久化数据失败:', error);
			throw error;
		}
	}

	// Export all persistent data
	async exportAllData(): Promise<any> {
		try {
			const data = {
				files: await this.getFiles(),
				covers: await this.getCovers(),
				templateKits: await this.getTemplateKits(),
				pluginConfigs: await this.getPluginConfigs(),
				personalInfo: await this.getPersonalInfo(),
				articleInfo: await this.getArticleInfo(),
				styleSettings: await this.getStyleSettings(),
				exportedAt: new Date().toISOString()
			};
			return data;
		} catch (error) {
			console.error('导出数据失败:', error);
			throw error;
		}
	}

	private async ensureDirectoryExists(dirPath: string): Promise<void> {
		try {
			if (this.obsidianVault?.adapter?.exists) {
				const exists = await this.obsidianVault.adapter.exists(dirPath);
				if (!exists && this.obsidianVault?.adapter?.mkdir) {
					await this.obsidianVault.adapter.mkdir(dirPath);
				}
			}
		} catch (error) {
			console.warn('创建目录失败:', dirPath, error);
		}
	}

	private async addFileToIndex(file: PersistentFile): Promise<void> {
		const files = await this.getFiles();
		files.push(file);
		localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
	}

	private async addCoverToIndex(cover: PersistentCover): Promise<void> {
		const covers = await this.getCovers();
		covers.push(cover);
		localStorage.setItem(STORAGE_KEYS.COVERS, JSON.stringify(covers));
	}

	private async addTemplateKitToIndex(kit: PersistentTemplateKit): Promise<void> {
		const kits = await this.getTemplateKits();
		kits.push(kit);
		localStorage.setItem(STORAGE_KEYS.TEMPLATE_KITS, JSON.stringify(kits));
	}

	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}

export const persistentStorageService = PersistentStorageService.getInstance();
