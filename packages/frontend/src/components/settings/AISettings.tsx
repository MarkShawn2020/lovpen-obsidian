import React, {useEffect, useState} from 'react';
import {Button} from '../ui/button';
import {FormInput} from '../ui/FormInput';
import { ModelCombobox } from '../ui/model-combobox';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '../ui/collapsible';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import {AIModel, ViteReactSettings} from '../../types';
import {logger} from '../../../../shared/src/logger';
import {
	Bot,
	CheckCircle,
	Code,
	ChevronDown,
	ExternalLink,
	Key,
	RefreshCw,
	RotateCcw,
	Save,
	XCircle,
	Zap,
	Brain,
} from 'lucide-react';
import {useSettings} from '../../hooks/useSettings';
import {
	CLAUDE_MODELS,
	OPENROUTER_MODELS,
	ZENMUX_MODELS,
	testAIConnection,
	fetchClaudeModels,
	fetchOpenRouterModels,
	fetchZenMuxModels,
	clearModelCache
} from '../../services/aiService';

interface AISettingsProps {
	onClose: () => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
	onSaveSettings?: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
	onClose,
	onSettingsChange,
	onSaveSettings
}) => {
	const {
		settings,
		saveStatus,
		updateSettings,
		saveSettings
	} = useSettings(onSaveSettings, undefined, onSettingsChange);
	
	const [aiProvider, setAiProvider] = useState<'claude' | 'openrouter' | 'zenmux'>(settings.aiProvider || 'claude');
	const [claudeApiKey, setClaudeApiKey] = useState<string>(settings.authKey || '');
	const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(settings.openRouterApiKey || '');
	const [zenmuxApiKey, setZenmuxApiKey] = useState<string>(settings.zenmuxApiKey || '');
	const [aiPromptTemplate, setAiPromptTemplate] = useState<string>(settings.aiPromptTemplate || '');
	const [selectedModel, setSelectedModel] = useState<string>(settings.aiModel || '');
	const [openRouterModel, setOpenRouterModel] = useState<string>(settings.openRouterModel || '');
	const [zenmuxModel, setZenmuxModel] = useState<string>(settings.zenmuxModel || '');
	const [isTestingConnection, setIsTestingConnection] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [promptExpanded, setPromptExpanded] = useState(false);

	// 动态模型列表
	const [claudeModels, setClaudeModels] = useState<AIModel[]>(CLAUDE_MODELS as AIModel[]);
	const [openRouterModels, setOpenRouterModels] = useState<AIModel[]>(OPENROUTER_MODELS as AIModel[]);
	const [zenmuxModels, setZenmuxModels] = useState<AIModel[]>(ZENMUX_MODELS as AIModel[]);
	const [isLoadingModels, setIsLoadingModels] = useState(false);

	useEffect(() => {
		setAiProvider(settings.aiProvider || 'claude');
		setClaudeApiKey(settings.authKey || '');
		setOpenRouterApiKey(settings.openRouterApiKey || '');
		setZenmuxApiKey(settings.zenmuxApiKey || '');
		setAiPromptTemplate(settings.aiPromptTemplate || '');
		setSelectedModel(settings.aiModel || '');
		setOpenRouterModel(settings.openRouterModel || '');
		setZenmuxModel(settings.zenmuxModel || '');
	}, [settings.aiProvider, settings.authKey, settings.openRouterApiKey, settings.zenmuxApiKey, settings.aiPromptTemplate, settings.aiModel, settings.openRouterModel, settings.zenmuxModel]);

	// 组件挂载时自动加载缓存的模型列表
	useEffect(() => {
		const provider = settings.aiProvider || 'claude';
		const apiKey = provider === 'claude' ? settings.authKey :
			provider === 'openrouter' ? settings.openRouterApiKey : settings.zenmuxApiKey;
		// 尝试加载（会优先使用 localStorage 缓存）
		if (apiKey?.trim() || provider === 'zenmux') {
			loadModels(provider, apiKey || '');
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // 只在挂载时执行一次

	// 动态获取模型列表
	const [modelLoadError, setModelLoadError] = useState<string>('');
	const loadModels = async (provider: 'claude' | 'openrouter' | 'zenmux', apiKey: string) => {
		if (!apiKey.trim() && provider !== 'zenmux') return;
		setIsLoadingModels(true);
		setModelLoadError('');
		try {
			if (provider === 'claude') {
				const models = await fetchClaudeModels(apiKey);
				setClaudeModels(models);
				// 如果未选择模型，默认选第一个
				if (!selectedModel && models.length > 0) {
					setSelectedModel(models[0].id);
					updateSettings({aiModel: models[0].id});
				}
			} else if (provider === 'openrouter') {
				const models = await fetchOpenRouterModels(apiKey);
				setOpenRouterModels(models);
				if (!openRouterModel && models.length > 0) {
					setOpenRouterModel(models[0].id);
					updateSettings({openRouterModel: models[0].id});
				}
			} else if (provider === 'zenmux') {
				const models = await fetchZenMuxModels(apiKey);
				setZenmuxModels(models);
				// ZenMux 默认选第一个模型
				if (!zenmuxModel && models.length > 0) {
					setZenmuxModel(models[0].id);
					updateSettings({zenmuxModel: models[0].id});
				}
			}
		} catch (e: any) {
			const msg = e?.message || '获取模型列表失败';
			setModelLoadError(msg.includes('502') || msg.includes('503') ? 'API 暂时不可用，请稍后重试' : msg);
			logger.warn('Failed to load models:', e);
		} finally {
			setIsLoadingModels(false);
		}
	};

	// 刷新当前provider的模型列表
	const refreshModels = () => {
		clearModelCache(aiProvider);
		const apiKey = aiProvider === 'claude' ? claudeApiKey :
			aiProvider === 'openrouter' ? openRouterApiKey : zenmuxApiKey;
		loadModels(aiProvider, apiKey);
	};

	const handleApiKeyChange = (value: string) => {
		setClaudeApiKey(value);
		setConnectionStatus('idle');
		setErrorMessage('');
		updateSettings({authKey: value.trim()});
		// 延迟加载模型列表（防止频繁请求）
		if (value.trim().length > 10) {
			loadModels('claude', value.trim());
		}
	};

	const handlePromptTemplateChange = (value: string) => {
		setAiPromptTemplate(value);
		updateSettings({aiPromptTemplate: value.trim()});
	};

	const handleModelChange = (modelId: string) => {
		setSelectedModel(modelId);
		setConnectionStatus('idle');
		setErrorMessage('');
		updateSettings({aiModel: modelId});
	};

	const testConnection = async () => {
		setIsTestingConnection(true);
		setConnectionStatus('idle');
		setErrorMessage('');

		try {
			await testAIConnection({
				...settings,
				aiProvider,
				authKey: claudeApiKey,
				openRouterApiKey,
				zenmuxApiKey,
				aiModel: selectedModel,
				openRouterModel,
				zenmuxModel
			});
			setConnectionStatus('success');
			const providerName = aiProvider === 'openrouter' ? 'OpenRouter' : aiProvider === 'zenmux' ? 'ZenMux' : 'Claude';
			logger.info(`${providerName} API连接测试成功`);
		} catch (error) {
			setConnectionStatus('error');
			setErrorMessage(error instanceof Error ? error.message : '连接测试失败');
			logger.error('API连接测试失败:', error);
		} finally {
			setIsTestingConnection(false);
		}
	};

	const handleSave = () => {
		updateSettings({
			aiProvider,
			authKey: claudeApiKey.trim(),
			openRouterApiKey: openRouterApiKey.trim(),
			zenmuxApiKey: zenmuxApiKey.trim(),
			aiPromptTemplate: aiPromptTemplate.trim(),
			aiModel: selectedModel,
			openRouterModel,
			zenmuxModel
		});
		saveSettings();
		logger.info('AI设置已保存');
		onClose();
	};

	const handleReset = () => {
		if (confirm('确定要清空所有AI设置吗？')) {
			setAiProvider('claude');
			setClaudeApiKey('');
			setOpenRouterApiKey('');
			setZenmuxApiKey('');
			setAiPromptTemplate('');
			setSelectedModel('');
			setOpenRouterModel('');
			setZenmuxModel('');
			setClaudeModels([]);
			setOpenRouterModels([]);
			setZenmuxModels([]);
			setConnectionStatus('idle');
			setErrorMessage('');
		}
	};

	const getDefaultPromptTemplate = () => {
		return `请分析以下文章内容，为其生成合适的元数据信息。请返回JSON格式的结果：

今天的日期是：{{today}}

文章内容：
{{content}}

{{#if filename}}
文件名：{{filename}}
{{/if}}

{{#if personalInfo.name}}
作者信息：{{personalInfo.name}}
{{/if}}

{{#if personalInfo.bio}}
作者简介：{{personalInfo.bio}}
{{/if}}

可用的元信息变量（frontmatter中的字段）：
{{#each frontmatter}}
- {{@key}}: {{this}}
{{/each}}

请基于以上信息分析文章内容并生成：
1. articleTitle: 基于内容的更好标题（如果原标题合适可保持）
2. articleSubtitle: 合适的副标题或摘要
3. episodeNum: 如果是系列文章，推测期数（格式：第 X 期）
4. seriesName: 如果是系列文章，推测系列名称
5. tags: 3-5个相关标签数组
6. author: 基于内容推测的作者名（如果无法推测留空）
7. publishDate: 建议的发布日期（YYYY-MM-DD格式，就是今天 {{today}}）
8. recommendation: 推荐语，吸引读者阅读的亮点或价值（50-100字）

请确保返回格式为纯JSON，不要包含其他文字：
{
  "articleTitle": "...",
  "articleSubtitle": "...",
  "episodeNum": "...",
  "seriesName": "...",
  "tags": ["标签1", "标签2", "标签3"],
  "author": "...",
  "publishDate": "{{today}}",
  "recommendation": "推荐语内容..."
}`;
	};

	const handleUseDefaultTemplate = () => {
		setAiPromptTemplate(getDefaultPromptTemplate());
	};

	// 获取当前平台的模型列表
	const getCurrentModels = (): AIModel[] => {
		switch (aiProvider) {
			case 'claude': return claudeModels;
			case 'openrouter': return openRouterModels;
			case 'zenmux': return zenmuxModels;
		}
	};

	// 获取当前选择的模型ID
	const getCurrentModelId = (): string => {
		switch (aiProvider) {
			case 'claude': return selectedModel;
			case 'openrouter': return openRouterModel;
			case 'zenmux': return zenmuxModel;
		}
	};

	// 设置当前平台的模型
	const setCurrentModel = (modelId: string) => {
		switch (aiProvider) {
			case 'claude':
				setSelectedModel(modelId);
				updateSettings({aiModel: modelId});
				break;
			case 'openrouter':
				setOpenRouterModel(modelId);
				updateSettings({openRouterModel: modelId});
				break;
			case 'zenmux':
				setZenmuxModel(modelId);
				updateSettings({zenmuxModel: modelId});
				break;
		}
		setConnectionStatus('idle');
		setErrorMessage('');
	};

	// 获取当前平台的 API Key
	const getCurrentApiKey = (): string => {
		switch (aiProvider) {
			case 'claude': return claudeApiKey;
			case 'openrouter': return openRouterApiKey;
			case 'zenmux': return zenmuxApiKey;
		}
	};

	// 获取当前选择的显示文本
	const getCurrentSelectionDisplay = (): string => {
		const model = getCurrentModels().find(m => m.id === getCurrentModelId());
		if (!model) return '未选择模型';
		const platformName = aiProvider === 'claude' ? 'Claude' : aiProvider === 'openrouter' ? 'OpenRouter' : 'ZenMux';
		return `${platformName} - ${model.name}`;
	};

	// 获取平台对应的获取密钥链接
	const getApiKeyLink = () => {
		switch (aiProvider) {
			case 'claude': return { url: 'https://console.anthropic.com/', text: '获取 Claude API 密钥' };
			case 'openrouter': return { url: 'https://openrouter.ai/keys', text: '获取 OpenRouter API 密钥' };
			case 'zenmux': return { url: 'https://zenmux.ai/', text: '获取 ZenMux API 密钥' };
		}
	};

	const apiKeyLink = getApiKeyLink();

	return (
		<div className="space-y-4 sm:space-y-5">
			{/* 简洁头部 */}
			<div className="flex items-center gap-3">
				<div className="p-2 bg-[#CC785C]/10 rounded-xl">
					<Bot className="h-5 w-5 text-[#CC785C]"/>
				</div>
				<div>
					<h3 className="text-base font-semibold text-[#181818]">AI 智能设置</h3>
					<p className="text-xs text-[#87867F]">配置AI服务以启用智能分析</p>
				</div>
			</div>

			{/* 双重百叶窗：平台 - 模型选择 */}
			<div className="bg-white border border-[#E8E6DC] rounded-xl p-4 sm:p-5 space-y-4">
				{/* 当前选择显示 */}
				<div className="flex items-center justify-between gap-2 min-w-0">
					<span className="text-sm font-medium text-[#181818] flex items-center gap-2 shrink-0">
						<Brain className="w-4 h-4 text-[#CC785C]"/>
						当前模型
					</span>
					<span className="text-xs text-[#87867F] bg-[#F9F9F7] px-2 py-1 rounded truncate">
						{getCurrentSelectionDisplay()}
					</span>
				</div>

				{/* 第一级：平台选择 */}
				<div className="space-y-2">
					<label className="text-xs text-[#87867F]">AI 平台</label>
					<Select
						value={aiProvider}
						onValueChange={(value: 'claude' | 'openrouter' | 'zenmux') => {
							setAiProvider(value);
							updateSettings({aiProvider: value});
							setConnectionStatus('idle');
							setErrorMessage('');
							setModelLoadError('');
						}}
					>
						<SelectTrigger className="w-full h-10">
							<SelectValue placeholder="选择 AI 平台" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="claude">
								<span className="flex items-center gap-2">
									<Bot className="w-4 h-4"/>
									Claude (Anthropic)
									{claudeApiKey && <span className="text-[10px] bg-[#7C9A5E]/20 text-[#7C9A5E] px-1 py-0.5 rounded">✓</span>}
								</span>
							</SelectItem>
							<SelectItem value="openrouter">
								<span className="flex items-center gap-2">
									<Zap className="w-4 h-4"/>
									OpenRouter
									{openRouterApiKey && <span className="text-[10px] bg-[#7C9A5E]/20 text-[#7C9A5E] px-1 py-0.5 rounded">✓</span>}
								</span>
							</SelectItem>
							<SelectItem value="zenmux">
								<span className="flex items-center gap-2">
									<Brain className="w-4 h-4"/>
									ZenMux
									{zenmuxApiKey && <span className="text-[10px] bg-[#7C9A5E]/20 text-[#7C9A5E] px-1 py-0.5 rounded">✓</span>}
								</span>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* API 密钥输入 */}
				<FormInput
					label={`${aiProvider === 'claude' ? 'Claude' : aiProvider === 'openrouter' ? 'OpenRouter' : 'ZenMux'} API 密钥`}
					value={getCurrentApiKey()}
					onChange={(value) => {
						if (aiProvider === 'claude') {
							setClaudeApiKey(value);
							updateSettings({authKey: value.trim()});
						} else if (aiProvider === 'openrouter') {
							setOpenRouterApiKey(value);
							updateSettings({openRouterApiKey: value.trim()});
						} else {
							setZenmuxApiKey(value);
							updateSettings({zenmuxApiKey: value.trim()});
						}
						setConnectionStatus('idle');
						setErrorMessage('');
						// 延迟加载模型列表
						if (value.trim().length > 10 || aiProvider === 'zenmux') {
							loadModels(aiProvider, value.trim());
						}
					}}
					placeholder={aiProvider === 'claude' ? 'sk-ant-api03-...' : aiProvider === 'openrouter' ? 'sk-or-v1-...' : 'your-zenmux-key...'}
					type="password"
					required={aiProvider !== 'zenmux'}
					icon={Key}
					className="font-mono text-xs sm:text-sm"
				/>

				{/* 第二级：模型选择 */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<label className="text-xs text-[#87867F]">AI 模型</label>
						<Button
							onClick={refreshModels}
							disabled={isLoadingModels}
							size="sm"
							variant="ghost"
							className="h-6 px-2 text-[#87867F] hover:text-[#CC785C]"
						>
							<RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`}/>
						</Button>
					</div>
					{getCurrentModels().length > 0 ? (
						<ModelCombobox
							models={getCurrentModels()}
							value={getCurrentModelId()}
							onValueChange={setCurrentModel}
							placeholder="选择 AI 模型"
							groupByVendor={aiProvider !== 'claude'}
						/>
					) : (
						<p className={`text-xs py-2 ${modelLoadError ? 'text-[#B85450]' : 'text-[#87867F]'}`}>
							{modelLoadError || (aiProvider === 'zenmux' ? '点击刷新按钮获取模型列表' : getCurrentApiKey().trim() ? '点击刷新按钮获取模型列表' : '请先输入 API Key')}
						</p>
					)}
				</div>

				{/* 测试连接 */}
				<div className="flex flex-wrap items-center gap-2">
					<Button
						onClick={testConnection}
						disabled={isTestingConnection || (aiProvider !== 'zenmux' && !getCurrentApiKey().trim())}
						size="sm"
						className="bg-[#CC785C] hover:bg-[#B86A4E] text-white rounded-lg h-9"
					>
						{isTestingConnection ? (
							<RefreshCw className="w-4 h-4 animate-spin"/>
						) : (
							<>
								<Zap className="w-4 h-4 mr-1.5"/>
								<span className="text-xs">测试连接</span>
							</>
						)}
					</Button>
					{connectionStatus === 'success' && (
						<span className="flex items-center gap-1 text-xs text-[#7C9A5E]">
							<CheckCircle className="w-3.5 h-3.5"/>
							连接成功
						</span>
					)}
					{connectionStatus === 'error' && (
						<span className="flex items-center gap-1 text-xs text-[#B85450]">
							<XCircle className="w-3.5 h-3.5"/>
							失败
						</span>
					)}
				</div>

				{errorMessage && (
					<p className="text-[#B85450] text-xs flex items-start gap-1.5 bg-[#B85450]/5 p-2 rounded-lg">
						<XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
						{errorMessage}
					</p>
				)}

				{/* 获取密钥链接 */}
				<a
					href={apiKeyLink.url}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1.5 text-xs text-[#CC785C] hover:underline"
				>
					<ExternalLink className="w-3 h-3"/>
					{apiKeyLink.text}
				</a>
			</div>

			{/* 提示词模板 - 可折叠的高级设置 */}
			<Collapsible open={promptExpanded} onOpenChange={setPromptExpanded}>
				<div className="bg-white border border-[#E8E6DC] rounded-xl overflow-hidden">
					<CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F7] transition-colors">
						<div className="flex items-center gap-3">
							<Code className="h-4 w-4 text-[#CC785C]"/>
							<div className="text-left">
								<span className="font-medium text-sm text-[#181818]">提示词模板</span>
								<p className="text-xs text-[#87867F]">自定义AI分析指令</p>
							</div>
						</div>
						<ChevronDown className={`h-4 w-4 text-[#87867F] transition-transform ${promptExpanded ? 'rotate-180' : ''}`}/>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
							<div className="flex items-center justify-end">
								<Button
									onClick={handleUseDefaultTemplate}
									size="sm"
									variant="outline"
									className="text-[#CC785C] border-[#CC785C]/30 hover:bg-[#CC785C]/5 rounded-lg text-xs h-8"
								>
									<RefreshCw className="w-3.5 h-3.5 mr-1.5"/>
									恢复默认
								</Button>
							</div>
							<textarea
								value={aiPromptTemplate}
								onChange={(e) => handlePromptTemplateChange(e.target.value)}
								placeholder="输入自定义的AI提示词模板..."
								className="w-full px-3 py-2.5 border border-[#E8E6DC] rounded-lg focus:outline-none focus:border-[#CC785C] focus:ring-1 focus:ring-[#CC785C]/20 h-32 sm:h-40 resize-y font-mono text-xs sm:text-sm transition-colors bg-white text-[#181818] placeholder:text-[#87867F]"
							/>
							{/* 模板变量 - 可滚动的水平列表 */}
							<div className="bg-[#F9F9F7] border border-[#E8E6DC] rounded-lg p-3">
								<p className="text-xs font-medium text-[#87867F] mb-2">可用变量</p>
								<div className="flex flex-wrap gap-1.5">
									{['{{content}}', '{{filename}}', '{{personalInfo.name}}', '{{today}}', '{{frontmatter}}'].map((v) => (
										<code key={v} className="text-[10px] sm:text-xs bg-white px-2 py-1 rounded border border-[#E8E6DC] text-[#CC785C]">{v}</code>
									))}
								</div>
							</div>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>

			{/* 操作按钮 - 移动端垂直堆叠 */}
			<div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-1">
				<Button
					onClick={handleReset}
					variant="outline"
					size="sm"
					className="text-[#B85450] border-[#B85450]/30 hover:bg-[#B85450]/5 rounded-lg h-10 sm:h-9"
				>
					<RotateCcw className="w-4 h-4 mr-2"/>
					清空设置
				</Button>
				<Button
					onClick={handleSave}
					size="sm"
					className="bg-[#CC785C] hover:bg-[#B86A4E] text-white rounded-lg shadow-sm h-10 sm:h-9"
				>
					<Save className="w-4 h-4 mr-2"/>
					保存设置
				</Button>
			</div>
		</div>
	);
};