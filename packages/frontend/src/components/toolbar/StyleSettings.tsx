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
				<div className="bg-[#F7F4EC] border border-[#E8E6DC] rounded-2xl p-6">
					<Loader className="animate-spin w-8 h-8 text-[#D97757] mx-auto mb-4"/>
					<h3 className="text-lg font-semibold text-[#181818] mb-2">加载样式资源</h3>
					<p className="text-sm text-[#87867F]">正在加载模板、主题和高亮样式...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-8 text-center">
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6">
					<div className="w-8 h-8 bg-[#F7F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
						<span className="text-[#D97757] text-lg">⚠️</span>
					</div>
					<h3 className="text-lg font-semibold text-[#181818] mb-2">加载失败</h3>
					<p className="text-sm text-[#D97757]">资源加载失败: {error}</p>
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
			{/* 样式选择卡片 */}
			<div className="grid grid-cols-1 gap-6">
				{/* 模板选择器 */}
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
					<div className="flex items-center gap-4 mb-4">
						<div className="p-3 bg-[#F7F4EC] rounded-xl">
							<Layout className="h-5 w-5 text-[#D97757]"/>
						</div>
						<div>
							<h4 className="font-semibold text-[#181818]">页面模板</h4>
							<p className="text-sm text-[#87867F]">选择内容布局模板</p>
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
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
					<div className="flex items-center gap-4 mb-4">
						<div className="p-3 bg-[#F7F4EC] rounded-xl">
							<Palette className="h-5 w-5 text-[#B49FD8]"/>
						</div>
						<div>
							<h4 className="font-semibold text-[#181818]">视觉主题</h4>
							<p className="text-sm text-[#87867F]">选择界面风格主题</p>
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
			<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
				<div className="flex items-center gap-4 mb-4">
					<div className="p-3 bg-[#F7F4EC] rounded-xl">
						<Code className="h-5 w-5 text-[#629A90]"/>
					</div>
					<div>
						<h4 className="font-semibold text-[#181818]">代码高亮</h4>
						<p className="text-sm text-[#87867F]">选择代码语法高亮样式</p>
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
			<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
				<div className="flex items-center gap-4 mb-4">
					<div className="p-3 bg-[#F7F4EC] rounded-xl">
						<Eye className="h-5 w-5 text-[#C2C07D]"/>
					</div>
					<div>
						<h4 className="font-semibold text-[#181818]">自定义主题色</h4>
						<p className="text-sm text-[#87867F]">启用个性化颜色配置</p>
					</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-[#181818]">启用主题色</span>
						<div className="flex items-center gap-3">
							<ToggleSwitch
								size={'small'}
								checked={settings.enableThemeColor}
								onChange={onThemeColorToggle}
							/>
							<span className="text-sm text-[#87867F]">
								{settings.enableThemeColor ? "已启用" : "已禁用"}
							</span>
						</div>
					</div>

					{settings.enableThemeColor && (
						<div
							className="p-4 bg-[#F7F4EC] border border-[#E8E6DC] rounded-xl">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-3">
									<input
										className="w-12 h-12 rounded-xl border-2 border-white shadow-md cursor-pointer"
										type="color"
										value={settings.themeColor || "#D97757"}
										onInput={handleColorInput}
										onChange={handleColorChange}
									/>
									<div
										className="w-12 h-12 rounded-xl border-2 border-white shadow-md"
										style={{
											backgroundColor: settings.themeColor || "#D97757",
										}}
									/>
								</div>
								<div className="flex-1">
									<div className="text-sm font-medium text-[#181818] mb-1">当前主题色</div>
									<div className="text-xs font-mono text-[#87867F] bg-white px-3 py-2 rounded-xl border border-[#E8E6DC]">
										{settings.themeColor || "#D97757"}
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
