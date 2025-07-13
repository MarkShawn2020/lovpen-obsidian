import React from 'react';
import {CoverData} from './cover/types';
import {Edit2, Plus, Trash2, X} from 'lucide-react';

interface CoverCardProps {
	coverData?: CoverData;
	aspectRatio: number;
	label: string;
	placeholder: string;
	isGenerating?: boolean;
	generationProgress?: number;
	onClick: () => void;
	onClear?: () => void;
}

export const CoverCard: React.FC<CoverCardProps> = ({
	coverData,
	aspectRatio,
	label,
	placeholder,
	isGenerating = false,
	generationProgress = 0,
	onClick,
	onClear
}) => {
	const isEmpty = !coverData;
	
	// 计算容器样式
	const containerStyle = {
		aspectRatio: aspectRatio.toString(),
	};

	return (
		<div className="relative group">
			{/* 标签 */}
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
				{!isEmpty && onClear && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onClear();
						}}
						className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-md"
						title="删除封面"
					>
						<Trash2 className="h-3 w-3 text-red-500"/>
					</button>
				)}
			</div>

			{/* 主体卡片 */}
			<div
				style={containerStyle}
				onClick={onClick}
				className={`
					relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200
					${isEmpty 
						? 'border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50' 
						: 'border-solid border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-md'
					}
					${isGenerating ? 'pointer-events-none' : ''}
				`}
			>
				{isEmpty ? (
					// 空状态
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2"/>
						<span className="text-xs sm:text-sm text-gray-500 text-center px-2">
							{placeholder}
						</span>
					</div>
				) : isGenerating ? (
					// 生成中状态
					<div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
						<div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
						<div className="w-3/4 bg-gray-200 rounded-full h-2 mb-2">
							<div 
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{width: `${generationProgress}%`}}
							></div>
						</div>
						<span className="text-xs text-gray-600">生成中...</span>
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
						<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
							<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 text-white">
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