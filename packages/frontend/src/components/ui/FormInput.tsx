import React from 'react';
import { LucideIcon } from 'lucide-react';
import {logger} from "@lovpen/shared";
import {Input} from "@/components/ui/input";

interface FormInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: 'text' | 'email' | 'url' | 'password';
	required?: boolean;
	icon?: LucideIcon;
	className?: string;
	containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
	label,
	value,
	onChange,
	placeholder,
	type = 'text',
	required = false,
	icon: Icon,
	className = '',
	containerClassName = ''
}) => {
	logger.info(`[FormInput] label: ${label}, icon exists: ${!!Icon}, icon name: ${Icon?.name || 'none'}`)
	return (
		<div className={`space-y-2 ${containerClassName}`}>
			<label className="block text-sm font-medium text-gray-700">
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<div className="relative">
				{Icon && (
					<Icon 
						className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" 
					/>
				)}
				<Input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className={`w-full ${Icon ? 'pl-12' : 'pl-3'} pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 transition-colors ${className}`}
					style={Icon ? { paddingLeft: '3rem' } : undefined}
				/>
			</div>
		</div>
	);
};
