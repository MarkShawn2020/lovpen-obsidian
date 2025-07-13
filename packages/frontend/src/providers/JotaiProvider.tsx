import React from 'react';
import {Provider} from 'jotai';

interface JotaiProviderProps {
	children: React.ReactNode;
}

export const JotaiProvider: React.FC<JotaiProviderProps> = ({children}) => {
	return <Provider>{children}</Provider>;
};
