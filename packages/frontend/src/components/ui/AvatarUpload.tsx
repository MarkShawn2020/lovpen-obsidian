import React, {useState, useRef, useCallback} from 'react';
import {Upload, User, X, Check, Camera, Palette} from 'lucide-react';
import {AvatarConfig} from '../../types';

interface AvatarUploadProps {
	currentConfig?: AvatarConfig;
	userName?: string;
	onConfigChange: (config: AvatarConfig) => void;
	size?: 'sm' | 'md' | 'lg';
}

// 预设颜色组合
const PRESET_COLORS = [
	'from-[#D97757] to-[#CC785C]', // 主色调橙色
	'from-[#B49FD8] to-[#9B7BC7]', // 紫色
	'from-[#629A90] to-[#4A7C71]', // 青色
	'from-[#C2C07D] to-[#A8A65D]', // 橄榄色
	'from-[#97B5D5] to-[#7A9BC4]', // 天蓝色
	'from-[#D2BEDF] to-[#C4A9D1]', // 淡紫色
];

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
	currentConfig,
	userName,
	onConfigChange,
	size = 'md'
}) => {
	const [isUploading, setIsUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [showColorPicker, setShowColorPicker] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 根据尺寸设置样式
	const sizeClasses = {
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

	// 生成首字母头像
	const generateInitialsAvatar = useCallback((backgroundColor?: string) => {
		if (!userName?.trim()) {
			alert('请先设置用户名');
			return;
		}

		const initials = userName
			.trim()
			.split(' ')
			.map(word => word.charAt(0).toUpperCase())
			.slice(0, 2)
			.join('');

		if (!initials) {
			alert('无法从用户名生成首字母');
			return;
		}

		const newConfig: AvatarConfig = {
			type: 'initials',
			initials,
			backgroundColor: backgroundColor || 'from-[#D97757] to-[#CC785C]'
		};

		onConfigChange(newConfig);
	}, [userName, onConfigChange]);

	// 重置为默认头像
	const resetToDefault = useCallback(() => {
		const newConfig: AvatarConfig = {
			type: 'default'
		};
		onConfigChange(newConfig);
	}, [onConfigChange]);

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

	// 渲染当前头像预览
	const renderCurrentAvatar = () => {
		if (currentConfig?.type === 'uploaded' && currentConfig.data) {
			return (
				<img
					src={currentConfig.data}
					alt="当前头像"
					className={`${sizeClass} rounded-full object-cover border-4 border-white shadow-lg`}
				/>
			);
		}

		if (currentConfig?.type === 'initials' && currentConfig.initials) {
			const bgColor = currentConfig.backgroundColor || 'from-[#D97757] to-[#CC785C]';
			return (
				<div className={`${sizeClass} bg-gradient-to-br ${bgColor} rounded-full flex items-center justify-center border-4 border-white shadow-lg`}>
					<span className="text-white font-semibold text-lg">
						{currentConfig.initials}
					</span>
				</div>
			);
		}

		// 默认头像或自动生成的首字母
		if (userName?.trim()) {
			const initials = userName
				.trim()
				.split(' ')
				.map(word => word.charAt(0).toUpperCase())
				.slice(0, 2)
				.join('');
			
			if (initials) {
				return (
					<div className={`${sizeClass} bg-gradient-to-br from-[#D97757] to-[#CC785C] rounded-full flex items-center justify-center border-4 border-white shadow-lg`}>
						<span className="text-white font-semibold text-lg">
							{initials}
						</span>
					</div>
				);
			}
		}

		return (
			<div className={`${sizeClass} bg-gradient-to-br from-[#D97757] to-[#CC785C] rounded-full flex items-center justify-center border-4 border-white shadow-lg`}>
				<User className="h-8 w-8 text-white" />
			</div>
		);
	};

	return (
		<div className="space-y-6">
			{/* 头像预览区域 */}
			<div className="flex flex-col items-center space-y-4">
				<div className="relative">
					{renderCurrentAvatar()}
					
					{/* 上传中遮罩 */}
					{isUploading && (
						<div className={`absolute inset-0 ${sizeClass} rounded-full bg-black/50 flex items-center justify-center`}>
							<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						</div>
					)}
				</div>
			</div>

			{/* 上传区域 */}
			<div
				className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
					dragOver 
						? 'border-[#D97757] bg-[#F7F4EC]' 
						: 'border-[#E8E6DC] hover:border-[#D97757] hover:bg-[#F7F4EC]'
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
			>
				<Camera className="h-8 w-8 text-[#87867F] mx-auto mb-3" />
				<p className="text-sm font-medium text-[#181818] mb-1">
					点击上传或拖拽图片到此处
				</p>
				<p className="text-xs text-[#87867F]">
					支持 JPG、PNG、GIF、WebP，最大 5MB
				</p>
				
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) {
							handleFileUpload(file);
						}
					}}
					className="hidden"
				/>
			</div>

			{/* 操作按钮 */}
			<div className="flex flex-wrap gap-3">
				<button
					onClick={() => setShowColorPicker(!showColorPicker)}
					className="inline-flex items-center gap-2 px-4 py-2 bg-[#B49FD8] text-white rounded-xl font-medium text-sm transition-all hover:bg-[#9B7BC7] focus:outline-none focus:ring-2 focus:ring-[#B49FD8]"
				>
					<Palette className="h-4 w-4" />
					首字母头像
				</button>

				<button
					onClick={resetToDefault}
					className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-[#87867F] text-[#181818] rounded-xl font-medium text-sm transition-all hover:bg-[#F0EEE6] focus:outline-none focus:ring-2 focus:ring-[#87867F]"
				>
					<X className="h-4 w-4" />
					重置默认
				</button>
			</div>

			{/* 颜色选择器 */}
			{showColorPicker && (
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-4">
					<h4 className="text-sm font-medium text-[#181818] mb-3">选择背景颜色</h4>
					<div className="grid grid-cols-3 gap-3">
						{PRESET_COLORS.map((color, index) => (
							<button
								key={index}
								onClick={() => {
									generateInitialsAvatar(color);
									setShowColorPicker(false);
								}}
								className={`w-12 h-12 bg-gradient-to-br ${color} rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform`}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};