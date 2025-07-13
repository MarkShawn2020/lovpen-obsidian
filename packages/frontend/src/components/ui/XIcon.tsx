import React from 'react';

interface XIconProps {
	className?: string;
}

export const XIcon: React.FC<XIconProps> = ({className = "w-3 h-3"}) => {
	return (
		<svg
			className={className}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			width="12"
			height="12"
			style={{width: '12px', height: '12px', minWidth: '12px', flexShrink: 0}}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	);
};
