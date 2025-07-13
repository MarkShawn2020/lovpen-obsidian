import React from 'react';
import {Check} from 'lucide-react';

interface ImageGridProps {
	images: string[];
	selectedImage?: string;
	onImageSelect: (imageUrl: string) => void;
	loading?: boolean;
	emptyMessage?: string;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
														images,
														selectedImage,
														onImageSelect,
														loading = false,
														emptyMessage = "暂无图片"
													}) => {
	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
			</div>
		);
	}

	if (images.length === 0) {
		return (
			<div className="flex items-center justify-center py-12 text-gray-500">
				<span className="text-sm">{emptyMessage}</span>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4">
			{images.map((imageUrl, index) => (
				<div
					key={index}
					onClick={() => onImageSelect(imageUrl)}
					className={`
						relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200
						${selectedImage === imageUrl
						? 'border-blue-500 shadow-lg'
						: 'border-gray-200 hover:border-blue-300 hover:shadow-md'
					}
					`}
				>
					<img
						src={imageUrl}
						alt={`图片 ${index + 1}`}
						className="w-full h-full object-cover"
						onError={(e) => {
							// 图片加载失败时的处理
							e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEw2MCA2MEw0MCA2MFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
						}}
					/>

					{/* 选中状态指示器 */}
					{selectedImage === imageUrl && (
						<div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
							<div className="bg-blue-500 rounded-full p-1">
								<Check className="h-4 w-4 text-white"/>
							</div>
						</div>
					)}

					{/* 图片序号 */}
					<div
						className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
						{index + 1}
					</div>
				</div>
			))}
		</div>
	);
};
