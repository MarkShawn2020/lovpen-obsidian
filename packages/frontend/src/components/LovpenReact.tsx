import React, {useCallback, useEffect, useRef, useState} from "react";
import {LovpenReactProps} from "../types";
import {Toolbar} from "./toolbar/Toolbar";
import {useSetAtom, useAtomValue} from "jotai";
import {initializeSettingsAtom, settingsAtom} from "../store/atoms";
import {articleHTMLAtom, cssContentAtom} from "../store/contentAtoms";
import {HMRTest} from "./HMRTest";
import {ArticleRenderer} from "./ArticleRenderer";
import {ScrollContainer} from "./ScrollContainer";
import {domUpdater} from "../utils/domUpdater";
import {CopySplitButton, CopyOption} from "./ui/copy-split-button";
import {Avatar, AvatarFallback, AvatarImage} from "./ui/avatar";
import packageJson from "../../package.json";
import {applyCodeBlockScale, findScreenshotElement} from "@lovpen/shared";

import {logger} from "../../../shared/src/logger";

export const LovpenReact: React.FC<LovpenReactProps> = (props) => {
	const {
		settings,
		plugins,
		articleHTML: propsArticleHTML,
		cssContent: propsCssContent,
		onRefresh,
		onCopy,
		onDistribute,
		onTemplateChange,
		onThemeChange,
		onHighlightChange,
		onThemeColorToggle,
		onThemeColorChange,
		onRenderArticle,
		onSaveSettings,
		onUpdateCSSVariables,
		onPluginToggle,
		onPluginConfigChange,
		onExpandedSectionsChange,
		onArticleInfoChange,
		onPersonalInfoChange,
		onSettingsChange,
		onWidthChange
	} = props;
	
	// 从atom读取频繁变化的数据，如果atom为空则使用props的值
	const atomArticleHTML = useAtomValue(articleHTMLAtom);
	const atomCssContent = useAtomValue(cssContentAtom);
	const atomSettings = useAtomValue(settingsAtom);

	// 使用atom值或props值作为fallback
	const articleHTML = atomArticleHTML || propsArticleHTML;
	const cssContent = atomCssContent || propsCssContent;
	
	const initializeSettings = useSetAtom(initializeSettingsAtom);
	const isInitializedRef = useRef(false);

	// 工具栏宽度状态 - 从localStorage恢复或使用默认宽度
	const [toolbarWidth, setToolbarWidth] = useState<string>(() => {
		try {
			return localStorage.getItem('lovpen-toolbar-width') || "420px";
		} catch {
			return "420px";
		}
	});

	// Toolbar 自动隐藏状态（基于空间不足）
	const [isToolbarAutoHidden, setIsToolbarAutoHidden] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Toolbar 当前 tab 状态（用于头像点击切换到设置）
	const [toolbarActiveTab, setToolbarActiveTab] = useState<string | undefined>(undefined);

	// 代码块缩放预览的恢复函数
	const codeBlockScaleRestoreRef = useRef<(() => void) | null>(null);
	// 内容容器的 ref
	const contentContainerRef = useRef<HTMLDivElement>(null);

	// 初始化Jotai状态 - 只初始化一次
	useEffect(() => {
		if (!isInitializedRef.current && settings) {
			const personalInfo = settings.personalInfo || {
				name: '',
				avatar: { type: 'default' },
				bio: '',
				email: '',
				website: ''
			};

			initializeSettings({
				settings,
				personalInfo
			});


			isInitializedRef.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // 只在组件挂载时执行

	// 监听代码块缩放设置变化，实时应用/恢复缩放效果
	useEffect(() => {
		const shouldScale = atomSettings.scaleCodeBlockInImage ?? true;
		const container = contentContainerRef.current;

		if (!container) return;

		// 先恢复之前的缩放
		if (codeBlockScaleRestoreRef.current) {
			codeBlockScaleRestoreRef.current();
			codeBlockScaleRestoreRef.current = null;
		}

		// 如果启用缩放，应用缩放效果
		if (shouldScale) {
			const result = findScreenshotElement(container);
			if (result) {
				const { restore } = applyCodeBlockScale(result.element);
				codeBlockScaleRestoreRef.current = restore;
				logger.debug('[LovpenReact] 已应用代码块缩放预览');
			}
		} else {
			logger.debug('[LovpenReact] 已关闭代码块缩放预览');
		}

		// 组件卸载时恢复
		return () => {
			if (codeBlockScaleRestoreRef.current) {
				codeBlockScaleRestoreRef.current();
				codeBlockScaleRestoreRef.current = null;
			}
		};
	}, [atomSettings.scaleCodeBlockInImage, articleHTML]); // 当设置或文章内容变化时重新计算

	// 监听容器宽度变化，自动隐藏/显示 Toolbar（保证 Renderer 始终可见）
	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			console.warn('[LovpenReact] containerRef.current is null, cannot observe width');
			return;
		}

		console.log('[LovpenReact] ResizeObserver 已设置, onWidthChange:', typeof onWidthChange);

		let widthChangeTimer: NodeJS.Timeout | null = null;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const containerWidth = entry.contentRect.width;
				console.log('[LovpenReact] ResizeObserver fired, width:', containerWidth);

				// 计算 A(渲染器) 的实际宽度
				// A_width = C_width - B_width - resizer_width
				const rendererMinWidth = 320; // A 的最小宽度要求
				const toolbarWidthNum = parseInt(toolbarWidth) || 420; // B 的实际宽度
				const resizerWidth = 6;
				const calculatedRendererWidth = containerWidth - toolbarWidthNum - resizerWidth;

				// 如果 A 的计算宽度 < 320px，则隐藏 B，让 A 占满整个 C
				const shouldHideToolbar = calculatedRendererWidth < rendererMinWidth;

				setIsToolbarAutoHidden(shouldHideToolbar);

				// 调用 width change callback (with debouncing)
				if (onWidthChange) {
					if (widthChangeTimer) {
						clearTimeout(widthChangeTimer);
					}
					widthChangeTimer = setTimeout(() => {
						console.log(`[LovpenReact] 调用 onWidthChange: ${containerWidth}px`);
						logger.info(`[LovpenReact] 容器宽度变化: ${containerWidth}px`);
						onWidthChange(containerWidth);
					}, 200); // 200ms debounce
				} else {
					console.warn('[LovpenReact] onWidthChange is undefined, skipping callback');
				}
			}
		});

		resizeObserver.observe(container);

		return () => {
			if (widthChangeTimer) {
				clearTimeout(widthChangeTimer);
			}
			resizeObserver.disconnect();
		};
	}, [toolbarWidth, onWidthChange]);

	// 提取 Toolbar props，避免重复代码
	const toolbarProps = {
		settings,
		plugins,
		articleHTML,
		onRefresh,
		onCopy,
		onDistribute,
		onTemplateChange,
		onThemeChange,
		onHighlightChange,
		onThemeColorToggle,
		onThemeColorChange,
		onRenderArticle,
		onSaveSettings,
		onPluginToggle,
		onPluginConfigChange,
		onExpandedSectionsChange,
		onArticleInfoChange,
		onPersonalInfoChange,
		onSettingsChange,
		// 外部控制 tab 切换
		activeTab: toolbarActiveTab,
		onActiveTabChange: setToolbarActiveTab,
	};

	// 工具栏位置：优先从 atom 读取（响应式更新），fallback 到 props
	const toolbarPosition = atomSettings.toolbarPosition ?? settings.toolbarPosition ?? 'right';
	const isToolbarLeft = toolbarPosition === 'left';

	// 拖拽调整工具栏宽度的处理
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		const toolbarContainer = document.querySelector('.toolbar-container') as HTMLElement;
		const container = containerRef.current;
		if (!toolbarContainer || !container) return;

		const startX = e.clientX;
		const startWidth = toolbarContainer.getBoundingClientRect().width;
		const containerWidth = container.getBoundingClientRect().width;

		// 动态计算最大宽度：确保渲染器至少有 320px 空间
		const rendererMinWidth = 320;
		const resizerWidth = 6;
		const minWidth = 320; // 工具栏最小宽度
		const maxWidth = Math.min(800, containerWidth - rendererMinWidth - resizerWidth);

		const handleMouseMove = (e: MouseEvent) => {
			// 根据工具栏位置决定拖拽方向
			// 工具栏在右边：向左拖拽增加宽度
			// 工具栏在左边：向右拖拽增加宽度
			const delta = e.clientX - startX;
			const newWidth = isToolbarLeft ? startWidth + delta : startWidth - delta;

			if (newWidth >= minWidth && newWidth <= maxWidth) {
				const widthPx = `${newWidth}px`;
				setToolbarWidth(widthPx);
				// 持久化保存宽度
				try {
					localStorage.setItem('lovpen-toolbar-width', widthPx);
				} catch (error) {
					console.warn('Failed to save toolbar width to localStorage:', error);
				}
			}
		};

		const handleMouseUp = () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	}, [isToolbarLeft]);

	return (
		<div
			ref={containerRef}
			className="note-preview"
			style={{
				display: "flex",
				flexDirection: isToolbarLeft ? "row-reverse" : "row", // 根据设置调整布局方向
				height: "100%",
				width: "100%",
				overflow: "hidden",
				position: "relative",
				isolation: "isolate", // 创建新的层叠上下文，防止外部动画影响
				// 🔑 直接设置背景色，防止 Obsidian CSS 变量穿透
				backgroundColor: "#ffffff",
				color: "#1a1a1a",
			}}
		>
			{/* 左侧渲染区域 - 始终可见，占用剩余空间 */}
			<ScrollContainer
				className="lovpen-renderer"
				style={{
					WebkitUserSelect: "text",
					userSelect: "text",
					flex: "1", // 占用剩余空间，宽度 = C - B - resizer（当B显示时）或 C（当B隐藏时）
					overflow: "auto",
					scrollbarGutter: "stable", // 预留滚动条空间，防止内容跳动
					borderRight: !isToolbarAutoHidden && !isToolbarLeft ? "1px solid #e5e5e5" : "none",
					borderLeft: !isToolbarAutoHidden && isToolbarLeft ? "1px solid #e5e5e5" : "none",
					position: "relative", // 为绝对定位的复制按钮提供定位上下文
					display: "flex",
					flexDirection: "column",
					// 🔑 直接设置背景色，防止 Obsidian CSS 变量穿透
					backgroundColor: "#ffffff",
					color: "#1a1a1a"
				}}
			>
				{/* 内容容器 */}
				<div ref={contentContainerRef} className="lovpen-content-container" style={{ position: "relative" }}>
					{/* 复制按钮和工具栏切换按钮容器 - sticky 置顶区域 */}
					<div style={{
						position: 'sticky',
						top: 0,
						right: 0,
						zIndex: 40,
						display: 'flex',
						gap: '8px',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '12px 16px',
						backgroundColor: '#F9F9F7',
						borderBottom: '1px solid #E8E6DC',
						backdropFilter: 'blur(8px)'
					}}>
						{/* Logo 和版本号 */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
							<div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
								<svg viewBox="0 0 986.05 1080" style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
									<g fill="#D97757">
										<path d="M281.73,892.18V281.73C281.73,126.13,155.6,0,0,0l0,0v610.44C0,766.04,126.13,892.18,281.73,892.18z"/>
										<path d="M633.91,1080V469.56c0-155.6-126.13-281.73-281.73-281.73l0,0v610.44C352.14,953.87,478.31,1080,633.91,1080L633.91,1080z"/>
										<path d="M704.32,91.16L704.32,91.16v563.47l0,0c155.6,0,281.73-126.13,281.73-281.73S859.92,91.16,704.32,91.16z"/>
									</g>
								</svg>
							</div>
							<span className="bg-[#F0EEE6] text-[#87867F] text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
								v{packageJson.version}
							</span>
						</div>

						{/* 右侧按钮组 */}
						<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
							<CopySplitButton
								onCopy={(option: CopyOption) => {
									console.log('🎯 [LovpenReact] onCopy called with option:', option, 'id:', option.id);
									onCopy(option.id);
								}}
							/>

							{/* 头像 - 点击切换到设置 tab */}
							<Avatar
								onClick={() => setToolbarActiveTab('settings')}
								className="cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97757] shadow-sm"
							>
								<AvatarImage />
								<AvatarFallback className="transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-[#D97757] shadow-sm">
									{settings?.personalInfo?.name?.[0] ?? "L"}
								</AvatarFallback>
							</Avatar>
						</div>
					</div>
					{/* 动态样式：来自主题和高亮 */}
					<style
						title="lovpen-style"
						ref={(el) => {
							if (el) {
								domUpdater.setStyleElement(el);
							}
						}}
					>
						{cssContent}
					</style>
					<ArticleRenderer html={articleHTML} />
				</div>
			</ScrollContainer>

			{/* 可拖动的分隔条 - 仅在工具栏未被自动隐藏时显示 */}
			{!isToolbarAutoHidden && (
				<div
					className="column-resizer"
					style={{
						width: "6px",
						backgroundColor: "var(--background-modifier-border)",
						cursor: "col-resize",
						opacity: 0.5,
						transition: "all 0.2s ease",
						zIndex: 10,
						flexShrink: 0, // 防止被压缩
						borderRadius: "2px"
					}}
					onMouseDown={handleMouseDown}
					onMouseEnter={(e) => {
						e.currentTarget.style.opacity = "1";
						e.currentTarget.style.backgroundColor = "var(--interactive-accent)";
						e.currentTarget.style.width = "8px";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.opacity = "0.5";
						e.currentTarget.style.backgroundColor = "var(--background-modifier-border)";
						e.currentTarget.style.width = "6px";
					}}
				/>
			)}

			{/* 工具栏容器 - 仅在未被自动隐藏时显示 */}
			{!isToolbarAutoHidden && (
				<div
					className="toolbar-container"
					style={{
						width: toolbarWidth, // 用户可调整的宽度（通过拖拽），ResizeObserver确保不会使A<320px
						height: "100%",
						overflowY: "auto",
						overflowX: "hidden",
						backgroundColor: "var(--background-secondary-alt)",
						borderLeft: !isToolbarLeft ? "1px solid var(--background-modifier-border)" : "none",
						borderRight: isToolbarLeft ? "1px solid var(--background-modifier-border)" : "none",
						flexShrink: 0 // 防止被压缩
					}}
				>
					<Toolbar {...toolbarProps} />
				</div>
			)}

			{/* HMR 测试指示器 - 仅在开发模式显示 */}
			{(window as any).__LOVPEN_HMR_MODE__ && <HMRTest />}
		</div>
	);
};
