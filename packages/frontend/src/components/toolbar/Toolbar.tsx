import React, {useEffect, useState} from "react";
import {TemplateKitSelector} from "./TemplateKitSelector";
import {CoverDesigner} from "./CoverDesigner";
import {ArticleInfo, ArticleInfoData} from "./ArticleInfo";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../ui/tabs";
import {ConfigComponent} from "./PluginConfigComponent";
import {SettingsModal} from "../settings/SettingsModal";
import {PersonalInfo, UnifiedPluginData, ViteReactSettings} from "../../types";
import {CoverData} from "@/components/toolbar/CoverData";
import {logger} from "../../../../shared/src/logger";
import {CheckCircle2, FileText, Package, Plug, XCircle, Zap} from "lucide-react";
import JSZip from 'jszip';

interface ToolbarProps {
	settings: ViteReactSettings;
	plugins: UnifiedPluginData[];
	articleHTML: string;
	onRefresh: () => void;
	onCopy: () => void;
	onDistribute: () => void;
	onTemplateChange: (template: string) => void;
	onThemeChange: (theme: string) => void;
	onHighlightChange: (highlight: string) => void;
	onThemeColorToggle: (enabled: boolean) => void;
	onThemeColorChange: (color: string) => void;
	onRenderArticle: () => void;
	onSaveSettings: () => void;
	onPluginToggle?: (pluginName: string, enabled: boolean) => void;
	onPluginConfigChange?: (pluginName: string, key: string, value: string | boolean) => void;
	onExpandedSectionsChange?: (sections: string[]) => void;
	onArticleInfoChange?: (info: ArticleInfoData) => void;
	onPersonalInfoChange?: (info: PersonalInfo) => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
	onKitApply?: (kitId: string) => void;
	onKitCreate?: (basicInfo: any) => void;
	onKitDelete?: (kitId: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
													settings,
													plugins,
													articleHTML,
													onRefresh,
													onCopy,
													onDistribute,
													onTemplateChange,
													onThemeChange,
													onHighlightChange,
													onThemeColorToggle,
													onThemeColorChange,
													onRenderArticle,
													onSaveSettings,
													onPluginToggle,
													onPluginConfigChange,
													onExpandedSectionsChange,
													onArticleInfoChange,
													onPersonalInfoChange,
													onSettingsChange,
													onKitApply,
													onKitCreate,
													onKitDelete,
												}) => {

	// 使用本地状态管理当前选中的tab
	const [activeTab, setActiveTab] = useState<string>(() => {
		try {
			return localStorage.getItem('lovpen-toolbar-active-tab') || 'basic';
		} catch {
			return 'basic';
		}
	});

	// 插件管理中的子tab状态
	const [pluginTab, setPluginTab] = useState<string>(() => {
		try {
			const saved = localStorage.getItem('lovpen-toolbar-plugin-tab');
			if (saved) return saved;
		} catch {}
		return plugins.some(p => p.type === 'rehype') ? 'rehype' : 'remark';
	});

	// 插件展开状态管理
	const [pluginExpandedSections, setPluginExpandedSections] = useState<string[]>(
		settings.expandedAccordionSections || []
	);

	// 设置模态框状态
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);


	// 当外部settings发生变化时，同步更新本地状态
	useEffect(() => {
		// 如果当前tab是样式设置但样式设置被关闭了，切换到基本信息
		if (activeTab === 'style' && !settings.showStyleUI) {
			setActiveTab('info');
		}
		// 同步插件展开状态
		setPluginExpandedSections(settings.expandedAccordionSections || []);
	}, [settings.showStyleUI, activeTab, settings.expandedAccordionSections]);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		// 持久化保存选中的tab
		try {
			localStorage.setItem('lovpen-toolbar-active-tab', value);
		} catch (error) {
			console.warn('Failed to save active tab to localStorage:', error);
		}
		// 保存当前选中的tab到settings
		const newSections = [value];
		if (onExpandedSectionsChange) {
			onExpandedSectionsChange(newSections);
		}
		onSaveSettings();
	};

	const remarkPlugins = plugins.filter(p => p.type === 'remark');
	const rehypePlugins = plugins.filter(p => p.type === 'rehype');

	const handleBatchToggle = (pluginType: 'remark' | 'rehype', enabled: boolean) => {
		(pluginType === 'remark' ? remarkPlugins : rehypePlugins)
			.forEach(plugin => onPluginToggle?.(plugin.name, enabled));
		onRenderArticle();
	};

	// 处理插件展开/折叠
	const handlePluginToggle = (sectionId: string, isExpanded: boolean) => {
		let newSections: string[];
		if (isExpanded) {
			newSections = pluginExpandedSections.includes(sectionId)
				? pluginExpandedSections
				: [...pluginExpandedSections, sectionId];
		} else {
			newSections = pluginExpandedSections.filter(id => id !== sectionId);
		}

		// 更新本地状态
		setPluginExpandedSections(newSections);

		// 通过回调函数更新外部settings
		if (onExpandedSectionsChange) {
			onExpandedSectionsChange(newSections);
		}
		onSaveSettings();
	};

	// 获取图片数据的通用函数
	const getImageArrayBuffer = async (imageUrl: string): Promise<ArrayBuffer> => {
		if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
			// HTTP/HTTPS URL - 使用Obsidian的requestUrl API
			if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
				throw new Error('此功能仅在Obsidian环境中可用');
			}
			const requestUrl = window.lovpenReactAPI.requestUrl;
			const response = await requestUrl({url: imageUrl, method: 'GET'});
			return response.arrayBuffer;
		} else if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
			// Blob URL 或 Data URL - 使用fetch API
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status}`);
			}
			return await response.arrayBuffer();
		} else {
			throw new Error(`不支持的URL协议: ${imageUrl}`);
		}
	};

	// 使用zip打包下载所有封面
	const downloadWithBrowserDownload = async (covers: CoverData[]) => {
		const cover1 = covers.find(c => c.aspectRatio === '2.25:1');
		const cover2 = covers.find(c => c.aspectRatio === '1:1');

		try {
			const zip = new JSZip();
			let fileCount = 0;

			// 添加单独的封面到zip
			for (const [index, cover] of covers.entries()) {
				try {
					const arrayBuffer = await getImageArrayBuffer(cover.imageUrl);
					const aspectStr = cover.aspectRatio.replace(':', '-').replace('.', '_');
					const fileName = `lovpen-cover-${index + 1}-${aspectStr}.jpg`;
					zip.file(fileName, arrayBuffer);
					fileCount++;
				} catch (error) {
					console.error(`准备封面 ${index + 1} 失败:`, error);
				}
			}

			// 如果有两个封面，添加拼接图到zip
			if (cover1 && cover2) {
				try {
					const combinedBlob = await createCombinedCoverBlob(cover1, cover2);
					const arrayBuffer = await combinedBlob.arrayBuffer();
					const fileName = 'lovpen-cover-combined-3_25_1.jpg';
					zip.file(fileName, arrayBuffer);
					fileCount++;
				} catch (error) {
					console.error("准备拼接封面失败:", error);
				}
			}

			if (fileCount === 0) {
				alert('没有有效的封面可以下载');
				return;
			}

			// 生成zip文件
			const zipBlob = await zip.generateAsync({type: 'blob'});

			// 创建下载链接
			const url = URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `lovpen-covers-${Date.now()}.zip`;
			a.style.display = 'none';

			document.body.appendChild(a);
			a.click();

			// 清理
			setTimeout(() => {
				// document.body.removeChild(a);
				// URL.revokeObjectURL(url);
			}, 2000);


		} catch (error) {
			console.error('创建zip文件失败:', error);
			alert('下载失败，请重试');
		}
	};

	// 处理封面下载
	const handleDownloadCovers = async (covers: CoverData[]) => {
		logger.info("[Toolbar] 下载封面", {count: covers.length});
		// 直接使用简单的下载方式，避免复杂的弹窗和权限问题
		await downloadWithBrowserDownload(covers);
	};

	// 创建拼接封面Blob的通用函数
	const createCombinedCoverBlob = async (cover1: CoverData, cover2: CoverData): Promise<Blob> => {
		// 下载两张图片的数据
		const [arrayBuffer1, arrayBuffer2] = await Promise.all([
			getImageArrayBuffer(cover1.imageUrl),
			getImageArrayBuffer(cover2.imageUrl)
		]);

		// 创建blob URL
		const blob1 = new Blob([arrayBuffer1], {type: 'image/jpeg'});
		const blob2 = new Blob([arrayBuffer2], {type: 'image/jpeg'});
		const url1 = URL.createObjectURL(blob1);
		const url2 = URL.createObjectURL(blob2);

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		// 设置画布尺寸 (3.25:1 比例，高度600px，提高分辨率)
		const height = 600;
		const width = height * 3.25;
		canvas.width = width;
		canvas.height = height;

		// 加载图片
		const img1 = document.createElement('img');
		const img2 = document.createElement('img');

		const loadImage = (img: HTMLImageElement, url: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = reject;
				img.src = url;
			});
		};

		await Promise.all([
			loadImage(img1, url1),
			loadImage(img2, url2)
		]);

		// 绘制第一张图 (2.25:1 比例)
		const img1Width = height * 2.25;
		ctx?.drawImage(img1, 0, 0, img1Width, height);

		// 绘制第二张图 (1:1 比例)
		const img2Width = height;
		ctx?.drawImage(img2, img1Width, 0, img2Width, height);

		// 清理blob URL
		URL.revokeObjectURL(url1);
		URL.revokeObjectURL(url2);

		// 转换为blob
		return new Promise((resolve) => {
			canvas.toBlob((blob) => {
				resolve(blob!);
			}, 'image/jpeg', 0.95);
		});
	};

	try {
		return (
			<div
				id="lovpen-toolbar-container"
				className="h-full flex flex-col bg-[#F9F9F7] relative"
				style={{
					minWidth: '320px',
					width: '100%',
					maxWidth: '100%',
					overflow: 'hidden',
					boxSizing: 'border-box'
				}}>
				<div className="flex-1 overflow-y-auto overflow-x-hidden">
					<div className="p-3 sm:p-6">
						{/* 工具栏标题 */}
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-[#181818] mb-2 tracking-tight">内容工具栏</h2>
							<p className="text-sm text-[#87867F]">管理文章信息、样式和插件配置</p>
						</div>

						<Tabs value={activeTab} onValueChange={handleTabChange}>
							<TabsList
								className="sticky top-0 z-10 grid w-full grid-cols-3 bg-[#F0EEE6] border border-[#E8E6DC] rounded-2xl p-1 gap-1 backdrop-blur-sm">
								<TabsTrigger
									value="basic"
									className="flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#D97757] data-[state=active]:shadow-md text-[#87867F] px-3 py-3 rounded-xl transition-all"
								>
									<FileText className="h-4 w-4 flex-shrink-0"/>
									<span className="truncate">基础</span>
								</TabsTrigger>
								<TabsTrigger
									value="kits"
									className="flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#D97757] data-[state=active]:shadow-md text-[#87867F] px-3 py-3 rounded-xl transition-all"
								>
									<Package className="h-4 w-4 flex-shrink-0"/>
									<span className="truncate">套装</span>
								</TabsTrigger>
								<TabsTrigger
									value="plugins"
									className="flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#D97757] data-[state=active]:shadow-md text-[#87867F] px-3 py-3 rounded-xl transition-all relative"
								>
									<Plug className="h-4 w-4 flex-shrink-0"/>
									<span className="truncate">插件</span>
									{plugins.length > 0 && (
										<span
											className="absolute -top-1 -right-1 bg-[#D97757] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center leading-none text-[10px] sm:static sm:bg-[#E8E6DC] sm:text-[#87867F] sm:px-2 sm:py-1 sm:ml-1 sm:w-auto sm:h-auto sm:rounded-full">
											{plugins.length > 99 ? '99+' : plugins.length}
										</span>
									)}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="mt-6 space-y-6">
								{/* 基本信息 */}
								<div
									className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
									<ArticleInfo
										settings={settings}
										onSaveSettings={onSaveSettings}
										onInfoChange={onArticleInfoChange || (() => {
										})}
										onRenderArticle={onRenderArticle}
										onSettingsChange={onSettingsChange}
									/>
								</div>

								{/* 封面设计 */}
								<div
									className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
									<CoverDesigner
										articleHTML={articleHTML}
										onDownloadCovers={handleDownloadCovers}
										onClose={() => {
										}}
									/>
								</div>
							</TabsContent>


							<TabsContent value="kits" className="mt-6">
								<div
									className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
									<TemplateKitSelector
										settings={settings}
										onKitApply={onKitApply}
										onKitCreate={onKitCreate}
										onKitDelete={onKitDelete}
										onSettingsChange={onSettingsChange}
										onTemplateChange={onTemplateChange}
										onThemeChange={onThemeChange}
										onHighlightChange={onHighlightChange}
										onThemeColorToggle={onThemeColorToggle}
										onThemeColorChange={onThemeColorChange}
									/>
								</div>
							</TabsContent>

							<TabsContent value="plugins" className="mt-6">
								<div
									className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
									{plugins.length > 0 ? (
										<Tabs value={pluginTab} onValueChange={(value) => {
											setPluginTab(value);
											// 持久化保存插件tab选择
											try {
												localStorage.setItem('lovpen-toolbar-plugin-tab', value);
											} catch (error) {
												console.warn('Failed to save plugin tab to localStorage:', error);
											}
										}}>
											<div className="mb-4">
												<h3 className="text-lg font-semibold text-[#181818] mb-2">插件管理</h3>
												<p className="text-sm text-[#87867F]">配置和管理Markdown处理插件</p>
											</div>

											<TabsList className="bg-[#F0EEE6] rounded-xl p-1">
												{remarkPlugins.length > 0 && (
													<TabsTrigger value="remark"
														className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#D97757] text-[#87867F] px-3 py-2 rounded-lg transition-all">
														<Plug className="h-4 w-4 flex-shrink-0"/>
														<span className="hidden sm:inline">Remark</span>
														<span className="sm:hidden">R</span>
														<span className="bg-[#C2C07D] text-white text-xs px-2 py-0.5 rounded-full">
															{remarkPlugins.length}
														</span>
													</TabsTrigger>
												)}
												{rehypePlugins.length > 0 && (
													<TabsTrigger value="rehype"
														className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#D97757] text-[#87867F] px-3 py-2 rounded-lg transition-all">
														<Zap className="h-4 w-4 flex-shrink-0"/>
														<span className="hidden sm:inline">Rehype</span>
														<span className="sm:hidden">H</span>
														<span className="bg-[#B49FD8] text-white text-xs px-2 py-0.5 rounded-full">
															{rehypePlugins.length}
														</span>
													</TabsTrigger>
												)}
											</TabsList>

											{remarkPlugins.length > 0 && (
												<TabsContent value="remark" className="mt-6">
													<div className="space-y-4">
														<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-[#F7F4EC] border border-[#E8E6DC] rounded-xl gap-3 sm:gap-0">
															<div>
																<h4 className="font-semibold text-[#181818]">Remark插件</h4>
																<p className="text-sm text-[#87867F]">Markdown语法解析插件({remarkPlugins.length}个)</p>
															</div>
															<div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
																<button onClick={() => handleBatchToggle('remark', true)}
																	className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#629A90] text-white hover:bg-[#52847C] rounded-xl transition-colors font-medium">
																	<CheckCircle2 className="h-4 w-4"/>
																	全部启用
																</button>
																<button onClick={() => handleBatchToggle('remark', false)}
																	className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-transparent border border-[#87867F] text-[#181818] hover:bg-[#F0EEE6] rounded-xl transition-colors font-medium">
																	<XCircle className="h-4 w-4"/>
																	全部关闭
																</button>
															</div>
														</div>
														<div className="space-y-1">
															{remarkPlugins.map(plugin => 
																<ConfigComponent key={plugin.name} item={plugin} type="plugin"
																	expandedSections={pluginExpandedSections} onToggle={handlePluginToggle}
																	onEnabledChange={(name, enabled) => onPluginToggle?.(name, enabled)}
																	onConfigChange={async (name, key, value) => {
																		onPluginConfigChange && await onPluginConfigChange(name, key, value);
																		onRenderArticle();
																	}}/>
															)}
														</div>
													</div>
												</TabsContent>
											)}
											{rehypePlugins.length > 0 && (
												<TabsContent value="rehype" className="mt-6">
													<div className="space-y-4">
														<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-[#F7F4EC] border border-[#E8E6DC] rounded-xl gap-3 sm:gap-0">
															<div>
																<h4 className="font-semibold text-[#181818]">Rehype插件</h4>
																<p className="text-sm text-[#87867F]">HTML处理和转换插件({rehypePlugins.length}个)</p>
															</div>
															<div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
																<button onClick={() => handleBatchToggle('rehype', true)}
																	className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#97B5D5] text-white hover:bg-[#7FA3C3] rounded-xl transition-colors font-medium">
																	<CheckCircle2 className="h-4 w-4"/>
																	全部启用
																</button>
																<button onClick={() => handleBatchToggle('rehype', false)}
																	className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-transparent border border-[#87867F] text-[#181818] hover:bg-[#F0EEE6] rounded-xl transition-colors font-medium">
																	<XCircle className="h-4 w-4"/>
																	全部关闭
																</button>
															</div>
														</div>
														<div className="space-y-1">
															{rehypePlugins.map(plugin => 
																<ConfigComponent key={plugin.name} item={plugin} type="plugin"
																	expandedSections={pluginExpandedSections} onToggle={handlePluginToggle}
																	onEnabledChange={(name, enabled) => onPluginToggle?.(name, enabled)}
																	onConfigChange={async (name, key, value) => {
																		onPluginConfigChange && await onPluginConfigChange(name, key, value);
																		onRenderArticle();
																	}}/>
															)}
														</div>
													</div>
												</TabsContent>
											)}
										</Tabs>
									) : (
										<div className="text-center py-12">
											<div className="p-6 bg-[#F7F4EC] border border-[#E8E6DC] rounded-2xl">
												<Plug className="h-12 w-12 text-[#87867F] mx-auto mb-4"/>
												<h3 className="text-lg font-semibold text-[#181818] mb-2">暂无插件</h3>
												<p className="text-sm text-[#87867F]">当前没有可用的Markdown处理插件</p>
											</div>
										</div>
									)}
								</div>
							</TabsContent>

						</Tabs>
					</div>
				</div>

				{/* 设置模态框 */}
				<SettingsModal
					isOpen={isSettingsModalOpen}
					onClose={() => setIsSettingsModalOpen(false)}
					onPersonalInfoChange={onPersonalInfoChange}
					onSaveSettings={onSaveSettings}
					onSettingsChange={onSettingsChange}
				/>
			</div>
		);
	} catch (error) {
		logger.error("[Toolbar] 完整工具栏渲染错误:", error);
		return (
			<div className="h-full flex flex-col bg-[#F9F9F7] p-6">
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6">
					<h3 className="text-lg font-semibold text-[#D97757] mb-2">完整工具栏渲染失败</h3>
					<p className="text-sm text-[#87867F]">错误信息: {error instanceof Error ? error.message : String(error)}</p>
				</div>
			</div>
		);
	}
};
