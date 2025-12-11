import React, {useState} from 'react';
import {Button} from './button';
import {Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue,} from './select';

export interface AIStyle {
	id: string;
	name: string;
	description: string;
	prompt: string;
	icon: string;
}

interface AIAnalysisSplitButtonProps {
	isGenerating: boolean;
	isDisabled: boolean;
	onAnalyze: (style: AIStyle) => void;
	onCustomize: () => void;
	onOpenSettings?: () => void;
	currentStyle?: AIStyle;
}

// 预设的AI分析风格
export const AI_STYLES: AIStyle[] = [
	{
		id: 'standard',
		name: '标准分析',
		description: '全面分析文章内容，生成完整的元数据信息',
		icon: '🤖',
		prompt: `请分析以下文章内容，为其生成合适的元数据信息。请返回JSON格式的结果：

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
}`
	},
	{
		id: 'technical',
		name: '技术风格',
		description: '适合技术文章，重点分析技术要点和关键词',
		icon: '💻',
		prompt: `作为技术文档分析专家，请分析以下技术文章并生成元数据：

今天的日期是：{{today}}

文章内容：
{{content}}

{{#if filename}}
文件名：{{filename}}
{{/if}}

技术文章分析要求：
1. 识别主要技术栈、编程语言、框架
2. 提取核心技术概念和术语
3. 判断文章难度级别（初级/中级/高级）
4. 识别是否为教程、指南、最佳实践等类型

{{#if personalInfo.name}}
作者：{{personalInfo.name}}
{{/if}}

请生成适合技术文章的元数据，JSON格式：
{
  "articleTitle": "清晰的技术标题",
  "articleSubtitle": "技术要点概述",
  "episodeNum": "如果是系列教程的期数",
  "seriesName": "技术系列名称",
  "tags": ["主要技术栈", "编程语言", "核心概念", "难度级别"],
  "author": "{{personalInfo.name}}",
  "publishDate": "{{today}}",
  "recommendation": "技术推荐语，突出技术价值和学习收获"
}`
	},
	{
		id: 'marketing',
		name: '营销风格',
		description: '适合营销和商业内容，重点关注用户价值和吸引力',
		icon: '📈',
		prompt: `作为营销内容分析师，请分析以下营销/商业文章：

今天的日期是：{{today}}

文章内容：
{{content}}

{{#if filename}}
文件名：{{filename}}
{{/if}}

营销内容分析重点：
1. 识别目标受众和用户痛点
2. 提取核心价值主张
3. 分析内容类型（案例分析、产品介绍、行业洞察等）
4. 优化标题的吸引力和点击率

{{#if personalInfo.name}}
作者：{{personalInfo.name}}
{{/if}}

请生成吸引人的营销风格元数据，JSON格式：
{
  "articleTitle": "有吸引力的标题，包含关键利益点",
  "articleSubtitle": "简洁有力的副标题，突出价值主张", 
  "episodeNum": "",
  "seriesName": "如果是营销系列内容",
  "tags": ["目标受众", "核心价值", "内容类型", "行业关键词"],
  "author": "{{personalInfo.name}}",
  "publishDate": "{{today}}",
  "recommendation": "营销推荐语，强调实际价值和行动驱动"
}`
	},
	{
		id: 'academic',
		name: '学术风格',
		description: '适合学术论文和研究内容，注重严谨性和专业性',
		icon: '🎓',
		prompt: `作为学术研究分析专家，请分析以下学术内容：

今天的日期是：{{today}}

文章内容：
{{content}}

{{#if filename}}
文件名：{{filename}}
{{/if}}

学术内容分析要求：
1. 识别研究领域和学科分类
2. 提取关键研究方法和理论框架
3. 分析研究贡献和创新点
4. 确定学术级别和目标读者

{{#if personalInfo.name}}
研究者：{{personalInfo.name}}
{{/if}}

请生成符合学术规范的元数据，JSON格式：
{
  "articleTitle": "准确严谨的学术标题",
  "articleSubtitle": "研究要点和方法概述",
  "episodeNum": "",
  "seriesName": "如果是研究系列",
  "tags": ["研究领域", "方法论", "理论框架", "学科分类"],
  "author": "{{personalInfo.name}}",
  "publishDate": "{{today}}",
  "summary": "学术研究摘要，概括研究问题、方法和主要发现（100-200字）",
  "recommendation": "学术推荐语，强调研究价值和理论贡献"
}`
	},
	{
		id: 'lifestyle',
		name: '生活风格',
		description: '适合生活类内容，重点关注实用性和情感共鸣',
		icon: '🌟',
		prompt: `作为生活内容分析师，请分析以下生活类文章：

今天的日期是：{{today}}

文章内容：
{{content}}

{{#if filename}}
文件名：{{filename}}
{{/if}}

生活内容分析重点：
1. 识别生活场景和应用情境
2. 提取实用技巧和经验分享
3. 分析情感共鸣点和价值观
4. 优化可读性和亲和力

{{#if personalInfo.name}}
作者：{{personalInfo.name}}
{{/if}}

请生成温暖亲和的生活风格元数据，JSON格式：
{
  "articleTitle": "温暖有趣的生活化标题",
  "articleSubtitle": "实用贴心的内容概述",
  "episodeNum": "",
  "seriesName": "如果是生活系列分享",
  "tags": ["生活场景", "实用技巧", "情感标签", "价值观念"],
  "author": "{{personalInfo.name}}",
  "publishDate": "{{today}}",
  "recommendation": "生活推荐语，强调实用价值和情感共鸣"
}`
	}
];

export const AIAnalysisSplitButton: React.FC<AIAnalysisSplitButtonProps> = ({
																				isGenerating,
																				isDisabled,
																				onAnalyze,
																				onCustomize,
																				onOpenSettings,
																				currentStyle
																			}) => {
	const [selectedStyle, setSelectedStyle] = useState<AIStyle>(currentStyle || AI_STYLES[0]);

	const handleMainClick = () => {
		onAnalyze(selectedStyle);
	};

	const handleValueChange = (value: string) => {
		if (value === 'customize') {
			onCustomize();
			return;
		}

		if (value === 'open-settings') {
			onOpenSettings?.();
			return;
		}

		const style = AI_STYLES.find(s => s.id === value);
		if (style) {
			setSelectedStyle(style);
			// 只有在 API 已配置且未在生成中时才自动触发分析
			if (!isDisabled && !isGenerating) {
				onAnalyze(style);
			}
		}
	};

	const baseButtonClass = isGenerating
		? 'bg-primary/60 cursor-not-allowed'
		: isDisabled
			? 'bg-muted-foreground/60 hover:bg-muted-foreground/70'
			: 'bg-primary hover:bg-primary/90';

	return (
		<div className="inline-flex rounded-xl overflow-hidden shadow-sm">
			{/* 主分析按钮 */}
			<Button
				onClick={handleMainClick}
				disabled={isDisabled || isGenerating}
				size="sm"
				className={`rounded-none text-primary-foreground border-0 ${baseButtonClass}`}
				title={
					isGenerating
						? 'AI正在分析中...'
						: isDisabled
							? '请先配置Claude API密钥'
							: `使用 ${selectedStyle.name} 分析文章内容`
				}
			>
				{isGenerating ? (
					<>
						<svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
						</svg>
						分析中...
					</>
				) : (
					<>
						<span className="mr-1.5">{selectedStyle.icon}</span>
						AI 分析
					</>
				)}
			</Button>

			{/* 分隔线 */}
			<div className={`w-px ${isGenerating ? 'bg-primary-foreground/30' : 'bg-primary-foreground/20'}`}/>

			{/* 下拉菜单触发器 */}
			<Select value="" onValueChange={handleValueChange} disabled={isGenerating}>
				<SelectTrigger
					size="sm"
					className={`w-8 rounded-none px-1 text-primary-foreground border-0 ${baseButtonClass}`}
				>
					<SelectValue/>
				</SelectTrigger>
				<SelectContent align="end" className="w-80 bg-popover border-border rounded-xl">
					{/* 预设风格选项 */}
					{AI_STYLES.map((style) => (
						<SelectItem key={style.id} value={style.id}>
							<div className="flex items-start gap-3 py-1">
								<span className="text-lg flex-shrink-0">{style.icon}</span>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium text-foreground text-sm">{style.name}</span>
										{selectedStyle.id === style.id && (
											<span className="inline-block w-2 h-2 bg-primary rounded-full flex-shrink-0"/>
										)}
									</div>
									<div className="text-xs text-muted-foreground leading-relaxed">
										{style.description}
									</div>
								</div>
							</div>
						</SelectItem>
					))}

					{/* 分隔线 */}
					<SelectSeparator/>

					{/* 未配置时显示配置入口 */}
					{isDisabled && onOpenSettings && (
						<SelectItem value="open-settings">
							<div className="flex items-center gap-3 py-1">
								<span className="text-lg">🔑</span>
								<div>
									<div className="font-medium text-primary text-sm">配置 API 密钥</div>
									<div className="text-xs text-muted-foreground">需要先配置才能使用 AI 分析</div>
								</div>
							</div>
						</SelectItem>
					)}

					{/* 自定义选项 */}
					<SelectItem value="customize">
						<div className="flex items-center gap-3 py-1">
							<span className="text-lg">⚙️</span>
							<div>
								<div className="font-medium text-foreground text-sm">自定义prompt</div>
								<div className="text-xs text-muted-foreground">编辑自定义分析模板</div>
							</div>
						</div>
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
};
