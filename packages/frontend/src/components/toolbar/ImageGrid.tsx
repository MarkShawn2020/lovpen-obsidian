import React, {useRef} from 'react';
import {Check, Plus, Loader2} from 'lucide-react';

interface ImageGridProps {
	images: string[];
	selectedImage?: string;
	onImageSelect: (imageUrl: string) => void;
	loading?: boolean;
	emptyMessage?: string;
	maxHeight?: string;
	// 传入后，第一个格子变为"新增图片"入口；disabled 时格子置灰并显示提示
	onUpload?: (files: FileList) => void | Promise<void>;
	uploadDisabled?: boolean;
	uploadDisabledMessage?: string;
	uploading?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
														images,
														selectedImage,
														onImageSelect,
														loading = false,
														emptyMessage = "暂无图片",
														onUpload,
														uploadDisabled = false,
														uploadDisabledMessage,
														uploading = false
													}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleUploadClick = () => {
		if (uploadDisabled || uploading) return;
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0 && onUpload) {
			await onUpload(files);
		}
		// 重置 input 以支持同一文件再次选择
		if (e.target) e.target.value = '';
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
			</div>
		);
	}

	// 无图 + 无上传入口时显示空状态
	if (images.length === 0 && !onUpload) {
		return (
			<div className="flex items-center justify-center py-12 text-gray-500">
				<span className="text-sm">{emptyMessage}</span>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4">
			{onUpload && (
				<>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleFileChange}
						className="hidden"
					/>
					<button
						type="button"
						onClick={handleUploadClick}
						disabled={uploadDisabled || uploading}
						title={uploadDisabled ? uploadDisabledMessage : '上传新图片'}
						className={`
							relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-200
							${uploadDisabled
								? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
								: uploading
									? 'border-primary bg-primary/5 text-primary cursor-wait'
									: 'border-gray-300 text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer'
							}
						`}
					>
						{uploading ? (
							<Loader2 className="h-6 w-6 animate-spin"/>
						) : (
							<Plus className="h-6 w-6"/>
						)}
						<span className="text-xs px-1 text-center leading-tight">
							{uploading ? '上传中...' : uploadDisabled ? (uploadDisabledMessage || '不可用') : '新增图片'}
						</span>
					</button>
				</>
			)}
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
