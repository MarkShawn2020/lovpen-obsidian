import React from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../ui/select";
import {ToggleSwitch} from "../ui/ToggleSwitch";
import {ViteReactSettings} from "../../types";
import {useResources} from "../../hooks/useResources";
import {Code, Eye, Layout, Loader, Palette} from "lucide-react";

interface StyleSettingsProps {
	settings: ViteReactSettings;
	onTemplateChange: (template: string) => void;
	onThemeChange: (theme: string) => void;
	onHighlightChange: (highlight: string) => void;
	onThemeColorToggle: (enabled: boolean) => void;
	onThemeColorChange: (color: string) => void;
}

export const StyleSettings: React.FC<StyleSettingsProps> = ({
																settings,
																onTemplateChange,
																onThemeChange,
																onHighlightChange,
																onThemeColorToggle,
																onThemeColorChange,
															}) => {
	// 动态加载资源
	const {themes, highlights, templates, loading, error} = useResources();

	// 转换为选择器选项格式
	const templateOptions = templates.map(template => ({
		value: template.filename,
		text: template.name
	}));

	const themeOptions = themes.map(theme => ({
		value: theme.className,
		text: theme.name
	}));

	const highlightOptions = highlights.map(highlight => ({
		value: highlight.name,
		text: highlight.name
	}));

	// 加载状态或错误处理
	if (loading) {
		return (
			<div className="w-full p-8 text-center">
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
					<Loader className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-3"/>
					<h3 className="text-lg font-medium text-gray-900 mb-2">加载样式资源</h3>
					<p className="text-sm text-gray-600">正在加载模板、主题和高亮样式...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-8 text-center">
				<div className="bg-red-50 border border-red-200 rounded-xl p-6">
					<div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
						<span className="text-red-600 text-lg">⚠️</span>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
					<p className="text-sm text-red-600">资源加载失败: {error}</p>
				</div>
			</div>
		);
	}

	const handleTemplateChange = (value: string) => {
		// 将 "none" 转换为空字符串，保持向后兼容
		onTemplateChange(value === "none" ? "" : value);
	};

	const handleColorInput = (e: React.FormEvent<HTMLInputElement>) => {
		const newColor = e.currentTarget.value;
		onThemeColorChange(newColor);
	};

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		onThemeColorChange(newColor);
	};

	return (
		<div className="space-y-6">
			{/* 头部说明 */}
			<div className="text-center">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">样式配置</h3>
				<p className="text-gray-600">自定义您的内容展示样式和主题</p>
			</div>

			{/* 样式选择卡片 */}
			<div className="grid grid-cols-1 gap-4">
				{/* 模板选择器 */}
				<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Layout className="h-5 w-5 text-blue-600"/>
						</div>
						<div>
							<h4 className="font-semibold text-gray-900">页面模板</h4>
							<p className="text-sm text-gray-600">选择内容布局模板</p>
						</div>
					</div>
					<Select value={settings.useTemplate ? settings.defaultTemplate : "none"}
							onValueChange={handleTemplateChange}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="选择模板"/>
						</SelectTrigger>
						<SelectContent>
							{templateOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.text}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* 主题选择器 */}
				<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<div className="p-2 bg-purple-100 rounded-lg">
							<Palette className="h-5 w-5 text-purple-600"/>
						</div>
						<div>
							<h4 className="font-semibold text-gray-900">视觉主题</h4>
							<p className="text-sm text-gray-600">选择界面风格主题</p>
						</div>
					</div>
					<Select value={settings.defaultStyle} onValueChange={onThemeChange}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="选择主题"/>
						</SelectTrigger>
						<SelectContent>
							{themeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.text}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* 代码高亮选择器 */}
			<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
				<div className="flex items-center gap-3 mb-3">
					<div className="p-2 bg-green-100 rounded-lg">
						<Code className="h-5 w-5 text-green-600"/>
					</div>
					<div>
						<h4 className="font-semibold text-gray-900">代码高亮</h4>
						<p className="text-sm text-gray-600">选择代码语法高亮样式</p>
					</div>
				</div>
				<Select value={settings.defaultHighlight} onValueChange={onHighlightChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="选择高亮主题"/>
					</SelectTrigger>
					<SelectContent>
						{highlightOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.text}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* 主题色选择器 */}
			<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 bg-orange-100 rounded-lg">
						<Eye className="h-5 w-5 text-orange-600"/>
					</div>
					<div>
						<h4 className="font-semibold text-gray-900">自定义主题色</h4>
						<p className="text-sm text-gray-600">启用个性化颜色配置</p>
					</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-gray-700">启用主题色</span>
						<div className="flex items-center gap-2">
							<ToggleSwitch
								size={'small'}
								checked={settings.enableThemeColor}
								onChange={onThemeColorToggle}
							/>
							<span className="text-sm text-gray-500">
								{settings.enableThemeColor ? "已启用" : "已禁用"}
							</span>
						</div>
					</div>

					{settings.enableThemeColor && (
						<div
							className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-3">
									<input
										className="w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-pointer"
										type="color"
										value={settings.themeColor || "#7852ee"}
										onInput={handleColorInput}
										onChange={handleColorChange}
									/>
									<div
										className="w-12 h-12 rounded-lg border-2 border-white shadow-md"
										style={{
											backgroundColor: settings.themeColor || "#7852ee",
										}}
									/>
								</div>
								<div className="flex-1">
									<div className="text-sm font-medium text-gray-700 mb-1">当前主题色</div>
									<div className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border">
										{settings.themeColor || "#7852ee"}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
