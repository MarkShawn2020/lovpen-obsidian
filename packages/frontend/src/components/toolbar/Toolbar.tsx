import React, {useEffect, useState} from "react";
import {TemplateKitSelector} from "./TemplateKitSelector";
import {CoverDesigner} from "./CoverDesigner";
import {ArticleInfo, ArticleInfoData} from "./ArticleInfo";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../ui/tabs";
import {ConfigComponent} from "./PluginConfigComponent";
import {PersonalInfoSettings} from "../settings/PersonalInfoSettings";
import {AISettings} from "../settings/AISettings";
import {PersonalInfo, UnifiedPluginData, ViteReactSettings} from "../../types";
import {CoverData} from "@/components/toolbar/CoverData";
import {logger} from "../../../../shared/src/logger";
import {FileText, Package, Plug, Zap, User, Bot, Globe, PanelLeft, PanelRight, Image, Palette, Menu, ChevronsLeft} from "lucide-react";
import JSZip from 'jszip';
import {Checkbox} from "../ui/checkbox";
import {Switch} from "../ui/switch";
import {useSettings} from "../../hooks/useSettings";

interface ToolbarProps {
	settings: ViteReactSettings;
	plugins: UnifiedPluginData[];
	articleHTML: string;
	onTemplateChange: (template: string) => void;
	onThemeChange: (theme: string) => void;
	onHighlightChange: (highlight: string) => void;
	onThemeColorToggle: (enabled: boolean) => void;
	onThemeColorChange: (color: string) => void;
	onRenderArticle: () => void;
	onSaveSettings: () => void;
	onPluginToggle?: (pluginName: string, enabled: boolean) => void;
	onPluginConfigChange?: (pluginName: string, key: string, value: string | boolean) => void;
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
													onTemplateChange,
													onThemeChange,
													onHighlightChange,
													onThemeColorToggle,
													onThemeColorChange,
													onRenderArticle,
													onSaveSettings,
													onPluginToggle,
													onPluginConfigChange,
													onArticleInfoChange,
													onPersonalInfoChange,
													onSettingsChange,
													onKitApply,
													onKitCreate,
													onKitDelete,
												}) => {

	// 使用 useSettings hook 获取设置更新方法
	const {settings: atomSettings, updateSettings, saveSettings} = useSettings(onSaveSettings, onPersonalInfoChange, onSettingsChange);

	// 统一的导航状态 - 苹果风格侧边栏
	type NavSection = 'article' | 'cover' | 'kits' | 'plugins' | 'personal' | 'ai' | 'general';
	const [activeSection, setActiveSection] = useState<NavSection>(() => {
		try {
			const saved = localStorage.getItem('lovpen-toolbar-section') as NavSection;
			return saved || 'article';
		} catch {
			return 'article';
		}
	});

	const handleSectionChange = (section: NavSection) => {
		setActiveSection(section);
		try {
			localStorage.setItem('lovpen-toolbar-section', section);
		} catch {}
	};

	// 侧边栏展开/收起状态
	const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
		try {
			const saved = localStorage.getItem('lovpen-sidebar-expanded');
			return saved !== 'false'; // 默认展开
		} catch {
			return true;
		}
	});

	const toggleSidebar = () => {
		const newValue = !sidebarExpanded;
		setSidebarExpanded(newValue);
		try {
			localStorage.setItem('lovpen-sidebar-expanded', String(newValue));
		} catch {}
	};

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



	// 同步插件展开状态
	useEffect(() => {
		setPluginExpandedSections(settings.expandedAccordionSections || []);
	}, [settings.expandedAccordionSections]);

	const remarkPlugins = plugins.filter(p => p.type === 'remark');
	const rehypePlugins = plugins.filter(p => p.type === 'rehype');

	const handleBatchToggle = (pluginType: 'remark' | 'rehype', enabled: boolean) => {
		(pluginType === 'remark' ? remarkPlugins : rehypePlugins)
			.forEach(plugin => onPluginToggle?.(plugin.name, enabled));
		onRenderArticle();
	};

	// 计算插件的全选状态
	const getPluginsCheckState = (plugins: UnifiedPluginData[]): boolean | 'indeterminate' => {
		const enabledCount = plugins.filter(p => p.enabled).length;
		if (enabledCount === 0) return false;
		if (enabledCount === plugins.length) return true;
		return 'indeterminate';
	};

	// 处理全选checkbox点击
	const handleSelectAllToggle = (pluginType: 'remark' | 'rehype') => {
		const plugins = pluginType === 'remark' ? remarkPlugins : rehypePlugins;
		const currentState = getPluginsCheckState(plugins);
		// 如果当前是全选或部分选中，则取消全选；如果是全不选，则全选
		const newState = currentState === false;
		handleBatchToggle(pluginType, newState);
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

	// 导航菜单配置
	const navItems: {key: typeof activeSection; label: string; icon: React.ElementType; color: string; group: 'content' | 'settings'}[] = [
		{key: 'article', label: '文章信息', icon: FileText, color: 'from-[#CC785C] to-[#B86A4E]', group: 'content'},
		{key: 'cover', label: '封面设计', icon: Palette, color: 'from-[#B49FD8] to-[#8B7CB8]', group: 'content'},
		{key: 'kits', label: '模板套装', icon: Package, color: 'from-[#629A90] to-[#4A7A70]', group: 'content'},
		{key: 'plugins', label: '插件管理', icon: Plug, color: 'from-[#97B5D5] to-[#7095B5]', group: 'content'},
		{key: 'personal', label: '个人信息', icon: User, color: 'from-[#C2C07D] to-[#A2A05D]', group: 'settings'},
		{key: 'ai', label: 'AI 设置', icon: Bot, color: 'from-[#CC785C] to-[#AC583C]', group: 'settings'},
		{key: 'general', label: '通用', icon: Globe, color: 'from-[#87867F] to-[#6A6A63]', group: 'settings'},
	];

	try {
		return (
			<div
				id="lovpen-toolbar-container"
				className="h-full flex bg-[#F9F9F7] relative"
				style={{
					minWidth: '320px',
					width: '100%',
					maxWidth: '100%',
					overflow: 'hidden',
					boxSizing: 'border-box'
				}}>
				{/* 左侧导航栏 - macOS 系统偏好设置风格 */}
				<div
					className={`bg-[#F0EEE6]/80 backdrop-blur-xl border-r border-[#E8E6DC] flex flex-col flex-shrink-0 transition-all duration-200 ${
						sidebarExpanded ? 'w-[180px]' : 'w-[52px]'
					}`}
				>
					{/* 顶部切换按钮 */}
					<div className="p-2 border-b border-[#E8E6DC]">
						<button
							onClick={toggleSidebar}
							className="w-full flex items-center justify-center p-2 rounded-lg text-[#87867F] hover:bg-[#E8E6DC]/80 hover:text-[#3d3d3d] transition-all"
							title={sidebarExpanded ? '收起菜单' : '展开菜单'}
						>
							{sidebarExpanded ? (
								<ChevronsLeft className="h-4 w-4"/>
							) : (
								<Menu className="h-4 w-4"/>
							)}
						</button>
					</div>

					<div className="flex-1 overflow-y-auto py-3 px-2">
						{/* 内容分组 */}
						<div className="mb-4">
							{sidebarExpanded && (
								<p className="text-[10px] text-[#87867F] uppercase tracking-wider font-medium px-2 mb-2">内容</p>
							)}
							<nav className={sidebarExpanded ? 'space-y-1' : 'space-y-2'}>
								{navItems.filter(item => item.group === 'content').map(({key, label, icon: Icon, color}) => (
									<button
										key={key}
										onClick={() => handleSectionChange(key)}
										title={!sidebarExpanded ? label : undefined}
										className={`w-full flex items-center transition-all ${
											sidebarExpanded
												? `gap-3 px-2 py-2 rounded-lg ${activeSection === key ? 'bg-[#CC785C] text-white shadow-sm' : 'text-[#3d3d3d] hover:bg-[#E8E6DC]/80'}`
												: 'justify-center py-1'
										}`}
										style={!sidebarExpanded ? { background: 'none', border: 'none', boxShadow: 'none' } : undefined}
									>
										<div
											className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} transition-transform ${
												!sidebarExpanded && activeSection === key ? 'scale-110' : ''
											}`}
											style={{ boxShadow: activeSection === key ? '0 0 0 2px rgba(204,120,92,0.6)' : 'none' }}
										>
											<Icon className="h-4 w-4 text-white"/>
										</div>
										{sidebarExpanded && (
											<>
												<span className="text-sm font-medium text-left flex-1">{label}</span>
												{key === 'plugins' && plugins.length > 0 && (
													<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
														activeSection === key ? 'bg-white/25 text-white' : 'bg-[#E8E6DC] text-[#87867F]'
													}`}>
														{plugins.length}
													</span>
												)}
											</>
										)}
									</button>
								))}
							</nav>
						</div>

						{/* 设置分组 */}
						<div>
							{sidebarExpanded && (
								<p className="text-[10px] text-[#87867F] uppercase tracking-wider font-medium px-2 mb-2">设置</p>
							)}
							<nav className={sidebarExpanded ? 'space-y-1' : 'space-y-2'}>
								{navItems.filter(item => item.group === 'settings').map(({key, label, icon: Icon, color}) => (
									<button
										key={key}
										onClick={() => handleSectionChange(key)}
										title={!sidebarExpanded ? label : undefined}
										className={`w-full flex items-center transition-all ${
											sidebarExpanded
												? `gap-3 px-2 py-2 rounded-lg ${activeSection === key ? 'bg-[#CC785C] text-white shadow-sm' : 'text-[#3d3d3d] hover:bg-[#E8E6DC]/80'}`
												: 'justify-center py-1'
										}`}
										style={!sidebarExpanded ? { background: 'none', border: 'none', boxShadow: 'none' } : undefined}
									>
										<div
											className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} transition-transform ${
												!sidebarExpanded && activeSection === key ? 'scale-110' : ''
											}`}
											style={{ boxShadow: activeSection === key ? '0 0 0 2px rgba(204,120,92,0.6)' : 'none' }}
										>
											<Icon className="h-4 w-4 text-white"/>
										</div>
										{sidebarExpanded && (
											<span className="text-sm font-medium text-left flex-1">{label}</span>
										)}
									</button>
								))}
							</nav>
						</div>
					</div>
				</div>

				{/* 右侧内容区 */}
				<div className="flex-1 overflow-y-auto bg-[#F9F9F7]">
					<div className="p-4 sm:p-5">
						{/* 文章信息 */}
						{activeSection === 'article' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">文章信息</h3>
								<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
									<ArticleInfo
										settings={settings}
										onSaveSettings={onSaveSettings}
										onInfoChange={onArticleInfoChange || (() => {})}
										onRenderArticle={onRenderArticle}
										onSettingsChange={onSettingsChange}
									/>
								</div>
							</div>
						)}

						{/* 封面设计 */}
						{activeSection === 'cover' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">封面设计</h3>
								<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
									<CoverDesigner
										articleHTML={articleHTML}
										onDownloadCovers={handleDownloadCovers}
										onClose={() => {}}
									/>
								</div>
							</div>
						)}

						{/* 模板套装 */}
						{activeSection === 'kits' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">模板套装</h3>
								<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
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
							</div>
						)}

						{/* 插件管理 */}
						{activeSection === 'plugins' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">插件管理</h3>
								<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
									{plugins.length > 0 ? (
										<Tabs value={pluginTab} onValueChange={(value) => {
											setPluginTab(value);
											try {
												localStorage.setItem('lovpen-toolbar-plugin-tab', value);
											} catch {}
										}}>
											<TabsList className="bg-[#F0EEE6] rounded-lg p-0.5 mb-4">
												{remarkPlugins.length > 0 && (
													<TabsTrigger value="remark"
														className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#CC785C] text-[#87867F] px-3 py-1.5 rounded-md">
														<Plug className="h-3.5 w-3.5"/>
														<span>Remark</span>
														<span className="bg-[#C2C07D] text-white text-[10px] px-1.5 py-0.5 rounded-full">{remarkPlugins.length}</span>
													</TabsTrigger>
												)}
												{rehypePlugins.length > 0 && (
													<TabsTrigger value="rehype"
														className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#CC785C] text-[#87867F] px-3 py-1.5 rounded-md">
														<Zap className="h-3.5 w-3.5"/>
														<span>Rehype</span>
														<span className="bg-[#B49FD8] text-white text-[10px] px-1.5 py-0.5 rounded-full">{rehypePlugins.length}</span>
													</TabsTrigger>
												)}
											</TabsList>

											{remarkPlugins.length > 0 && (
												<TabsContent value="remark" className="mt-0">
													<div className="space-y-3">
														<div className="flex items-center p-3 bg-[#F7F4EC] border border-[#E8E6DC] rounded-lg gap-2.5">
															<Checkbox
																checked={getPluginsCheckState(remarkPlugins)}
																onCheckedChange={() => handleSelectAllToggle('remark')}
																className="border-[#629A90] data-[state=checked]:bg-[#629A90]"
															/>
															<div>
																<h4 className="font-medium text-[#181818] text-sm">全选 Remark</h4>
																<p className="text-xs text-[#87867F]">Markdown 语法解析插件</p>
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
												<TabsContent value="rehype" className="mt-0">
													<div className="space-y-3">
														<div className="flex items-center p-3 bg-[#F7F4EC] border border-[#E8E6DC] rounded-lg gap-2.5">
															<Checkbox
																checked={getPluginsCheckState(rehypePlugins)}
																onCheckedChange={() => handleSelectAllToggle('rehype')}
																className="border-[#97B5D5] data-[state=checked]:bg-[#97B5D5]"
															/>
															<div>
																<h4 className="font-medium text-[#181818] text-sm">全选 Rehype</h4>
																<p className="text-xs text-[#87867F]">HTML 处理和转换插件</p>
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
										<div className="text-center py-8">
											<Plug className="h-10 w-10 text-[#87867F] mx-auto mb-3"/>
											<h4 className="font-medium text-[#181818] mb-1">暂无插件</h4>
											<p className="text-sm text-[#87867F]">当前没有可用的 Markdown 处理插件</p>
										</div>
									)}
								</div>
							</div>
						)}

						{/* 个人信息 */}
						{activeSection === 'personal' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">个人信息</h3>
								<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
									<PersonalInfoSettings
										onClose={() => handleSectionChange('article')}
										onPersonalInfoChange={onPersonalInfoChange}
										onSaveSettings={onSaveSettings}
									/>
								</div>
							</div>
						)}

						{/* AI 设置 */}
						{activeSection === 'ai' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">AI 设置</h3>
								<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
									<AISettings
										onClose={() => handleSectionChange('article')}
										onSettingsChange={onSettingsChange}
										onSaveSettings={onSaveSettings}
									/>
								</div>
							</div>
						)}

						{/* 通用设置 */}
						{activeSection === 'general' && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-[#181818]">通用</h3>

								{/* 设置卡片组 */}
								<div className="bg-white rounded-xl border border-[#E8E6DC] overflow-hidden">
									<div className="divide-y divide-[#E8E6DC]">
										{/* 工具栏位置 */}
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex items-center gap-3">
												<div className="w-7 h-7 bg-gradient-to-br from-[#CC785C] to-[#B86A4E] rounded-md flex items-center justify-center">
													<PanelLeft className="h-4 w-4 text-white"/>
												</div>
												<span className="text-[#181818] text-sm">工具栏位置</span>
											</div>
											<div className="flex bg-[#E8E6DC] rounded-lg p-0.5">
												<button
													onClick={() => { updateSettings({toolbarPosition: 'left'}); saveSettings(); }}
													className={`px-3 py-1 text-xs rounded-md transition-all ${
														atomSettings.toolbarPosition === 'left' ? 'bg-white text-[#181818] shadow-sm' : 'text-[#87867F]'
													}`}
												>左</button>
												<button
													onClick={() => { updateSettings({toolbarPosition: 'right'}); saveSettings(); }}
													className={`px-3 py-1 text-xs rounded-md transition-all ${
														(atomSettings.toolbarPosition ?? 'right') === 'right' ? 'bg-white text-[#181818] shadow-sm' : 'text-[#87867F]'
													}`}
												>右</button>
											</div>
										</div>

										{/* 代码块缩放 */}
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex items-center gap-3">
												<div className="w-7 h-7 bg-gradient-to-br from-[#629A90] to-[#4A7A70] rounded-md flex items-center justify-center">
													<Image className="h-4 w-4 text-white"/>
												</div>
												<div>
													<span className="text-[#181818] text-sm block">代码块自动缩放</span>
													<span className="text-[#87867F] text-xs">复制图片时自动适配</span>
												</div>
											</div>
											<Switch
												checked={atomSettings.scaleCodeBlockInImage ?? true}
												onCheckedChange={(checked) => {
													updateSettings({scaleCodeBlockInImage: checked});
													saveSettings();
												}}
											/>
										</div>
									</div>
								</div>

								{/* 即将推出 */}
								<div>
									<p className="text-xs text-[#87867F] uppercase tracking-wide px-1 mb-2">即将推出</p>
									<div className="bg-white/60 rounded-xl border border-[#E8E6DC] overflow-hidden">
										<div className="divide-y divide-[#E8E6DC]">
											{[
												{label: '主题', desc: '明亮 / 暗色', color: 'from-[#B49FD8] to-[#8B7CB8]'},
												{label: '语言', desc: '简体中文', color: 'from-[#97B5D5] to-[#7095B5]'},
												{label: '快捷键', desc: '自定义', color: 'from-[#C2C07D] to-[#A2A05D]'},
												{label: '数据', desc: '导入 / 导出', color: 'from-[#CC785C] to-[#AC583C]'}
											].map((item, i) => (
												<div key={i} className="flex items-center justify-between px-4 py-3 opacity-50">
													<div className="flex items-center gap-3">
														<div className={`w-7 h-7 bg-gradient-to-br ${item.color} rounded-md`}/>
														<span className="text-[#181818] text-sm">{item.label}</span>
													</div>
													<span className="text-[#87867F] text-xs">{item.desc}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
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
