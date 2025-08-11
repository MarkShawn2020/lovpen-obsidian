import React, {useEffect, useState} from 'react';
import {Button} from '../ui/button';
import {FormInput} from '../ui/FormInput';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectGroup,
	SelectLabel,
} from '../ui/select';
import {AIModel, ViteReactSettings} from '../../types';
import {logger} from '../../../../shared/src/logger';
import {
	Bot,
	CheckCircle,
	Code,
	ExternalLink,
	FileText,
	Info,
	Key,
	RefreshCw,
	RotateCcw,
	Save,
	Sparkles,
	Tag,
	User,
	XCircle,
	Zap,
	Brain,
	Target,
	ChevronRight,
	Settings,
	Shield,
	Wand2
} from 'lucide-react';
import {useSettings} from '../../hooks/useSettings';
import { OPENROUTER_MODELS, testAIConnection } from '../../services/aiService';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '../ui/accordion';

// 可用的AI模型定义
const AVAILABLE_MODELS: AIModel[] = [
	{
		id: 'claude-3-5-haiku-latest',
		name: 'Claude 3.5 Haiku',
		description: '快速响应，成本最低',
		category: 'fast',
		pricing: 'low',
		recommended: true
	},
	{
		id: 'claude-3-5-sonnet-latest',
		name: 'Claude 3.5 Sonnet',
		description: '平衡性能与成本',
		category: 'balanced',
		pricing: 'medium'
	},
	{
		id: 'claude-3-7-sonnet-latest',
		name: 'Claude 3.7 Sonnet',
		description: '更强推理能力',
		category: 'balanced',
		pricing: 'medium'
	},
	{
		id: 'claude-sonnet-4-0',
		name: 'Claude Sonnet 4',
		description: '高性能模型',
		category: 'powerful',
		pricing: 'medium'
	},
	{
		id: 'claude-opus-4-0',
		name: 'Claude Opus 4',
		description: '最强大的模型',
		category: 'powerful',
		pricing: 'high'
	}
];

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
	
	const [aiProvider, setAiProvider] = useState<'claude' | 'openrouter'>(settings.aiProvider || 'claude');
	const [claudeApiKey, setClaudeApiKey] = useState<string>(settings.authKey || '');
	const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(settings.openRouterApiKey || '');
	const [aiPromptTemplate, setAiPromptTemplate] = useState<string>(settings.aiPromptTemplate || '');
	const [selectedModel, setSelectedModel] = useState<string>(settings.aiModel || 'claude-3-5-haiku-latest');
	const [openRouterModel, setOpenRouterModel] = useState<string>(settings.openRouterModel || 'openai/gpt-4o-mini');
	const [isTestingConnection, setIsTestingConnection] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [expandedItem, setExpandedItem] = useState<string | undefined>(aiProvider);

	useEffect(() => {
		setAiProvider(settings.aiProvider || 'claude');
		setClaudeApiKey(settings.authKey || '');
		setOpenRouterApiKey(settings.openRouterApiKey || '');
		setAiPromptTemplate(settings.aiPromptTemplate || '');
		setSelectedModel(settings.aiModel || 'claude-3-5-haiku-latest');
		setOpenRouterModel(settings.openRouterModel || 'openai/gpt-4o-mini');
	}, [settings.aiProvider, settings.authKey, settings.openRouterApiKey, settings.aiPromptTemplate, settings.aiModel, settings.openRouterModel]);

	const handleApiKeyChange = (value: string) => {
		setClaudeApiKey(value);
		setConnectionStatus('idle');
		setErrorMessage('');
		updateSettings({authKey: value.trim()});
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
				aiModel: selectedModel,
				openRouterModel
			});
			setConnectionStatus('success');
			logger.info(`${aiProvider === 'openrouter' ? 'OpenRouter' : 'Claude'} API连接测试成功`);
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
			aiPromptTemplate: aiPromptTemplate.trim(),
			aiModel: selectedModel,
			openRouterModel
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
			setAiPromptTemplate('');
			setSelectedModel('claude-3-5-haiku-latest');
			setOpenRouterModel('openai/gpt-4o-mini');
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

	// Claude配置组件
	const ClaudeConfiguration = () => (
		<div className="space-y-4">
			<FormInput
				label="Claude API 密钥"
				value={claudeApiKey}
				onChange={handleApiKeyChange}
				placeholder="sk-ant-api03-..."
				type="password"
				required={true}
				icon={Key}
				className="font-mono text-sm"
			/>

			<div className="space-y-2">
				<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
					<Brain className="w-4 h-4 text-indigo-600"/>
					AI 模型选择
				</label>
				<Select value={selectedModel} onValueChange={handleModelChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="选择 AI 模型" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel className="flex items-center gap-2">
								<Zap className="w-3 h-3"/>
								快速响应
							</SelectLabel>
							{AVAILABLE_MODELS.filter(m => m.category === 'fast').map(model => (
								<SelectItem key={model.id} value={model.id}>
									<div className="flex items-center justify-between w-full">
										<div>
											<span className="font-medium">{model.name}</span>
											{model.recommended && (
												<span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">推荐</span>
											)}
											<div className="text-xs text-gray-500">{model.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
						
						<SelectGroup>
							<SelectLabel className="flex items-center gap-2">
								<Target className="w-3 h-3"/>
								平衡性能
							</SelectLabel>
							{AVAILABLE_MODELS.filter(m => m.category === 'balanced').map(model => (
								<SelectItem key={model.id} value={model.id}>
									<div className="flex items-center justify-between w-full">
										<div>
											<span className="font-medium">{model.name}</span>
											<div className="text-xs text-gray-500">{model.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
						
						<SelectGroup>
							<SelectLabel className="flex items-center gap-2">
								<Brain className="w-3 h-3"/>
								强大推理
							</SelectLabel>
							{AVAILABLE_MODELS.filter(m => m.category === 'powerful').map(model => (
								<SelectItem key={model.id} value={model.id}>
									<div className="flex items-center justify-between w-full">
										<div>
											<span className="font-medium">{model.name}</span>
											<div className="text-xs text-gray-500">{model.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				
				{/* 显示当前选择模型的详细信息 */}
				{(() => {
					const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);
					if (currentModel) {
						const priceColor = currentModel.pricing === 'low' ? 'text-green-600' :
							currentModel.pricing === 'medium' ? 'text-yellow-600' : 'text-red-600';
						const priceText = currentModel.pricing === 'low' ? '低成本' :
							currentModel.pricing === 'medium' ? '中等成本' : '高成本';
						
						return (
							<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
								<div className="flex items-center justify-between">
									<div className="text-sm text-gray-700">
										<span className="font-medium">当前选择：</span> {currentModel.name}
									</div>
									<div className={`text-xs px-2 py-1 rounded-full bg-white border ${priceColor}`}>
										{priceText}
									</div>
								</div>
								<div className="text-xs text-gray-600 mt-1">{currentModel.description}</div>
							</div>
						);
					}
					return null;
				})()}
			</div>

			<div className="flex items-center justify-between">
				<Button
					onClick={testConnection}
					disabled={isTestingConnection || !claudeApiKey.trim()}
					size="sm"
					className="bg-blue-600 hover:bg-blue-700 text-white"
				>
					{isTestingConnection ? (
						<>
							<RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
							测试连接中...
						</>
					) : (
						<>
							<Zap className="w-4 h-4 mr-2"/>
							测试连接
						</>
					)}
				</Button>

				{connectionStatus === 'success' && (
					<div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
						<CheckCircle className="w-4 h-4"/>
						<span className="text-sm font-medium">连接成功</span>
					</div>
				)}

				{connectionStatus === 'error' && (
					<div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
						<XCircle className="w-4 h-4"/>
						<span className="text-sm font-medium">连接失败</span>
					</div>
				)}
			</div>

			{errorMessage && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-3">
					<p className="text-red-600 text-sm flex items-center gap-2">
						<XCircle className="w-4 h-4"/>
						{errorMessage}
					</p>
				</div>
			)}

			{/* API密钥安全说明 */}
			<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
				<div className="flex items-start gap-2">
					<Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0"/>
					<div className="text-sm text-amber-800">
						<p className="font-medium">安全提醒</p>
						<p className="mt-1">API密钥仅在本地存储，不会上传到任何服务器。</p>
					</div>
				</div>
			</div>

			{/* 获取密钥指南 */}
			<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<div className="flex items-start gap-2">
					<Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"/>
					<div className="text-sm text-blue-800">
						<p className="font-medium mb-1">如何获取Claude API密钥？</p>
						<a
							href="https://console.anthropic.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-800 underline"
						>
							访问Anthropic Console
						</a>
					</div>
				</div>
			</div>
		</div>
	);

	// OpenRouter配置组件
	const OpenRouterConfiguration = () => (
		<div className="space-y-4">
			<FormInput
				label="OpenRouter API 密钥"
				value={openRouterApiKey}
				onChange={(value) => {
					setOpenRouterApiKey(value);
					setConnectionStatus('idle');
					setErrorMessage('');
					updateSettings({openRouterApiKey: value.trim()});
				}}
				placeholder="sk-or-v1-..."
				type="password"
				required={true}
				icon={Key}
				className="font-mono text-sm"
			/>

			<div className="space-y-2">
				<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
					<Brain className="w-4 h-4 text-indigo-600"/>
					模型选择
				</label>
				<Select value={openRouterModel} onValueChange={(value) => {
					setOpenRouterModel(value);
					setConnectionStatus('idle');
					setErrorMessage('');
					updateSettings({openRouterModel: value});
				}}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="选择模型" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel className="flex items-center gap-2">
								<Zap className="w-3 h-3"/>
								快速响应
							</SelectLabel>
							{OPENROUTER_MODELS.filter(m => m.category === 'fast').map(model => (
								<SelectItem key={model.id} value={model.id}>
									<div className="flex items-center justify-between w-full">
										<div>
											<span className="font-medium">{model.name}</span>
											<div className="text-xs text-gray-500">{model.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
						
						<SelectGroup>
							<SelectLabel className="flex items-center gap-2">
								<Target className="w-3 h-3"/>
								平衡性能
							</SelectLabel>
							{OPENROUTER_MODELS.filter(m => m.category === 'balanced').map(model => (
								<SelectItem key={model.id} value={model.id}>
									<div className="flex items-center justify-between w-full">
										<div>
											<span className="font-medium">{model.name}</span>
											<div className="text-xs text-gray-500">{model.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
						
						<SelectGroup>
							<SelectLabel className="flex items-center gap-2">
								<Brain className="w-3 h-3"/>
								强大推理
							</SelectLabel>
							{OPENROUTER_MODELS.filter(m => m.category === 'powerful').map(model => (
								<SelectItem key={model.id} value={model.id}>
									<div className="flex items-center justify-between w-full">
										<div>
											<span className="font-medium">{model.name}</span>
											<div className="text-xs text-gray-500">{model.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				
				{/* 显示当前选择模型的详细信息 */}
				{(() => {
					const currentModel = OPENROUTER_MODELS.find(m => m.id === openRouterModel);
					if (currentModel) {
						const priceColor = currentModel.pricing === 'low' ? 'text-green-600' :
							currentModel.pricing === 'medium' ? 'text-yellow-600' : 'text-red-600';
						const priceText = currentModel.pricing === 'low' ? '低成本' :
							currentModel.pricing === 'medium' ? '中等成本' : '高成本';
						
						return (
							<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
								<div className="flex items-center justify-between">
									<div className="text-sm text-gray-700">
										<span className="font-medium">当前选择：</span> {currentModel.name}
									</div>
									<div className={`text-xs px-2 py-1 rounded-full bg-white border ${priceColor}`}>
										{priceText}
									</div>
								</div>
								<div className="text-xs text-gray-600 mt-1">{currentModel.description}</div>
							</div>
						);
					}
					return null;
				})()}
			</div>

			<div className="flex items-center justify-between">
				<Button
					onClick={testConnection}
					disabled={isTestingConnection || !openRouterApiKey.trim()}
					size="sm"
					className="bg-purple-600 hover:bg-purple-700 text-white"
				>
					{isTestingConnection ? (
						<>
							<RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
							测试连接中...
						</>
					) : (
						<>
							<Zap className="w-4 h-4 mr-2"/>
							测试连接
						</>
					)}
				</Button>

				{connectionStatus === 'success' && (
					<div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
						<CheckCircle className="w-4 h-4"/>
						<span className="text-sm font-medium">连接成功</span>
					</div>
				)}

				{connectionStatus === 'error' && (
					<div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
						<XCircle className="w-4 h-4"/>
						<span className="text-sm font-medium">连接失败</span>
					</div>
				)}
			</div>

			{errorMessage && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-3">
					<p className="text-red-600 text-sm flex items-center gap-2">
						<XCircle className="w-4 h-4"/>
						{errorMessage}
					</p>
				</div>
			)}

			{/* OpenRouter优势说明 */}
			<div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
				<div className="flex items-start gap-2">
					<Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0"/>
					<div className="text-sm text-purple-800">
						<p className="font-medium">OpenRouter优势</p>
						<ul className="mt-1 space-y-1 text-xs">
							<li>• 支持多种AI模型（GPT、Claude、Gemini等）</li>
							<li>• 结构化输出确保返回格式正确</li>
							<li>• 统一的API接口，切换模型更方便</li>
						</ul>
					</div>
				</div>
			</div>

			{/* 获取密钥指南 */}
			<div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
				<div className="flex items-start gap-2">
					<Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0"/>
					<div className="text-sm text-purple-800">
						<p className="font-medium mb-1">如何获取OpenRouter API密钥？</p>
						<a
							href="https://openrouter.ai/keys"
							target="_blank"
							rel="noopener noreferrer"
							className="text-purple-600 hover:text-purple-800 underline"
						>
							访问OpenRouter Keys
						</a>
					</div>
				</div>
			</div>
		</div>
	);

	// 公共提示词模板配置组件
	const CommonPromptConfiguration = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-purple-100 rounded-lg">
						<Code className="h-5 w-5 text-purple-600"/>
					</div>
					<div>
						<h4 className="font-semibold text-gray-900">提示词模板</h4>
						<p className="text-sm text-gray-600">自定义AI分析的指令模板（支持Handlebars语法）</p>
					</div>
				</div>
				<Button
					onClick={handleUseDefaultTemplate}
					size="sm"
					variant="outline"
					className="text-purple-600 border-purple-300 hover:bg-purple-50"
				>
					<RefreshCw className="w-4 h-4 mr-2"/>
					恢复默认
				</Button>
			</div>

			<textarea
				value={aiPromptTemplate}
				onChange={(e) => handlePromptTemplateChange(e.target.value)}
				placeholder="输入自定义的AI提示词模板..."
				className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-0 h-40 resize-y font-mono text-sm transition-colors"
			/>

			{/* 模板变量说明 */}
			<div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
				<div className="flex items-center gap-2 mb-3">
					<Code className="h-4 w-4 text-yellow-600"/>
					<h5 className="text-sm font-medium text-yellow-800">可用的模板变量</h5>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
					{[
						{var: '{{content}}', desc: '文章正文内容（已移除frontmatter）'},
						{var: '{{filename}}', desc: '当前文件名（不含扩展名）'},
						{var: '{{personalInfo.name}}', desc: '个人信息中的姓名'},
						{var: '{{personalInfo.bio}}', desc: '个人信息中的简介'},
						{var: '{{frontmatter}}', desc: '当前文档的frontmatter对象'},
						{var: '{{today}}', desc: '当前日期（YYYY-MM-DD格式）'}
					].map((item, index) => (
						<div key={index} className="bg-white/60 border border-yellow-200 rounded-lg p-2">
							<code className="text-yellow-700 font-medium">{item.var}</code>
							<p className="text-yellow-600 mt-1">{item.desc}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			{/* 头部说明 */}
			<div className="text-center">
				<div className="flex items-center justify-center gap-2 mb-2">
					<Bot className="h-6 w-6 text-blue-600"/>
					<h3 className="text-lg font-semibold text-gray-900">AI 智能设置</h3>
				</div>
				<p className="text-gray-600">配置AI服务，解锁智能内容分析功能</p>
			</div>

			{/* AI功能介绍 */}
			<div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="bg-white/60 backdrop-blur-sm border border-blue-200 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-2">
							<Sparkles className="h-4 w-4 text-blue-600"/>
							<h5 className="text-sm font-medium text-gray-800">智能分析</h5>
						</div>
						<p className="text-xs text-gray-600">自动分析文章内容，提取关键信息</p>
					</div>
					<div className="bg-white/60 backdrop-blur-sm border border-purple-200 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-2">
							<FileText className="h-4 w-4 text-purple-600"/>
							<h5 className="text-sm font-medium text-gray-800">内容建议</h5>
						</div>
						<p className="text-xs text-gray-600">智能建议标题、副标题等元数据</p>
					</div>
					<div className="bg-white/60 backdrop-blur-sm border border-indigo-200 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-2">
							<Tag className="h-4 w-4 text-indigo-600"/>
							<h5 className="text-sm font-medium text-gray-800">自动标签</h5>
						</div>
						<p className="text-xs text-gray-600">基于内容主题生成相关标签</p>
					</div>
				</div>
			</div>

			{/* AI配置主体 - 使用Accordion */}
			<Accordion 
				type="single" 
				collapsible 
				className="w-full" 
				value={expandedItem}
				onValueChange={(value) => {
					setExpandedItem(value);
					// 当展开某个项时，自动设置为当前选中的provider
					if (value) {
						setAiProvider(value as 'claude' | 'openrouter');
					}
				}}
			>
				{/* Claude 配置 */}
				<AccordionItem value="claude" className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-3">
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 w-full">
						<div className="flex items-center gap-4 flex-1">
							<div className={`p-2.5 rounded-lg transition-colors ${
								aiProvider === 'claude' ? 'bg-blue-100' : 'bg-gray-100'
							}`}>
								<Bot className={`h-5 w-5 ${
									aiProvider === 'claude' ? 'text-blue-600' : 'text-gray-500'
								}`}/>
							</div>
							<div className="flex-1 text-left">
								<div className="flex items-center gap-2">
									<h4 className="font-semibold text-gray-900">Claude</h4>
									{claudeApiKey && (
										<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
											已配置
										</span>
									)}
									{aiProvider === 'claude' && (
										<span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
											当前选中
										</span>
									)}
								</div>
								<p className="text-sm text-gray-600 mt-1">Anthropic原生API，高质量响应</p>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-6">
						<ClaudeConfiguration />
					</AccordionContent>
				</AccordionItem>

				{/* OpenRouter 配置 */}
				<AccordionItem value="openrouter" className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-3">
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 w-full">
						<div className="flex items-center gap-4 flex-1">
							<div className={`p-2.5 rounded-lg transition-colors ${
								aiProvider === 'openrouter' ? 'bg-purple-100' : 'bg-gray-100'
							}`}>
								<Zap className={`h-5 w-5 ${
									aiProvider === 'openrouter' ? 'text-purple-600' : 'text-gray-500'
								}`}/>
							</div>
							<div className="flex-1 text-left">
								<div className="flex items-center gap-2">
									<h4 className="font-semibold text-gray-900">OpenRouter</h4>
									{openRouterApiKey && (
										<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
											已配置
										</span>
									)}
									{aiProvider === 'openrouter' && (
										<span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
											当前选中
										</span>
									)}
								</div>
								<p className="text-sm text-gray-600 mt-1">多模型统一接口，结构化输出</p>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-6">
						<OpenRouterConfiguration />
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{/* 公共配置部分 - 提示词模板 */}
			<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
				<CommonPromptConfiguration />
			</div>

			{/* 操作按钮 */}
			<div className="flex justify-between items-center pt-2">
				<Button
					onClick={handleReset}
					variant="outline"
					className="text-red-600 border-red-300 hover:bg-red-50"
				>
					<RotateCcw className="w-4 h-4 mr-2"/>
					清空设置
				</Button>
				<Button
					onClick={handleSave}
					className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
				>
					<Save className="w-4 h-4 mr-2"/>
					保存设置
				</Button>
			</div>
		</div>
	);
};