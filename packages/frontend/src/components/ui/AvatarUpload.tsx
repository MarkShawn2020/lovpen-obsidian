import React, {useState, useRef, useCallback} from 'react';
import {Camera} from 'lucide-react';
import {AvatarConfig} from '../../types';
import {AvatarPreview} from './AvatarPreview';

interface AvatarUploadProps {
	currentConfig?: AvatarConfig;
	userName?: string;
	onConfigChange: (config: AvatarConfig) => void;
	size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
	currentConfig,
	userName,
	onConfigChange,
	size = 'md'
}) => {
	const [isUploading, setIsUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 根据尺寸设置样式
	const sizeClasses = {
		xs: 'w-10 h-10',
		sm: 'w-16 h-16',
		md: 'w-24 h-24',
		lg: 'w-32 h-32'
	};

	const sizeClass = sizeClasses[size];

	// 压缩图片到指定大小
	const compressImage = useCallback((file: File, maxSize: number = 200, quality: number = 0.8): Promise<string> => {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const img = new Image();

			img.onload = () => {
				// 设置画布尺寸为正方形
				canvas.width = maxSize;
				canvas.height = maxSize;

				// 计算居中裁剪的坐标
				const minDimension = Math.min(img.width, img.height);
				const x = (img.width - minDimension) / 2;
				const y = (img.height - minDimension) / 2;

				// 绘制裁剪后的图片
				ctx?.drawImage(img, x, y, minDimension, minDimension, 0, 0, maxSize, maxSize);

				// 转换为base64，控制文件大小
				const compressAndCheck = (currentQuality: number): string => {
					const dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
					
					// 检查文件大小（base64 长度约等于文件大小 * 1.37）
					const sizeInKB = (dataUrl.length * 0.75) / 1024;
					
					// 如果文件过大且质量还能降低，则递归压缩
					if (sizeInKB > 100 && currentQuality > 0.1) {
						return compressAndCheck(currentQuality - 0.1);
					}
					
					return dataUrl;
				};

				resolve(compressAndCheck(quality));
			};

			img.onerror = () => reject(new Error('图片加载失败'));
			img.src = URL.createObjectURL(file);
		});
	}, []);

	// 处理文件上传
	const handleFileUpload = useCallback(async (file: File) => {
		// 验证文件类型
		if (!file.type.startsWith('image/')) {
			alert('请选择图片文件');
			return;
		}

		// 验证文件大小（5MB 限制）
		if (file.size > 5 * 1024 * 1024) {
			alert('图片文件不能超过 5MB');
			return;
		}

		setIsUploading(true);

		try {
			const compressedDataUrl = await compressImage(file);
			
			const newConfig: AvatarConfig = {
				type: 'uploaded',
				data: compressedDataUrl
			};

			onConfigChange(newConfig);
		} catch (error) {
			console.error('图片处理失败:', error);
			alert('图片处理失败，请重试');
		} finally {
			setIsUploading(false);
		}
	}, [compressImage, onConfigChange]);

	// 拖拽处理
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFileUpload(files[0]);
		}
	}, [handleFileUpload]);

	return (
		<div className="relative inline-block">
			{/* 头像 - 可点击上传 */}
			<div
				className={`relative cursor-pointer group ${
					dragOver ? 'ring-2 ring-[#D97757]' : ''
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
			>
				<AvatarPreview
					config={currentConfig}
					userName={userName}
					size={size}
					className="border-4 border-white shadow-lg"
				/>

				{/* hover 遮罩 */}
				<div className={`absolute inset-0 ${sizeClass} rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
					<Camera className="h-5 w-5 text-white" />
				</div>

				{/* 上传中遮罩 */}
				{isUploading && (
					<div className={`absolute inset-0 ${sizeClass} rounded-full bg-black/50 flex items-center justify-center`}>
						<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					</div>
				)}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) handleFileUpload(file);
				}}
				className="hidden"
			/>
		</div>
	);
};