import React, {useEffect, useRef, useState} from "react";
import {ToggleSwitch} from "../ui/ToggleSwitch";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../ui/select";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/tooltip";
import {PluginData} from "../../types";
import {persistentStorageService} from "../../services/persistentStorage";

import {logger} from "../../../../shared/src/logger";
import {ChevronDown, Info, Plug, Settings} from "lucide-react";

const STORAGE_KEY_PREFIX = 'lovpen-config';

const getStorageKey = (type: string, itemName: string) => {
	return `${STORAGE_KEY_PREFIX}-${type}-${itemName}`;
};

const saveToStorage = (key: string, value: any) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.warn('Failed to save to localStorage:', error);
	}
};


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
	const storageKey = getStorageKey(type, item.name);

	// 以 item.config 为准，localStorage 只作为备份
	const getInitialConfig = () => {
		// 优先使用 item.config，确保前后端一致
		return item.config || {};
	};

	// 本地配置状态管理
	const [localConfig, setLocalConfig] = useState(getInitialConfig);
	const hasLocalUpdate = useRef(false);

	// 初始化时从持久化存储加载配置
	useEffect(() => {
		const loadPersistedConfig = async () => {
			try {
				const persistedConfig = await persistentStorageService.getPluginConfig(item.name);
				if (persistedConfig) {
					// 合并持久化配置到本地状态
					const mergedConfig = {...getInitialConfig(), ...persistedConfig.config};
					setLocalConfig(mergedConfig);
					// 同时更新item.config
					Object.assign(item.config, mergedConfig);
					logger.debug(`[PluginConfigComponent] Loaded persisted config for ${item.name}`);
				}
			} catch (error) {
				logger.error(`[PluginConfigComponent] Failed to load persisted config for ${item.name}:`, error);
			}
		};

		loadPersistedConfig();
	}, [item.name]);

	// 当外部配置或插件启用状态变化时同步本地状态
	useEffect(() => {
		if (!hasLocalUpdate.current) {
			// 以 item.config 为准，确保前后端一致
			setLocalConfig({...item.config});
		} else {
			// 重置标记，允许下次外部更新
			hasLocalUpdate.current = false;
		}
	}, [item.config, item.enabled]);

	const configEntries = Object.entries(item.metaConfig || {});
	const hasConfigOptions = configEntries.length > 0;

	const handleEnabledChange = async (enabled: boolean) => {
		// 立即调用外部回调函数，确保后端状态先更新
		onEnabledChange(item.name, enabled);
		
		// 持久化enabled状态到本地存储
		const enabledStorageKey = `${storageKey}-enabled`;
		saveToStorage(enabledStorageKey, enabled);

		// 持久化到统一的插件配置存储
		try {
			await persistentStorageService.savePluginConfig(
				item.name,
				{...localConfig, enabled},
				item.metaConfig
			);
			logger.debug(`[PluginConfigComponent] Saved plugin enabled state: ${item.name} = ${enabled}`);
		} catch (error) {
			logger.error(`[PluginConfigComponent] Failed to save plugin enabled state:`, error);
		}
	};


	const handleConfigChange = async (key: string, value: string | boolean) => {
		// 标记为本地更新，防止外部同步覆盖
		hasLocalUpdate.current = true;

		// 1. 首先更新原始配置对象（确保后端能读取到最新配置）
		item.config[key] = value;

		// 2. 更新本地状态
		const newConfig = {...localConfig, [key]: value};
		setLocalConfig(newConfig);

		// 3. 持久化到localStorage作为备份
		saveToStorage(storageKey, newConfig);

		// 4. 持久化到统一的插件配置存储
		try {
			await persistentStorageService.savePluginConfig(
				item.name,
				newConfig,
				item.metaConfig
			);
			logger.debug(`[PluginConfigComponent] Saved plugin config: ${item.name}.${key} = ${value}`);
		} catch (error) {
			logger.error(`[PluginConfigComponent] Failed to save plugin config:`, error);
		}

		// 调试日志
		logger.debug(`[PluginConfigComponent] 配置更新: ${item.name}.${key} = ${value}`);
		logger.debug(`[PluginConfigComponent] 更新后的item.config:`, {...item.config});
		logger.debug(`[PluginConfigComponent] 更新后的localConfig:`, {...newConfig});

		// 5. 调用外部回调更新原始数据
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
											checked={!!localConfig[key]}
											onChange={(value) => handleConfigChange(key, value)}
											size="small"
										/>
									) : meta.type === "select" ? (
										<Select
											value={String(localConfig[key] || "")}
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
											value={String(localConfig[key] || "")}
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

