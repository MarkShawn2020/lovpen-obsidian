import React, {useState, useCallback} from 'react';
import {useAtom} from 'jotai';
import {imageGenerationService} from '../../services/imageGenerationService';
import {aiLogService} from '../../services/aiLogService';
import {playgroundAtom} from '../../store/atoms';
import {ViteReactSettings} from '../../types';
import {Sparkles, Download, Settings, Eye, X, ChevronDown, ChevronUp} from 'lucide-react';

interface PlaygroundPanelProps {
	settings?: ViteReactSettings;
	onOpenAISettings?: () => void;
}


export const PlaygroundPanel: React.FC<PlaygroundPanelProps> = ({settings, onOpenAISettings}) => {
	// 使用 atom 持久化状态
	const [playgroundState, setPlaygroundState] = useAtom(playgroundAtom);
	const {prompt, negativePrompt, generatedImages, isGenerating, temperature = 1.0, topP = 0.95, seed} = playgroundState;

	// 本地 UI 状态（不需要持久化）
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [error, setError] = useState('');

	// 更新持久化状态的辅助函数
	const updateState = useCallback((updates: Partial<typeof playgroundState>) => {
		setPlaygroundState(prev => ({...prev, ...updates}));
	}, [setPlaygroundState]);

	const isAIAvailable = settings?.aiProvider === 'zenmux' && !!settings?.zenmuxApiKey?.trim();

	const handleGenerate = useCallback(async () => {
		if (!prompt.trim() || !isAIAvailable || isGenerating) return;

		updateState({isGenerating: true});
		setError('');

		const logId = aiLogService.addLog({
			type: 'image_generation',
			status: 'started',
			message: '实验室图片生成',
			prompt,
			negativePrompt: negativePrompt || undefined,
			model: 'gemini-3-pro-image-preview'
		});

		try {
			const result = await imageGenerationService.generateImage({
				prompt,
				negativePrompt: negativePrompt || undefined,
				settings,
				useNanoBananaPro: true,
				temperature,
				topP,
				seed
			});

			if (result.success && result.imageUrl) {
				updateState({
					generatedImages: [result.imageUrl!, ...generatedImages].slice(0, 12),
					isGenerating: false
				});
				aiLogService.updateLog(logId, {
					status: 'completed',
					message: '实验室图片生成成功',
					imageUrl: result.imageUrl
				});
			} else {
				throw new Error(result.error || '生成失败');
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : '生成失败';
			setError(msg);
			updateState({isGenerating: false});
			aiLogService.updateLog(logId, {
				status: 'failed',
				message: '实验室图片生成失败',
				error: msg
			});
		}
	}, [prompt, negativePrompt, generatedImages, isGenerating, settings, isAIAvailable, updateState, temperature, topP, seed]);

	const handleDownload = useCallback((url: string, index: number) => {
		const a = document.createElement('a');
		a.href = url;
		a.download = `playground-${Date.now()}-${index}.png`;
		a.click();
	}, []);

	if (!isAIAvailable) {
		return (
			<div className="text-center py-8">
				<p className="text-sm text-muted-foreground mb-2">需要配置 ZenMux API 才能使用</p>
				{onOpenAISettings && (
					<button
						onClick={onOpenAISettings}
						className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
					>
						<Settings className="h-3.5 w-3.5"/>
						前往 AI 设置
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Prompt 输入 */}
			<div>
				<label className="block text-xs font-medium mb-1.5">提示词</label>
				<textarea
					value={prompt}
					onChange={(e) => updateState({prompt: e.target.value})}
					placeholder="描述你想要生成的图片..."
					className="w-full px-3 py-2 text-sm border border-input rounded-lg resize-none h-24 bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
				/>
			</div>

			{/* 高级选项开关 */}
			<button
				onClick={() => setShowAdvanced(!showAdvanced)}
				className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
			>
				{showAdvanced ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
				高级参数
			</button>

			{/* 高级选项 */}
			{showAdvanced && (
				<div className="space-y-3">
					<div>
						<label className="block text-xs font-medium mb-1.5">负面提示词</label>
						<textarea
							value={negativePrompt}
							onChange={(e) => updateState({negativePrompt: e.target.value})}
							placeholder="排除不想要的元素..."
							className="w-full px-3 py-2 text-xs border border-border rounded-lg resize-none h-16 bg-muted focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>

					{/* Temperature */}
					<div>
						<div className="flex justify-between items-center mb-1">
							<label className="text-xs font-medium">Temperature</label>
							<span className="text-xs text-muted-foreground">{temperature.toFixed(2)}</span>
						</div>
						<input
							type="range"
							min="0"
							max="2"
							step="0.05"
							value={temperature}
							onChange={(e) => updateState({temperature: parseFloat(e.target.value)})}
							className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
						/>
						<p className="text-[10px] text-muted-foreground mt-0.5">控制输出随机性，越高越有创意</p>
					</div>

					{/* Top P */}
					<div>
						<div className="flex justify-between items-center mb-1">
							<label className="text-xs font-medium">Top P</label>
							<span className="text-xs text-muted-foreground">{topP.toFixed(2)}</span>
						</div>
						<input
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={topP}
							onChange={(e) => updateState({topP: parseFloat(e.target.value)})}
							className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
						/>
						<p className="text-[10px] text-muted-foreground mt-0.5">核采样阈值，控制候选词范围</p>
					</div>

					{/* Seed */}
					<div>
						<div className="flex justify-between items-center mb-1">
							<label className="text-xs font-medium">Seed</label>
							<button
								onClick={() => updateState({seed: undefined})}
								className="text-[10px] text-muted-foreground hover:text-foreground"
							>
								清除
							</button>
						</div>
						<input
							type="number"
							value={seed ?? ''}
							onChange={(e) => updateState({seed: e.target.value ? parseInt(e.target.value) : undefined})}
							placeholder="留空使用随机种子"
							className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-muted focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
						<p className="text-[10px] text-muted-foreground mt-0.5">固定种子可复现相同结果</p>
					</div>
				</div>
			)}

			{/* 生成按钮 */}
			<button
				onClick={handleGenerate}
				disabled={isGenerating || !prompt.trim()}
				className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`}/>
				{isGenerating ? '生成中...' : '生成图片'}
			</button>

			{/* 错误提示 */}
			{error && (
				<p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
			)}

			{/* 生成的图片 */}
			{generatedImages.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">点击预览，双击下载</p>
					<div className="grid grid-cols-3 gap-2">
						{generatedImages.map((url, i) => (
							<button
								key={i}
								onClick={() => setPreviewImage(url)}
								onDoubleClick={() => handleDownload(url, i)}
								className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
							>
								<img src={url} alt={`生成图片 ${i + 1}`} className="w-full h-full object-cover"/>
								<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Eye className="h-4 w-4 text-white"/>
								</div>
							</button>
						))}
					</div>
				</div>
			)}

			{/* 预览弹窗 */}
			{previewImage && (
				<div
					className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
					onClick={() => setPreviewImage(null)}
				>
					<div
						className="relative max-w-3xl max-h-[80vh] bg-card rounded-xl overflow-hidden shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<img src={previewImage} alt="预览" className="max-w-full max-h-[70vh] object-contain"/>
						<div className="absolute top-2 right-2 flex gap-2">
							<button
								onClick={() => setPreviewImage(null)}
								className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
							>
								<X className="h-5 w-5"/>
							</button>
						</div>
						<div className="p-3 bg-card border-t border-border flex justify-end gap-2">
							<button
								onClick={() => setPreviewImage(null)}
								className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								关闭
							</button>
							<button
								onClick={() => {
									handleDownload(previewImage, 0);
									setPreviewImage(null);
								}}
								className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
							>
								<Download className="h-4 w-4"/>
								下载图片
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
