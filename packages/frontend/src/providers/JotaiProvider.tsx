import React from 'react';
import {Provider} from 'jotai';
import {ShadowRootProvider} from './ShadowRootProvider';

interface JotaiProviderProps {
	children: React.ReactNode;
	/** Portal 容器（Shadow DOM 环境使用） */
	portalContainer?: HTMLElement | null;
}

export const JotaiProvider: React.FC<JotaiProviderProps> = ({children, portalContainer}) => {
	return (
		<Provider>
			<ShadowRootProvider portalContainer={portalContainer}>
				{children}
			</ShadowRootProvider>
		</Provider>
	);
};
