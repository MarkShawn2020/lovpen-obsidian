import React from 'react';
import {User} from 'lucide-react';
import {AvatarConfig} from '../../types';

interface AvatarPreviewProps {
	config?: AvatarConfig;
	userName?: string;
	size?: 'xs' | 'sm' | 'md' | 'lg';
	className?: string;
}

const sizeClasses = {
	xs: 'w-8 h-8',
	sm: 'w-10 h-10',
	md: 'w-16 h-16',
	lg: 'w-24 h-24'
};

const iconSizes = {
	xs: 'h-4 w-4',
	sm: 'h-5 w-5',
	md: 'h-6 w-6',
	lg: 'h-8 w-8'
};

const textSizes = {
	xs: 'text-xs',
	sm: 'text-sm',
	md: 'text-base',
	lg: 'text-lg'
};

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
	config,
	userName,
	size = 'sm',
	className = ''
}) => {
	const sizeClass = sizeClasses[size];
	const iconSize = iconSizes[size];
	const textSize = textSizes[size];

	// 上传的图片
	if (config?.type === 'uploaded' && config.data) {
		return (
			<img
				src={config.data}
				alt="头像"
				className={`${sizeClass} rounded-full object-cover ${className}`}
			/>
		);
	}

	// 首字母头像
	if (config?.type === 'initials' && config.initials) {
		const bgColor = config.backgroundColor || 'from-[#D97757] to-[#CC785C]';
		return (
			<div className={`${sizeClass} bg-gradient-to-br ${bgColor} rounded-full flex items-center justify-center ${className}`}>
				<span className={`text-white font-semibold ${textSize}`}>
					{config.initials}
				</span>
			</div>
		);
	}

	// 从用户名生成首字母
	if (userName?.trim()) {
		const initials = userName
			.trim()
			.split(' ')
			.map(word => word.charAt(0).toUpperCase())
			.slice(0, 2)
			.join('');

		if (initials) {
			return (
				<div className={`${sizeClass} bg-gradient-to-br from-[#D97757] to-[#CC785C] rounded-full flex items-center justify-center ${className}`}>
					<span className={`text-white font-semibold ${textSize}`}>
						{initials}
					</span>
				</div>
			);
		}
	}

	// 默认头像
	return (
		<div className={`${sizeClass} bg-[#F7F4EC] rounded-full flex items-center justify-center ${className}`}>
			<User className={`${iconSize} text-[#87867F]`} />
		</div>
	);
};
