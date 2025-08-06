import React, { useState, useEffect } from "react";
import {createRoot, Root} from "react-dom/client";
import {LovpenReact} from "./components/LovpenReact";
import {type LovpenReactLib, LovpenReactProps} from "./types";
import {JotaiProvider} from "./providers/JotaiProvider";
import "./index.css";

// Store for managing React roots
const rootStore = new Map<HTMLElement, Root>();

// Wrapper component to manage props updates without remounting JotaiProvider
const LovpenReactWrapper: React.FC<{ initialProps: LovpenReactProps; container?: HTMLElement }> = ({ initialProps, container }) => {
	const [props, setProps] = useState(initialProps);
	
	// Expose update function to parent
	useEffect(() => {
		if (container) {
			(container as any).__updateProps = setProps;
		}
	}, [container]);
	
	return <LovpenReact {...props} />;
};

// Library implementation
const LovpenReactLib: LovpenReactLib = {
	mount: (container: HTMLElement, props: LovpenReactProps) => {
		// Clean up existing root if any
		if (rootStore.has(container)) {
			LovpenReactLib.unmount(container);
		}

		// Create new root and render component
		const root = createRoot(container);
		rootStore.set(container, root);
		
		// Store props for updates
		(container as any).__lovpenProps = props;

		root.render(
			<JotaiProvider>
				<LovpenReactWrapper initialProps={props} container={container} />
			</JotaiProvider>
		);
	},

	unmount: (container: HTMLElement) => {
		const root = rootStore.get(container);
		if (root) {
			root.unmount();
			rootStore.delete(container);
		}
	},

	update: (container: HTMLElement, props: LovpenReactProps) => {
		return new Promise<void>((resolve) => {
			const root = rootStore.get(container);
			
			// Store new props
			(container as any).__lovpenProps = props;
			
			if (root && (container as any).__updateProps) {
				// Update props without remounting JotaiProvider
				(container as any).__updateProps(props);
				// 使用多个requestAnimationFrame确保React的useEffect完全执行完毕
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						// 调用CSS变量更新
						props.onUpdateCSSVariables();
						resolve();
					});
				});
			} else {
				// If no root exists or update function not available, remount
				LovpenReactLib.mount(container, props);
				resolve();
			}
		});
	}
};

// Export for UMD build
if (typeof window !== 'undefined') {
	(window as any).LovpenReactLib = LovpenReactLib;
}

// Export for ES modules
export {LovpenReactLib as default, LovpenReact};
export type {LovpenReactProps, LovpenReactLib};
