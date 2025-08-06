import React from "react";
import {createRoot, Root} from "react-dom/client";
import {LovpenReact} from "./components/LovpenReact";
import {type LovpenReactLib, LovpenReactProps} from "./types";
import {JotaiProvider} from "./providers/JotaiProvider";
import "./index.css";

// Store for managing React roots
const rootStore = new Map<HTMLElement, Root>();

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

		root.render(
			<JotaiProvider>
				<LovpenReact {...props} />
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
			if (root) {
				root.render(
					<JotaiProvider>
						<LovpenReact {...props} />
					</JotaiProvider>
				);
				// 使用多个requestAnimationFrame确保React的useEffect完全执行完毕
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						// 调用CSS变量更新
						props.onUpdateCSSVariables();
						resolve();
					});
				});
			} else {
				// If no root exists, create one
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
