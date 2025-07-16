import React, {useEffect, useState} from 'react';
import {Button} from '../ui/button';
import {Drawer, DrawerDescription, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle,} from '../ui/drawer';
import {TemplateKit, ViteReactSettings} from '../../types';
import {logger} from '../../../../shared/src/logger';
import {StyleSettings} from './StyleSettings';
import {AlertCircle, Edit3, Eye, Loader, Package, Palette, Plus, RefreshCw, Settings} from 'lucide-react';
import {Badge} from '../ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';
import {ToggleSwitch} from '../ui/ToggleSwitch';
import {useResources} from '../../hooks/useResources';


interface TemplateKitSelectorProps {
	settings: ViteReactSettings;
	onKitApply?: (kitId: string) => void;
	onKitCreate?: (basicInfo: any) => void;
	onKitDelete?: (kitId: string) => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
	// 样式设置相关的回调
	onTemplateChange?: (template: string) => void;
	onThemeChange?: (theme: string) => void;
	onHighlightChange?: (highlight: string) => void;
	onThemeColorToggle?: (enabled: boolean) => void;
	onThemeColorChange?: (color: string) => void;
}

export const TemplateKitSelector: React.FC<TemplateKitSelectorProps> = ({
																			settings,
																			onKitApply,
																			onKitCreate,
																			onKitDelete,
																			onSettingsChange,
																			onTemplateChange,
																			onThemeChange,
																			onHighlightChange,
																			onThemeColorToggle,
																			onThemeColorChange,
																		}) => {
	const [kits, setKits] = useState<TemplateKit[]>([]);
	const [selectedKitId, setSelectedKitId] = useState<string>('');

	// 加载资源数据
	const {themes, highlights, templates, loading: resourcesLoading} = useResources();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [previewKit, setPreviewKit] = useState<TemplateKit | null>(null);
	const [showPreviewModal, setShowPreviewModal] = useState(false);

	// 套装配置编辑状态
	const [editingKit, setEditingKit] = useState<TemplateKit | null>(null);
	const [hasChanges, setHasChanges] = useState(false);

	// 加载可用套装
	useEffect(() => {
		loadKits();
	}, []);

	const loadKits = async () => {
		try {
			setLoading(true);
			setError('');

			// 直接调用全局的template kit加载函数
			if (window.lovpenReactAPI && window.lovpenReactAPI.loadTemplateKits) {
				const loadedKits = await window.lovpenReactAPI.loadTemplateKits();
				// Type assertion to handle compatibility between shared and frontend types
				setKits(loadedKits as TemplateKit[]);
				logger.info('[TemplateKitSelector] Loaded template kits:', loadedKits.length);
			} else {
				throw new Error('Template kit API not available');
			}
		} catch (error) {
			logger.error('[TemplateKitSelector] Error loading kits:', error);
			setError((error as Error).message || 'Failed to load template kits');
		} finally {
			setLoading(false);
		}
	};

	// 重置编辑状态
	useEffect(() => {
		if (!showPreviewModal) {
			setEditingKit(null);
			setHasChanges(false);
		}
	}, [showPreviewModal]);

	// 初始化编辑状态
	useEffect(() => {
		if (previewKit && showPreviewModal) {
			setEditingKit(JSON.parse(JSON.stringify(previewKit))); // 深拷贝
			setHasChanges(false);
		}
	}, [previewKit, showPreviewModal]);

	// 检测配置变更
	const checkForChanges = (newKit: TemplateKit) => {
		if (!previewKit) return false;

		const hasStyleChanges =
			newKit.styleConfig.theme !== previewKit.styleConfig.theme ||
			newKit.styleConfig.codeHighlight !== previewKit.styleConfig.codeHighlight ||
			newKit.styleConfig.enableCustomThemeColor !== previewKit.styleConfig.enableCustomThemeColor ||
			newKit.styleConfig.customThemeColor !== previewKit.styleConfig.customThemeColor;

		const hasTemplateChanges =
			newKit.templateConfig.templateFileName !== previewKit.templateConfig.templateFileName ||
			newKit.templateConfig.useTemplate !== previewKit.templateConfig.useTemplate;

		return hasStyleChanges || hasTemplateChanges;
	};

	// 更新编辑中的套装配置
	const updateEditingKit = (updates: Partial<TemplateKit>) => {
		if (!editingKit) return;

		const newKit = {...editingKit, ...updates};
		setEditingKit(newKit);
		setHasChanges(checkForChanges(newKit));
	};

	const handleKitSelect = async (kitId: string) => {
		setSelectedKitId(kitId);
		const kit = kits.find(k => k.basicInfo.id === kitId);
		if (kit) {
			// 直接应用套装
			try {
				logger.info('[TemplateKitSelector] Applying kit directly:', kit.basicInfo.name);

				// 调用后端套装应用逻辑
				if (window.lovpenReactAPI && window.lovpenReactAPI.onKitApply) {
					await window.lovpenReactAPI.onKitApply(kitId);
				}

				// 同步高级样式配置：将套装的配置反映到高级样式选择器中
				syncKitToAdvancedSettings(kit);

				logger.info('[TemplateKitSelector] Kit applied directly:', kit.basicInfo.name);
			} catch (error) {
				logger.error('[TemplateKitSelector] Error applying kit directly:', error);
			}
		}
	};

	// 同步套装配置到高级样式设置
	const syncKitToAdvancedSettings = (kit: TemplateKit) => {
		// 同步模板选择
		if (onTemplateChange && kit.templateConfig.templateFileName) {
			// 移除 .html 扩展名
			const templateName = kit.templateConfig.templateFileName.replace('.html', '');
			onTemplateChange(templateName);
		}

		// 同步主题选择
		if (onThemeChange && kit.styleConfig.theme) {
			onThemeChange(kit.styleConfig.theme);
		}

		// 同步代码高亮选择
		if (onHighlightChange && kit.styleConfig.codeHighlight) {
			onHighlightChange(kit.styleConfig.codeHighlight);
		}

		// 同步主题颜色设置
		if (onThemeColorToggle) {
			onThemeColorToggle(kit.styleConfig.enableCustomThemeColor || false);
		}

		if (onThemeColorChange && kit.styleConfig.customThemeColor) {
			onThemeColorChange(kit.styleConfig.customThemeColor);
		}

		logger.info('[TemplateKitSelector] Synced kit config to advanced settings', {
			template: kit.templateConfig.templateFileName,
			theme: kit.styleConfig.theme,
			highlight: kit.styleConfig.codeHighlight,
			customThemeColor: kit.styleConfig.customThemeColor
		});
	};


	const handleCreateKit = () => {
		setShowCreateDialog(true);
	};

	const getKitStatusBadge = (kit: TemplateKit) => {
		const isCurrentTheme = settings.defaultStyle === kit.styleConfig.theme;
		// 模板名称需要去掉.html扩展名来比较
		const templateName = kit.templateConfig.templateFileName.replace('.html', '');
		const isCurrentTemplate = settings.defaultTemplate === templateName;

		if (isCurrentTheme && isCurrentTemplate) {
			return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">当前使用</Badge>;
		} else if (isCurrentTheme || isCurrentTemplate) {
			return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">部分匹配</Badge>;
		}
		return null;
	};

	if (loading) {
		return (
			<div className="w-full p-6 text-center">
				<div className="bg-[#F7F4EC] border border-[#E8E6DC] rounded-2xl p-6">
					<Loader className="animate-spin w-8 h-8 text-[#D97757] mx-auto mb-4"/>
					<h3 className="text-lg font-semibold text-[#181818] mb-2">加载模板套装</h3>
					<p className="text-sm text-[#87867F]">正在加载可用的模板套装...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-6 text-center">
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6">
					<AlertCircle className="w-8 h-8 text-[#D97757] mx-auto mb-4"/>
					<h3 className="text-lg font-semibold text-[#181818] mb-2">加载失败</h3>
					<p className="text-sm text-[#D97757] mb-4">{error}</p>
					<Button onClick={loadKits} variant="outline" size="sm" className="text-sm border-[#E8E6DC] text-[#87867F] hover:bg-[#F0EEE6] hover:text-[#181818] rounded-xl font-medium">
						<RefreshCw className="w-4 h-4 mr-2"/>
						重试
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* 套装选择器头部 */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-[#F7F4EC] rounded-xl">
						<Package className="w-5 h-5 text-[#B49FD8]"/>
					</div>
					<div>
						<h3 className="text-lg font-semibold text-[#181818] tracking-tight">模板套装</h3>
					</div>
				</div>
				<div className="flex gap-3">
					<Button onClick={handleCreateKit} variant="outline" size="sm" className="border-[#E8E6DC] text-[#87867F] hover:bg-[#F0EEE6] hover:text-[#181818] rounded-xl font-medium px-4 py-2">
						<Plus className="w-4 h-4 mr-2"/>
						创建套装
					</Button>
					<Button onClick={loadKits} variant="outline" size="sm" className="border-[#E8E6DC] text-[#87867F] hover:bg-[#F0EEE6] hover:text-[#181818] rounded-xl font-medium px-4 py-2">
						<RefreshCw className="w-4 h-4 mr-2"/>
						刷新
					</Button>
				</div>
			</div>


			{/* 套装列表 */}
			<div className="space-y-4">
				<h4 className="text-sm font-medium text-[#181818]">可用套装</h4>
				<div className="grid grid-cols-1 gap-4">
					{kits.map((kit) => (
						<div
							key={kit.basicInfo.id}
							className={`p-4 border rounded-2xl cursor-pointer transition-all ${
								selectedKitId === kit.basicInfo.id
									? 'border-[#D97757] bg-[#F7F4EC]'
									: 'border-[#E8E6DC] bg-white hover:border-[#D97757] hover:bg-[#F7F4EC]'
							}`}
							onClick={() => handleKitSelect(kit.basicInfo.id)}
						>
							<div className="flex items-start gap-4">
								{/* 小预览缩略图 */}
								<div
									className="flex-shrink-0 w-16 h-12 bg-gradient-to-br from-[#F7F4EC] to-[#E8E6DC] rounded-xl border border-[#E8E6DC] overflow-hidden">
									<div className="w-full h-full p-1">
										<div className="w-full h-2 bg-white rounded-sm mb-1"></div>
										<div className="w-3/4 h-1 bg-[#87867F] rounded-sm mb-1"></div>
										<div className="w-full h-1 bg-[#E8E6DC] rounded-sm mb-1"></div>
										<div className="w-1/2 h-1 bg-[#E8E6DC] rounded-sm"></div>
									</div>
								</div>

								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<h5 className="text-sm font-medium text-[#181818]">{kit.basicInfo.name}</h5>
										{getKitStatusBadge(kit)}
									</div>
									<p className="text-xs text-[#87867F] mb-3">{kit.basicInfo.description}</p>
									<div className="flex items-center gap-2 text-xs text-[#87867F] mb-3">
										<span>主题: {kit.styleConfig.theme}</span>
										<span>•</span>
										<span>高亮: {kit.styleConfig.codeHighlight}</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{kit.basicInfo.tags.slice(0, 3).map((tag, index) => (
											<Badge key={index} variant="outline" className="text-xs border-[#E8E6DC] text-[#87867F]">
												{tag}
											</Badge>
										))}
										{kit.basicInfo.tags.length > 3 && (
											<span
												className="text-xs text-[#87867F]">+{kit.basicInfo.tags.length - 3}</span>
										)}
									</div>
								</div>
								<div className="flex gap-1 ml-2">
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 hover:bg-[#F0EEE6] rounded-lg"
										onClick={(e) => {
											e.stopPropagation();
											setPreviewKit(kit);
											setShowPreviewModal(true);
										}}
									>
										<Eye className="w-4 h-4 text-[#87867F]"/>
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 高级样式配置 */}
			<div className="border-t border-[#E8E6DC] pt-6">
				<div className="flex items-center gap-4 mb-6">
					<div className="p-3 bg-[#F7F4EC] rounded-xl">
						<Palette className="w-5 h-5 text-[#97B5D5]"/>
					</div>
					<div>
						<h3 className="text-lg font-semibold text-[#181818] tracking-tight">高级样式配置</h3>
						<p className="text-sm text-[#87867F]">微调当前套装的样式设置</p>
					</div>
				</div>

				<StyleSettings
					settings={settings}
					onTemplateChange={onTemplateChange || (() => {
					})}
					onThemeChange={onThemeChange || (() => {
					})}
					onHighlightChange={onHighlightChange || (() => {
					})}
					onThemeColorToggle={onThemeColorToggle || (() => {
					})}
					onThemeColorChange={onThemeColorChange || (() => {
					})}
				/>
			</div>

			{/* 预览 Drawer */}
			<Drawer open={showPreviewModal} onOpenChange={(open) => !open && setShowPreviewModal(false)}>
				{(() => {
					const toolbarContainer = document.getElementById('lovpen-toolbar-container');
					if (!toolbarContainer) return null;

					return (
						<DrawerPortal container={toolbarContainer}>
							<DrawerOverlay className="absolute inset-0 bg-black/50"/>
							<div
								className="absolute bottom-0 left-0 right-0 z-50 bg-white flex flex-col max-h-[85vh] rounded-t-lg border-t shadow-lg transition-transform"
								data-vaul-drawer-direction="bottom"
								data-slot="drawer-content"
							>
								{/* 拖拽手柄 */}
								<div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-gray-300"/>

								{previewKit && (
									<>
										<DrawerHeader className="pb-4">
											<DrawerTitle className="text-lg sm:text-xl">
												{previewKit.basicInfo.name}
											</DrawerTitle>
											<DrawerDescription className="text-sm text-gray-600">
												{previewKit.basicInfo.description}
											</DrawerDescription>
										</DrawerHeader>

										{/* 内容区域 */}
										<div className="flex-1 px-4 sm:px-6 overflow-y-auto min-h-0">
											<div className="space-y-4 sm:space-y-6">
												{/* 基本信息 */}
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
													<div className="flex items-center gap-2">
														<span className="text-gray-500 font-medium">作者:</span>
														<span
															className="text-gray-700">{previewKit.basicInfo.author}</span>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-gray-500 font-medium">版本:</span>
														<span
															className="text-gray-700">{previewKit.basicInfo.version}</span>
													</div>
												</div>

												{/* 标签 */}
												<div className="flex flex-wrap gap-2">
													{previewKit.basicInfo.tags.map((tag, index) => (
														<Badge key={index} variant="secondary" className="text-xs">
															{tag}
														</Badge>
													))}
													{getKitStatusBadge(previewKit)}
												</div>

												{/* 样式预览 */}
												<div
													className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
													<h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
														<Eye className="w-4 h-4 text-blue-600"/>
														样式预览
													</h4>
													<div
														className="border border-gray-200 rounded-md p-3 sm:p-4 bg-white text-sm">
														<div className="space-y-3">
															<h5 className="font-semibold text-gray-900">文章标题示例</h5>
															<p className="text-gray-700">这是一段示例文本，展示当前套装的样式效果。</p>
															<pre
																className="bg-gray-100 p-2 sm:p-3 rounded text-xs overflow-x-auto">
																<code>{`function example() {
  console.log("Hello World");
}`}</code>
															</pre>
															<blockquote
																className="border-l-4 border-blue-500 pl-3 text-gray-600 italic">
																这是一个引用块的示例
															</blockquote>
														</div>
													</div>
												</div>

												{/* 可编辑配置 */}
												{editingKit && !resourcesLoading && (
													<div className="grid grid-cols-1 gap-3 sm:gap-4">
														{/* 主题样式配置 */}
														<div
															className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
															<div className="flex items-center gap-2 mb-4">
																<Palette className="w-4 h-4 text-purple-600"/>
																<span
																	className="font-medium text-gray-800">主题样式</span>
																<Edit3 className="w-3 h-3 text-gray-400"/>
															</div>
															<div className="space-y-4">
																{/* 主题选择 */}
																<div>
																	<label
																		className="block text-sm font-medium text-gray-700 mb-2">主题</label>
																	<Select
																		value={editingKit.styleConfig.theme}
																		onValueChange={(value) => updateEditingKit({
																			styleConfig: {
																				...editingKit.styleConfig,
																				theme: value
																			}
																		})}
																	>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="选择主题"/>
																		</SelectTrigger>
																		<SelectContent>
																			{themes.map((theme) => (
																				<SelectItem key={theme.className}
																							value={theme.className}>
																					{theme.name}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>

																{/* 代码高亮选择 */}
																<div>
																	<label
																		className="block text-sm font-medium text-gray-700 mb-2">代码高亮</label>
																	<Select
																		value={editingKit.styleConfig.codeHighlight}
																		onValueChange={(value) => updateEditingKit({
																			styleConfig: {
																				...editingKit.styleConfig,
																				codeHighlight: value
																			}
																		})}
																	>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="选择高亮样式"/>
																		</SelectTrigger>
																		<SelectContent>
																			{highlights.map((highlight) => (
																				<SelectItem key={highlight.name}
																							value={highlight.name}>
																					{highlight.name}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>

																{/* 主题色设置 */}
																<div>
																	<div
																		className="flex items-center justify-between mb-2">
																		<label
																			className="text-sm font-medium text-gray-700">自定义主题色</label>
																		<ToggleSwitch
																			size="small"
																			checked={editingKit.styleConfig.enableCustomThemeColor}
																			onChange={(enabled) => updateEditingKit({
																				styleConfig: {
																					...editingKit.styleConfig,
																					enableCustomThemeColor: enabled
																				}
																			})}
																		/>
																	</div>
																	{editingKit.styleConfig.enableCustomThemeColor && (
																		<div className="flex items-center gap-3">
																			<input
																				type="color"
																				value={editingKit.styleConfig.customThemeColor || "#7852ee"}
																				onChange={(e) => updateEditingKit({
																					styleConfig: {
																						...editingKit.styleConfig,
																						customThemeColor: e.target.value
																					}
																				})}
																				className="w-12 h-8 rounded border border-gray-300"
																			/>
																			<input
																				type="text"
																				value={editingKit.styleConfig.customThemeColor || "#7852ee"}
																				onChange={(e) => updateEditingKit({
																					styleConfig: {
																						...editingKit.styleConfig,
																						customThemeColor: e.target.value
																					}
																				})}
																				className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded font-mono"
																				placeholder="#7852ee"
																			/>
																		</div>
																	)}
																</div>
															</div>
														</div>

														{/* 模板配置 */}
														<div
															className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
															<div className="flex items-center gap-2 mb-4">
																<Package className="w-4 h-4 text-blue-600"/>
																<span
																	className="font-medium text-gray-800">模板配置</span>
																<Edit3 className="w-3 h-3 text-gray-400"/>
															</div>
															<div className="space-y-4">
																{/* 模板选择 */}
																<div>
																	<label
																		className="block text-sm font-medium text-gray-700 mb-2">模板文件</label>
																	<Select
																		value={editingKit.templateConfig.templateFileName}
																		onValueChange={(value) => updateEditingKit({
																			templateConfig: {
																				...editingKit.templateConfig,
																				templateFileName: value
																			}
																		})}
																	>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="选择模板"/>
																		</SelectTrigger>
																		<SelectContent>
																			{templates.map((template) => (
																				<SelectItem key={template.filename}
																							value={template.filename}>
																					{template.name}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>

																{/* 启用模板 */}
																<div className="flex items-center justify-between">
																	<label
																		className="text-sm font-medium text-gray-700">启用模板</label>
																	<ToggleSwitch
																		size="small"
																		checked={editingKit.templateConfig.useTemplate}
																		onChange={(enabled) => updateEditingKit({
																			templateConfig: {
																				...editingKit.templateConfig,
																				useTemplate: enabled
																			}
																		})}
																	/>
																</div>
															</div>
														</div>

														{/* 插件配置（只读显示）*/}
														<div
															className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
															<div className="flex items-center gap-2 mb-3">
																<Settings className="w-4 h-4 text-green-600"/>
																<span
																	className="font-medium text-gray-800">插件配置</span>
																<span className="text-xs text-gray-500">(只读)</span>
															</div>
															<div className="space-y-2 text-sm">
																<div className="flex items-center gap-2">
																	<span className="text-gray-500">Markdown插件:</span>
																	<span
																		className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
																		{editingKit.pluginConfig.enabledMarkdownPlugins.length}个
																	</span>
																</div>
																<div className="flex items-center gap-2">
																	<span className="text-gray-500">HTML插件:</span>
																	<span
																		className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
																		{editingKit.pluginConfig.enabledHtmlPlugins.length}个
																	</span>
																</div>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>

										{/* 底部操作栏 */}
										<div className="px-4 sm:px-6 py-4 border-t bg-gray-50 mt-auto shrink-0">
											{hasChanges && (
												<div
													className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
													<div className="flex items-center gap-2 text-sm text-yellow-800">
														<div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
														<span>检测到配置变更，你可以保存为新套装或直接应用当前修改</span>
													</div>
												</div>
											)}
											<div
												className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
												<div className="text-sm text-gray-600">
													{hasChanges
														? "配置已修改，选择操作"
														: "点击\"应用套装\"将使用此套装的所有配置"
													}
												</div>
												<div className="flex gap-2">
													<Button variant="outline" onClick={() => setShowPreviewModal(false)}
															size="sm">
														关闭
													</Button>
													{hasChanges && (
														<Button
															variant="outline"
															onClick={() => {
																// TODO: 实现保存为新套装
																console.log('保存为新套装:', editingKit);
															}}
															size="sm"
															className="border-green-300 text-green-700 hover:bg-green-50"
														>
															另存为新套装
														</Button>
													)}
													<Button
														onClick={() => {
															if (hasChanges && editingKit) {
																// 使用修改后的配置应用
																console.log('应用修改后的配置:', editingKit);
																// TODO: 应用修改后的套装配置
															} else {
																// 应用原始套装
																handleKitSelect(previewKit.basicInfo.id);
															}
															setShowPreviewModal(false);
														}}
														className="bg-purple-600 hover:bg-purple-700"
														size="sm"
													>
														{hasChanges ? "应用修改" : "应用套装"}
													</Button>
												</div>
											</div>
										</div>
									</>
								)}
							</div>
						</DrawerPortal>
					);
				})()}
			</Drawer>
		</div>
	);
};
