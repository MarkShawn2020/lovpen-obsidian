import React, {useEffect, useState} from 'react';
import {aiLogService, AILogEntry} from '../../services/aiLogService';
import {Trash2, CheckCircle2, XCircle, Loader2, Image, FileText, ChevronDown, ChevronUp, Copy, X, Download} from 'lucide-react';

const formatTime = (ts: number) => {
	const d = new Date(ts);
	return d.toLocaleString('zh-CN', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
};

const StatusIcon: React.FC<{status: AILogEntry['status']}> = ({status}) => {
	if (status === 'started') {
		return <Loader2 className="h-4 w-4 text-blue-500 animate-spin"/>;
	}
	if (status === 'failed') {
		return <XCircle className="h-4 w-4 text-red-500"/>;
	}
	return <CheckCircle2 className="h-4 w-4 text-green-500"/>;
};

const TypeIcon: React.FC<{type: AILogEntry['type']}> = ({type}) => {
	if (type === 'image_generation') {
		return <Image className="h-3.5 w-3.5 text-purple-500"/>;
	}
	return <FileText className="h-3.5 w-3.5 text-blue-500"/>;
};

const LogItem: React.FC<{entry: AILogEntry}> = ({entry}) => {
	const [expanded, setExpanded] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const handleDownload = (url: string) => {
		const a = document.createElement('a');
		a.href = url;
		a.download = `ai-generated-${Date.now()}.png`;
		a.click();
	};

	const hasDetails = entry.prompt || entry.generatedPrompt || entry.model || entry.error;

	return (
		<>
			<div
				className={`rounded-lg border text-xs transition-colors ${
					entry.status === 'failed'
						? 'bg-red-50 border-red-200'
						: entry.status === 'started'
							? 'bg-blue-50 border-blue-200'
							: 'bg-card border-border'
				}`}
			>
				{/* 头部 */}
				<div
					className={`flex items-center gap-2 p-3 ${hasDetails || entry.imageUrl ? 'cursor-pointer' : ''}`}
					onClick={() => (hasDetails || entry.imageUrl) && setExpanded(!expanded)}
				>
					<StatusIcon status={entry.status}/>
					<TypeIcon type={entry.type}/>
					<div className="flex-1 min-w-0">
						<span className="font-medium">{entry.message}</span>
					</div>
					<span className="text-muted-foreground shrink-0 text-[10px]">{formatTime(entry.timestamp)}</span>
					{(hasDetails || entry.imageUrl) && (
						expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground"/> : <ChevronDown className="h-3 w-3 text-muted-foreground"/>
					)}
				</div>

				{/* 展开详情 */}
				{expanded && (
					<div className="border-t border-border/50 p-3 space-y-2 bg-muted/30">
						{/* 模型信息 */}
						{entry.model && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground w-16 shrink-0">模型:</span>
								<code className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{entry.model}</code>
							</div>
						)}

						{/* 风格 */}
						{entry.style && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground w-16 shrink-0">风格:</span>
								<span>{entry.style}</span>
							</div>
						)}

						{/* Prompt */}
						{entry.prompt && (
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Prompt:</span>
									<button
										onClick={(e) => {e.stopPropagation(); handleCopy(entry.prompt!);}}
										className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
									>
										<Copy className="h-3 w-3"/>
										{copied ? '已复制' : '复制'}
									</button>
								</div>
								<pre className="p-2 bg-muted rounded text-[10px] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
									{entry.prompt}
								</pre>
							</div>
						)}

						{/* 负面 Prompt */}
						{entry.negativePrompt && (
							<div className="space-y-1">
								<span className="text-muted-foreground">Negative:</span>
								<pre className="p-2 bg-muted rounded text-[10px] whitespace-pre-wrap break-all max-h-20 overflow-y-auto">
									{entry.negativePrompt}
								</pre>
							</div>
						)}

						{/* 生成的 Prompt（用于 prompt_generation 类型）*/}
						{entry.generatedPrompt && (
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">生成的 Prompt:</span>
									<button
										onClick={(e) => {e.stopPropagation(); handleCopy(entry.generatedPrompt!);}}
										className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
									>
										<Copy className="h-3 w-3"/>
										{copied ? '已复制' : '复制'}
									</button>
								</div>
								<pre className="p-2 bg-green-50 border border-green-200 rounded text-[10px] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
									{entry.generatedPrompt}
								</pre>
							</div>
						)}

						{/* 错误信息 */}
						{entry.error && (
							<div className="p-2 bg-red-100 border border-red-200 rounded text-red-700">
								{entry.error}
							</div>
						)}

						{/* 生成的图片预览 */}
						{entry.imageUrl && (
							<div className="space-y-1">
								<span className="text-muted-foreground">生成结果:</span>
								<div className="relative inline-block">
									<img
										src={entry.imageUrl}
										alt="生成结果"
										className="max-w-full max-h-40 rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
										onClick={(e) => {e.stopPropagation(); setPreviewImage(entry.imageUrl!);}}
									/>
									<button
										onClick={(e) => {e.stopPropagation(); handleDownload(entry.imageUrl!);}}
										className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
										title="下载"
									>
										<Download className="h-3 w-3"/>
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* 图片预览弹窗 */}
			{previewImage && (
				<div
					className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
					onClick={() => setPreviewImage(null)}
				>
					<div
						className="relative max-w-4xl max-h-[90vh] bg-card rounded-xl overflow-hidden shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<img src={previewImage} alt="预览" className="max-w-full max-h-[80vh] object-contain"/>
						<div className="absolute top-2 right-2 flex gap-2">
							<button
								onClick={() => handleDownload(previewImage)}
								className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
								title="下载"
							>
								<Download className="h-5 w-5"/>
							</button>
							<button
								onClick={() => setPreviewImage(null)}
								className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
								title="关闭"
							>
								<X className="h-5 w-5"/>
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export const LogsPanel: React.FC = () => {
	const [logs, setLogs] = useState<AILogEntry[]>([]);

	useEffect(() => {
		setLogs(aiLogService.getLogs());
		return aiLogService.subscribe(() => {
			setLogs(aiLogService.getLogs());
		});
	}, []);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">{logs.length} 条记录</span>
				{logs.length > 0 && (
					<button
						onClick={() => aiLogService.clearLogs()}
						className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
					>
						<Trash2 className="h-3 w-3"/>
						清空
					</button>
				)}
			</div>

			{logs.length === 0 ? (
				<div className="text-center py-12 text-sm text-muted-foreground">
					<Image className="h-8 w-8 mx-auto mb-2 opacity-30"/>
					暂无日志记录
				</div>
			) : (
				<div className="space-y-2 max-h-[65vh] overflow-y-auto">
					{logs.map(entry => (
						<LogItem key={entry.id} entry={entry}/>
					))}
				</div>
			)}
		</div>
	);
};
