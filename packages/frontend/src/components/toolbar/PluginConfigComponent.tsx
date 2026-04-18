import React, {useEffect, useState} from "react";
import {ToggleSwitch} from "../ui/ToggleSwitch";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../ui/select";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/tooltip";
import {PluginData} from "../../types";
import {persistentStorageService} from "../../services/persistentStorage";

import {logger} from "../../../../shared/src/logger";
import {ChevronDown, Info, Plug, Settings} from "lucide-react";

interface ConfigComponentProps<T extends PluginData> {
	item: T;
	type: 'plugin' | 'extension';
	expandedSections: string[];
	onToggle: (sectionId: string, isExpanded: boolean) => void;
	onEnabledChange: (itemName: string, enabled: boolean) => void;
	onConfigChange?: (itemName: string, key: string, value: string | boolean) => void;
}


export const ConfigComponent = <T extends PluginData>({
														  item,
														  type,
														  expandedSections,
														  onToggle,
														  onEnabledChange,
														  onConfigChange,
													  }: ConfigComponentProps<T>) => {
	const itemId = `${type}-${item.name.replace(/\s+/g, "-").toLowerCase()}`;
	const isExpanded = expandedSections.includes(itemId);
	// item.config 是唯一的真相来源，用 render counter 驱动 UI 更新
	const [, forceRender] = useState(0);

	// 初始化时从持久化存储加载配置，合并到 item.config
	useEffect(() => {
		const loadPersistedConfig = async () => {
			try {
				const persistedConfig = await persistentStorageService.getPluginConfig(item.name);
				if (persistedConfig) {
					Object.assign(item.config, persistedConfig.config);
					forceRender(n => n + 1);
					logger.debug(`[PluginConfigComponent] Loaded persisted config for ${item.name}`);
				}
			} catch (error) {
				logger.error(`[PluginConfigComponent] Failed to load persisted config for ${item.name}:`, error);
			}
		};

		loadPersistedConfig();
	}, [item.name]);

	const configEntries = Object.entries(item.metaConfig || {});
	const hasConfigOptions = configEntries.length > 0;

	const handleEnabledChange = async (enabled: boolean) => {
		onEnabledChange(item.name, enabled);

		try {
			await persistentStorageService.savePluginConfig(
				item.name,
				{...item.config, enabled},
				item.metaConfig
			);
		} catch (error) {
			logger.error(`[PluginConfigComponent] Failed to save plugin enabled state:`, error);
		}
	};


	const handleConfigChange = async (key: string, value: string | boolean) => {
		// 直接更新 item.config 并触发重渲染
		item.config[key] = value;
		forceRender(n => n + 1);

		// 持久化
		try {
			await persistentStorageService.savePluginConfig(
				item.name,
				{...item.config},
				item.metaConfig
			);
		} catch (error) {
			logger.error(`[PluginConfigComponent] Failed to save plugin config:`, error);
		}

		// 通知后端更新
		if (onConfigChange) {
			onConfigChange(item.name, key, value);
		}
	};

	const handleToggle = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.nativeEvent?.stopImmediatePropagation?.();
		if (hasConfigOptions) {
			onToggle(itemId, !isExpanded);
		}
	};

	return (
		<div
			id={itemId}
			className="bg-card border border-border rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3 transition-all duration-200 hover:shadow-sm"
		>
			<div
				className={`p-2.5 sm:p-3.5 cursor-pointer transition-colors ${hasConfigOptions ? 'hover:bg-muted/50' : ''}`}
				onClick={handleToggle}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
						<div onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}} className="shrink-0">
							<ToggleSwitch
								checked={item.enabled}
								onChange={handleEnabledChange}
								size="small"
							/>
						</div>

						<div className="flex items-center gap-2 flex-1 min-w-0">
							<div className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${item.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
								<Plug
									className={`h-3 w-3 sm:h-4 sm:w-4 ${item.enabled ? 'text-primary' : 'text-muted-foreground'}`}/>
							</div>
							<div className="flex-1 min-w-0">
								<div
									className="text-sm sm:text-base font-medium text-foreground truncate">{item.name}</div>
								{item.description && (
									<div className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
										 title={item.description}>
										{item.description}
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1 sm:gap-2 shrink-0">
						{hasConfigOptions && (
							<div
								className={`p-1 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
								<ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground"/>
							</div>
						)}
					</div>
				</div>
			</div>

			{hasConfigOptions && isExpanded && (
				<div className="border-t border-border bg-muted/30 p-2.5 sm:p-3.5">
					<div className="flex items-center gap-2 mb-2.5 sm:mb-3">
						<Settings className="h-3 w-3 sm:h-4 sm:w-4 text-primary"/>
						<span className="text-xs sm:text-sm font-medium text-foreground">插件配置</span>
					</div>

					<div className="space-y-2 sm:space-y-3">
						{configEntries.map(([key, meta]) => (
							<div key={key}
								 className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-2.5 bg-card border border-border rounded-lg">
								<div className="flex items-center gap-1.5">
									<span className="text-xs sm:text-sm font-medium text-foreground">{meta.title}</span>
									{meta.description && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground/70 hover:text-muted-foreground cursor-help shrink-0"/>
											</TooltipTrigger>
											<TooltipContent side="top" className="max-w-48">
												{meta.description}
											</TooltipContent>
										</Tooltip>
									)}
								</div>
								<div className="w-full sm:w-auto sm:shrink-0" onClick={(e) => e.stopPropagation()}>
									{meta.type === "switch" ? (
										<ToggleSwitch
											checked={!!item.config[key]}
											onChange={(value) => handleConfigChange(key, value)}
											size="small"
										/>
									) : meta.type === "select" ? (
										<Select
											value={String(item.config[key] || "")}
											onValueChange={(value) => handleConfigChange(key, value)}
										>
											<SelectTrigger className="w-full sm:w-40">
												<SelectValue/>
											</SelectTrigger>
											<SelectContent>
												{(meta.options || []).map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.text}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : meta.type === "text" ? (
										<input
											type="text"
											value={String(item.config[key] || "")}
											onChange={(e) => handleConfigChange(key, e.target.value)}
											className="px-2 sm:px-3 py-2 border border-input rounded-lg text-xs sm:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-full sm:w-40"
											placeholder={meta.title || "输入值..."}
										/>
									) : null}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

