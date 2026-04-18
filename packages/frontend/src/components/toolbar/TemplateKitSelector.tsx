import React, {useEffect, useState} from 'react';
import {Button} from '../ui/button';
import type {Template} from '@lovpen/shared';
import type {ViteReactSettings} from '../../types';
import {
	AlertCircle,
	Check,
	Download,
	Loader,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
} from 'lucide-react';
import {Badge} from '../ui/badge';

interface TemplateKitSelectorProps {
	settings: ViteReactSettings;
	onKitApply?: (kitId: string) => void;
	onKitCreate?: (basicInfo: any) => void;
	onKitDelete?: (kitId: string) => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
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
	onTemplateChange,
	onThemeChange,
	onHighlightChange,
	onThemeColorToggle,
	onThemeColorChange,
}) => {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [activeTemplateId, setActiveTemplateId] = useState<string>('');
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newName, setNewName] = useState('');

	useEffect(() => {
		loadTemplates();
	}, []);

	const loadTemplates = async () => {
		try {
			setLoading(true);
			setError('');
			if (window.lovpenReactAPI?.loadTemplateKits) {
				const loaded = await window.lovpenReactAPI.loadTemplateKits() as Template[];
				setTemplates(loaded);
				// 初始化时匹配当前设置对应的模板
				const match = loaded.find(t =>
					t.theme === settings.defaultStyle &&
					t.codeHighlight === settings.defaultHighlight
				);
				if (match) setActiveTemplateId(match.id);
			} else {
				throw new Error('Template API not available');
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	};

	const handleApply = async (id: string) => {
		setActiveTemplateId(id);
		const template = templates.find(t => t.id === id);
		if (!template) return;

		// 调用后端应用
		if (window.lovpenReactAPI?.onKitApply) {
			await window.lovpenReactAPI.onKitApply(id);
		}

		// 同步前端选择器状态
		if (onThemeChange && template.theme) onThemeChange(template.theme);
		if (onHighlightChange && template.codeHighlight) onHighlightChange(template.codeHighlight);
		if (onThemeColorToggle) onThemeColorToggle(!!template.customThemeColor);
		if (onThemeColorChange && template.customThemeColor) onThemeColorChange(template.customThemeColor);
		if (onTemplateChange) {
			const layoutName = template.htmlLayout?.replace('.html', '') || '';
			onTemplateChange(layoutName);
		}
	};

	const handleDelete = async (id: string) => {
		if (window.lovpenReactAPI?.onKitDelete) {
			await window.lovpenReactAPI.onKitDelete(id);
			await loadTemplates();
		}
	};

	const handleCreate = async () => {
		if (!newName.trim()) return;
		const id = newName.trim().toLowerCase().replace(/\s+/g, '-');
		if (window.lovpenReactAPI?.onKitCreate) {
			await window.lovpenReactAPI.onKitCreate({
				id,
				name: newName.trim(),
				description: '自定义模板',
				author: 'User',
				version: '1.0.0',
				tags: ['自定义'],
			});
			setNewName('');
			setShowCreateForm(false);
			await loadTemplates();
		}
	};

	const handleExport = async (id: string) => {
		const template = templates.find(t => t.id === id);
		if (!template) return;
		const json = JSON.stringify(template, null, 2);
		const blob = new Blob([json], {type: 'application/json'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `lovpen-template-${template.id}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImport = async () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				const template = JSON.parse(text) as Template;
				if (!template.id || !template.name) {
					alert('无效的模板文件');
					return;
				}
				if (window.lovpenReactAPI?.onKitImport) {
					await window.lovpenReactAPI.onKitImport(template);
				} else {
					// 兼容：没有 onKitImport 时用 onKitCreate
					if (window.lovpenReactAPI?.onKitCreate) {
						await window.lovpenReactAPI.onKitCreate(template);
					}
				}
				await loadTemplates();
			} catch {
				alert('导入失败：文件格式错误');
			}
		};
		input.click();
	};

	if (loading) {
		return (
			<div className="w-full p-6 text-center">
				<Loader className="animate-spin w-6 h-6 text-[#D97757] mx-auto mb-3"/>
				<p className="text-sm text-[#87867F]">加载模板中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-6 text-center">
				<AlertCircle className="w-6 h-6 text-[#D97757] mx-auto mb-3"/>
				<p className="text-sm text-[#D97757] mb-3">{error}</p>
				<Button onClick={loadTemplates} variant="outline" size="sm">
					<RefreshCw className="w-3 h-3 mr-1"/> 重试
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* 模板列表 */}
			<div className="space-y-2">
				{templates.map((t) => {
					const isActive = activeTemplateId === t.id;
					return (
						<div
							key={t.id}
							className={`group p-3 border rounded-xl cursor-pointer transition-all ${
								isActive
									? 'border-[#D97757] bg-[#F7F4EC]'
									: 'border-[#E8E6DC] bg-white hover:border-[#D97757]/50'
							}`}
							onClick={() => handleApply(t.id)}
						>
							<div className="flex items-center justify-between mb-1">
								<div className="flex items-center gap-2 min-w-0">
									<span className="text-sm font-semibold text-[#181818] truncate">{t.name}</span>
									{isActive && (
										<Badge variant="default" className="bg-green-100 text-green-800 border-green-300 text-[10px] px-1.5 py-0">
											<Check className="w-3 h-3 mr-0.5"/> 当前
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={(e) => { e.stopPropagation(); handleExport(t.id); }}
										className="p-1 rounded hover:bg-[#F0EEE6]"
										title="导出模板"
									>
										<Download className="w-3 h-3 text-[#87867F]"/>
									</button>
									{!t.builtIn && (
										<button
											onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
											className="p-1 rounded hover:bg-red-50"
											title="删除模板"
										>
											<Trash2 className="w-3 h-3 text-red-400"/>
										</button>
									)}
								</div>
							</div>
							<p className="text-xs text-[#87867F] line-clamp-1">{t.description}</p>
							<div className="flex items-center gap-1.5 mt-1.5">
								{t.theme && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F7F4EC] text-[#87867F]">{t.theme}</span>}
								{t.codeHighlight && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F7F4EC] text-[#87867F]">{t.codeHighlight}</span>}
								{t.customThemeColor && (
									<span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-[#F7F4EC] text-[#87867F]">
										<span className="w-2.5 h-2.5 rounded-full border" style={{backgroundColor: t.customThemeColor}}/>
										{t.customThemeColor}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* 操作按钮 */}
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowCreateForm(!showCreateForm)}
					className="border-[#E8E6DC] text-[#87867F] hover:bg-[#F0EEE6] rounded-xl text-xs"
				>
					<Plus className="w-3 h-3 mr-1"/> 保存当前为模板
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleImport}
					className="border-[#E8E6DC] text-[#87867F] hover:bg-[#F0EEE6] rounded-xl text-xs"
				>
					<Upload className="w-3 h-3 mr-1"/> 导入
				</Button>
			</div>

			{/* 创建表单 */}
			{showCreateForm && (
				<div className="flex items-center gap-2 p-3 bg-[#F7F4EC] border border-[#E8E6DC] rounded-xl">
					<input
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="模板名称"
						className="flex-1 px-3 py-1.5 text-sm border border-[#E8E6DC] rounded-lg bg-white"
						onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
					/>
					<Button size="sm" onClick={handleCreate} className="bg-[#D97757] hover:bg-[#c86642] text-white rounded-lg text-xs">
						保存
					</Button>
				</div>
			)}
		</div>
	);
};
