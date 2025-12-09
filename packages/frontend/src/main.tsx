import React, { useState, useEffect } from "react";
import {createRoot, Root} from "react-dom/client";
import {LovpenReactBridge} from "./components/LovpenReactBridge";
import {type LovpenReactLib, LovpenReactProps, ShadowMountOptions} from "./types";
import {JotaiProvider} from "./providers/JotaiProvider";
import "./index.css";

// Store for managing React roots
const rootStore = new Map<HTMLElement, Root>();

// Wrapper component to manage props updates without remounting JotaiProvider
const LovpenReactWrapper: React.FC<{
	initialProps: LovpenReactProps;
	container?: HTMLElement;
	portalContainer?: HTMLElement | null;
}> = ({ initialProps, container, portalContainer }) => {
	const [props, setProps] = useState(initialProps);

	// Expose update function to parent
	useEffect(() => {
		if (container) {
			(container as any).__updateProps = setProps;
		}
	}, [container]);

	return <LovpenReactBridge {...props} />;
};

// Library implementation
const LovpenReactLib: LovpenReactLib = {
	mount: (container: HTMLElement, props: LovpenReactProps, options?: ShadowMountOptions) => {
		console.log("[LovpenReactLib] mount() called", {
			container: container?.id,
			hasShadowRoot: !!options?.shadowRoot,
			hasProps: !!props
		});

		// Clean up existing root if any
		if (rootStore.has(container)) {
			LovpenReactLib.unmount(container);
		}

		// Determine the actual mount target
		let mountTarget: HTMLElement = container;
		let portalContainer: HTMLElement | null = null;

		if (options?.shadowRoot) {
			console.log("[LovpenReactLib] Shadow DOM mode - creating containers");
			// Shadow DOM mode: create mount container inside shadow root
			const shadowContainer = document.createElement('div');
			shadowContainer.id = 'lovpen-shadow-mount';

			// 🔑 使用内联样式直接设置，确保最高优先级
			// CSS 变量会穿透 Shadow DOM，所以必须在这里显式覆盖
			shadowContainer.style.cssText = `
				width: 100%;
				height: 100%;
				background-color: #ffffff !important;
				color: #1a1a1a !important;
				--background: #ffffff;
				--foreground: #1a1a1a;
				--background-primary: #ffffff;
				--background-secondary: #fafafa;
				--text-normal: #1a1a1a;
				--text-muted: #737373;
				--card: #ffffff;
				--card-foreground: #1a1a1a;
				--popover: #ffffff;
				--popover-foreground: #1a1a1a;
				--primary: #2d2d2d;
				--primary-foreground: #fafafa;
				--secondary: #f5f5f5;
				--secondary-foreground: #2d2d2d;
				--muted: #f5f5f5;
				--muted-foreground: #737373;
				--accent: #f5f5f5;
				--accent-foreground: #2d2d2d;
				--destructive: #dc2626;
				--border: #e5e5e5;
				--input: #e5e5e5;
				--ring: #a3a3a3;
				--radius: 0.625rem;
			`;

			options.shadowRoot.appendChild(shadowContainer);
			mountTarget = shadowContainer;

			// Create portal container for Radix UI
			const portalDiv = document.createElement('div');
			portalDiv.id = 'lovpen-portal-root';
			portalDiv.style.position = 'relative';
			portalDiv.style.zIndex = '9999';
			options.shadowRoot.appendChild(portalDiv);
			portalContainer = options.portalContainer || portalDiv;

			// Inject styles into shadow root
			if (options.styles) {
				for (const css of options.styles) {
					const style = document.createElement('style');
					style.textContent = css;
					options.shadowRoot.appendChild(style);
				}
			}
		}

		// Create new root and render component
		const root = createRoot(mountTarget);
		rootStore.set(container, root);

		// Store props, shadow info, and options for updates/remounts
		(container as any).__lovpenProps = props;
		(container as any).__shadowRoot = options?.shadowRoot;
		(container as any).__portalContainer = portalContainer;
		(container as any).__shadowOptions = options;

		console.log("[LovpenReactLib] Rendering to mountTarget", {
			mountTargetId: mountTarget.id,
			portalContainerId: portalContainer?.id
		});

		try {
			root.render(
				<JotaiProvider portalContainer={portalContainer}>
					<LovpenReactWrapper
						initialProps={props}
						container={container}
						portalContainer={portalContainer}
					/>
				</JotaiProvider>
			);
			console.log("[LovpenReactLib] render() completed successfully");
		} catch (error) {
			console.error("[LovpenReactLib] render() failed:", error);
		}
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
				// If no root exists or update function not available, remount with stored options
				const storedOptions = (container as any).__shadowOptions;
				LovpenReactLib.mount(container, props, storedOptions);
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
export {LovpenReactLib as default, LovpenReactBridge};
export type {LovpenReactProps, LovpenReactLib};
