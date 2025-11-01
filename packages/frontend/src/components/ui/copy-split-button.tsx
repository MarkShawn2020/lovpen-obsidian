import React, {useState} from 'react';
import {Button} from './button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './select';

export interface CopyOption {
	id: string;
	name: string;
	description: string;
	icon: string;
}

interface CopySplitButtonProps {
	onCopy: (option: CopyOption) => void;
	currentOption?: CopyOption;
	className?: string;
}

// 预设的复制选项
export const COPY_OPTIONS: CopyOption[] = [
	{
		id: 'wechat',
		name: '微信公众号',
		description: '复制为适合微信公众号的格式',
		icon: '📱',
	},
	{
		id: 'html',
		name: 'HTML格式',
		description: '复制为标准HTML格式',
		icon: '📄',
	},
	{
		id: 'image',
		name: '图片',
		description: '生成并复制为图片',
		icon: '🖼️',
	},
	{
		id: 'zhihu',
		name: '知乎',
		description: '复制为适合知乎的格式',
		icon: '🎓',
	},
	{
		id: 'xiaohongshu',
		name: '小红书',
		description: '复制为适合小红书的格式',
		icon: '📕',
	},
];

export const CopySplitButton: React.FC<CopySplitButtonProps> = ({
	onCopy,
	currentOption,
	className = ''
}) => {
	const [selectedOption, setSelectedOption] = useState<CopyOption>(currentOption || COPY_OPTIONS[0]);

	const handleMainClick = () => {
		onCopy(selectedOption);
	};

	const handleValueChange = (value: string) => {
		const option = COPY_OPTIONS.find(o => o.id === value);
		if (option) {
			setSelectedOption(option);
			onCopy(option);
		}
	};

	return (
		<div className={`flex ${className}`}>
			{/* 主复制按钮 */}
			<Button
				onClick={handleMainClick}
				size="sm"
				className="rounded-r-none border-r-0 bg-white/60 backdrop-blur-sm border border-[#E8E6DC]/50 text-[#87867F]/70 transition-all hover:bg-[#D97757] hover:text-white hover:scale-105 hover:shadow-md hover:border-[#D97757] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 focus:ring-offset-2"
				title={`复制到${selectedOption.name}`}
			>
				<span className="mr-1.5">{selectedOption.icon}</span>
				复制
			</Button>

			{/* Select 下拉菜单 */}
			<Select value="" onValueChange={handleValueChange}>
				<SelectTrigger
					size="sm"
					className="w-8 rounded-l-none px-1 border-l-0 bg-white/60 backdrop-blur-sm border border-[#E8E6DC]/50 text-[#87867F]/70 hover:bg-[#D97757] hover:text-white hover:border-[#D97757]"
				>
					<SelectValue/>
				</SelectTrigger>
				<SelectContent align="end" className="w-72">
					{COPY_OPTIONS.map((option) => (
						<SelectItem key={option.id} value={option.id}>
							<div className="flex items-start gap-3 py-1">
								<span className="text-lg flex-shrink-0">{option.icon}</span>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium text-gray-900 text-sm">{option.name}</span>
										{selectedOption.id === option.id && (
											<span className="inline-block w-2 h-2 bg-[#D97757] rounded-full flex-shrink-0"></span>
										)}
									</div>
									<div className="text-xs text-gray-500 leading-relaxed">
										{option.description}
									</div>
								</div>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
