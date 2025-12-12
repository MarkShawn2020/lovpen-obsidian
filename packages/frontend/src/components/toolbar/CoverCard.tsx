import React from 'react';
import {CoverData} from './CoverData';
import {Edit2, Plus, Trash2} from 'lucide-react';

interface CoverCardProps {
	coverData?: CoverData;
	aspectRatio: number;
	label: string;
	placeholder: string;
	isGenerating?: boolean;
	generationProgress?: number;
	onClick: () => void;
	onClear?: () => void;
	fillHeight?: boolean;  // 填充父容器高度而不是用 aspectRatio
}

export const CoverCard: React.FC<CoverCardProps> = ({
														coverData,
														aspectRatio,
														label,
														placeholder,
														isGenerating = false,
														generationProgress = 0,
														onClick,
														onClear,
														fillHeight = false
													}) => {
	const isEmpty = !coverData || !coverData.imageUrl;

	// 计算容器样式
	const containerStyle = fillHeight ? {} : {aspectRatio: aspectRatio.toString()};

	return (
		<div className={`relative group w-full ${fillHeight ? 'h-full flex flex-col' : ''}`}>
			{/* 标签 */}
			<div className="flex items-center justify-between gap-2 mb-2 min-h-[20px]">
				<span className="text-xs sm:text-sm font-medium text-foreground truncate">{label}</span>
				{!isEmpty && onClear && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onClear();
						}}
						className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-md"
						title="删除封面"
					>
						<Trash2 className="h-3 w-3 text-destructive"/>
					</button>
				)}
			</div>

			{/* 主体卡片 */}
			<div
				style={containerStyle}
				onClick={onClick}
				className={`
					relative w-full border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 z-10
					${fillHeight ? 'flex-1' : ''}
					${isEmpty
					? 'border-dashed border-border hover:border-primary bg-muted hover:bg-accent'
					: 'border-solid border-border hover:border-primary shadow-sm hover:shadow-md'
				}
					${isGenerating ? 'pointer-events-none' : 'pointer-events-auto'}
				`}
			>
				{isEmpty ? (
					// 空状态
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2"/>
						<span className="text-xs sm:text-sm text-muted-foreground text-center px-2">
							{placeholder}
						</span>
					</div>
				) : isGenerating ? (
					// 生成中状态
					<div className="absolute inset-0 bg-muted flex flex-col items-center justify-center">
						<div
							className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
						<div className="w-3/4 bg-secondary rounded-full h-2 mb-2">
							<div
								className="bg-primary h-2 rounded-full transition-all duration-300"
								style={{width: `${generationProgress}%`}}
							></div>
						</div>
						<span className="text-xs text-muted-foreground">生成中...</span>
					</div>
				) : (
					// 有封面状态
					<>
						<img
							src={coverData.imageUrl}
							alt={coverData.title || '封面'}
							className="w-full h-full object-cover"
						/>

						{/* 悬停遮罩 */}
						<div
							className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
							<div
								className="bg-black bg-opacity-50 rounded-full px-3 py-2 flex items-center gap-2 text-white">
								<Edit2 className="h-4 w-4"/>
								<span className="text-sm font-medium hidden sm:inline">点击更换</span>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
