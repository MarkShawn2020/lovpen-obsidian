import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

interface ShadowRootContextValue {
	/** Shadow root 容器，Radix Portal 渲染目标 */
	portalContainer: HTMLElement | null;
	/** 是否在 Shadow DOM 环境中 */
	isShadowDom: boolean;
}

const ShadowRootContext = createContext<ShadowRootContextValue>({
	portalContainer: null,
	isShadowDom: false,
});

export const useShadowRoot = () => useContext(ShadowRootContext);

interface ShadowRootProviderProps {
	children: React.ReactNode;
	/** 外部传入的 portal 容器（在 Shadow DOM 中使用） */
	portalContainer?: HTMLElement | null;
}

/**
 * Shadow Root Provider
 *
 * 为 Radix UI 组件提供正确的 Portal 容器。
 * - 在 Shadow DOM 环境中，Portal 渲染到 Shadow Root 内的容器
 * - 在普通 DOM 环境中（Web 端），Portal 渲染到 document.body
 */
export const ShadowRootProvider: React.FC<ShadowRootProviderProps> = ({
	children,
	portalContainer: externalContainer,
}) => {
	const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (externalContainer) {
			// 使用外部传入的容器（Shadow DOM 环境）
			setPortalContainer(externalContainer);
		} else if (containerRef.current) {
			// 创建内部容器（普通 DOM 环境）
			setPortalContainer(containerRef.current);
		}
	}, [externalContainer]);

	const value: ShadowRootContextValue = {
		portalContainer,
		isShadowDom: !!externalContainer,
	};

	return (
		<ShadowRootContext.Provider value={value}>
			{!externalContainer && (
				<div
					ref={containerRef}
					id="lovpen-portal-container"
					style={{ position: 'relative', zIndex: 9999 }}
				/>
			)}
			{children}
		</ShadowRootContext.Provider>
	);
};
