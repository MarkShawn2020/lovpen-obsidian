import React from 'react';

interface TabsProps {
	value: string;
	onValueChange: (value: string) => void;
	children: React.ReactNode;
}

interface TabsListProps {
	children: React.ReactNode;
	className?: string;
}

interface TabsTriggerProps {
	value: string;
	children: React.ReactNode;
	disabled?: boolean;
	className?: string;
}

interface TabsContentProps {
	value: string;
	children: React.ReactNode;
	className?: string;
}

const TabsContext = React.createContext<{
	value: string;
	onValueChange: (value: string) => void;
} | null>(null);

export const Tabs: React.FC<TabsProps> = ({value, onValueChange, children}) => {
	return (
		<TabsContext.Provider value={{value, onValueChange}}>
			<div className="w-full">
				{children}
			</div>
		</TabsContext.Provider>
	);
};

export const TabsList: React.FC<TabsListProps & { style?: React.CSSProperties }> = ({children, className, style}) => {
	return (
		<div
			className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 w-full ${className || ''}`}
			style={style}
		>
			{children}
		</div>
	);
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({value, children, disabled = false, className}) => {
	const context = React.useContext(TabsContext);
	if (!context) {
		throw new Error('TabsTrigger must be used within Tabs');
	}

	const {value: selectedValue, onValueChange} = context;
	const isSelected = selectedValue === value;

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={() => onValueChange(value)}
			className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-0 flex-shrink ${
				isSelected
					? 'bg-white text-gray-950 shadow-sm'
					: 'text-gray-600 hover:bg-gray-200'
			} ${className || ''}`}
			style={{
				flex: '1 1 0',
				minWidth: '60px',
				maxWidth: '120px'
			}}
		>
			{children}
		</button>
	);
};

export const TabsContent: React.FC<TabsContentProps> = ({value, children, className}) => {
	const context = React.useContext(TabsContext);
	if (!context) {
		throw new Error('TabsContent must be used within Tabs');
	}

	const {value: selectedValue} = context;

	if (selectedValue !== value) {
		return null;
	}

	return (
		<div
			className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${className || ''}`}>
			{children}
		</div>
	);
};
