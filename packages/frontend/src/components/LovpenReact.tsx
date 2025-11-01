import React, {useCallback, useEffect, useRef, useState} from "react";
import {LovpenReactProps} from "../types";
import {Toolbar} from "./toolbar/Toolbar";
import {MessageModal} from "./preview/MessageModal";
import {useSetAtom, useAtomValue} from "jotai";
import {initializeSettingsAtom} from "../store/atoms";
import {articleHTMLAtom, cssContentAtom, staticCallbacksAtom} from "../store/contentAtoms";
import {HMRTest} from "./HMRTest";
import {ArticleRenderer} from "./ArticleRenderer";
import {ScrollContainer} from "./ScrollContainer";
import {domUpdater} from "../utils/domUpdater";
import {CopySplitButton, CopyOption} from "./ui/copy-split-button";
import {Sheet, SheetContent, SheetTitle, SheetDescription} from "./ui/sheet";

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
	
	// 使用atom值或props值作为fallback
	const articleHTML = atomArticleHTML || propsArticleHTML;
	const cssContent = atomCssContent || propsCssContent;
	
	const initializeSettings = useSetAtom(initializeSettingsAtom);
	const isInitializedRef = useRef(false);

	// HMR模式检查

	const [isMessageVisible, setIsMessageVisible] = useState(false);
	const [messageTitle, setMessageTitle] = useState("");
	const [showOkButton, setShowOkButton] = useState(false);

	// 工具栏宽度状态 - 从localStorage恢复或使用默认宽度
	const [toolbarWidth, setToolbarWidth] = useState<string>(() => {
		try {
			return localStorage.getItem('lovpen-toolbar-width') || "420px";
		} catch {
			return "420px";
		}
	});

	// 工具栏显示/隐藏状态
	const [isToolbarVisible, setIsToolbarVisible] = useState(() => {
		try {
			const saved = localStorage.getItem('lovpen-toolbar-visible');
			return saved === null ? true : saved === 'true';
		} catch {
			return true;
		}
	});

	// Toolbar 自动隐藏状态（基于空间不足）
	const [isToolbarAutoHidden, setIsToolbarAutoHidden] = useState(false);
	// Sheet 模式的打开状态（当自动隐藏时使用）
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Toggle 工具栏显示状态
	const toggleToolbar = useCallback(() => {
		// 如果当前是自动隐藏状态（Sheet 模式），切换 Sheet 的开关
		if (isToolbarAutoHidden) {
			setIsSheetOpen(prev => !prev);
		} else {
			// 否则切换工具栏可见性（正常模式）
			setIsToolbarVisible(prev => {
				const newValue = !prev;
				try {
					localStorage.setItem('lovpen-toolbar-visible', String(newValue));
				} catch (error) {
					console.warn('Failed to save toolbar visibility to localStorage:', error);
				}
				return newValue;
			});
		}
	}, [isToolbarAutoHidden]);

	// 工具栏实际是否可见（考虑自动隐藏）
	const isToolbarActuallyVisible = isToolbarVisible && !isToolbarAutoHidden;

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

				// 如果用户手动隐藏了工具栏，不需要自动隐藏逻辑
				if (!isToolbarVisible) {
					setIsToolbarAutoHidden(false);
					return;
				}

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
	}, [toolbarWidth, isToolbarVisible, onWidthChange]);

	// React会自动处理增量更新，无需手动操作DOM

	// 暂时移除MathJax自动加载，避免与现有数学公式渲染冲突
	// 等原有渲染恢复正常后再考虑如何集成

	// 显示加载消息
	const showLoading = useCallback((msg: string) => {
		setMessageTitle(msg);
		setShowOkButton(false);
		setIsMessageVisible(true);
	}, []);

	// 显示消息
	const showMsg = useCallback((msg: string) => {
		setMessageTitle(msg);
		setShowOkButton(true);
		setIsMessageVisible(true);
	}, []);

	// 为了避免编译错误，我们保持这些方法的引用
	// showLoading 和 showMsg 方法在实际使用中会被调用
	void showLoading;
	void showMsg;

	// 关闭消息
	const closeMessage = useCallback(() => {
		setIsMessageVisible(false);
	}, []);

	// 拖拽调整工具栏宽度的处理
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		const toolbarContainer = document.querySelector('.toolbar-container') as HTMLElement;
		if (!toolbarContainer) return;

		const startX = e.clientX;
		const startWidth = toolbarContainer.getBoundingClientRect().width;

		const handleMouseMove = (e: MouseEvent) => {
			// 在正常布局中，向左拖拽增加工具栏宽度，向右拖拽减少工具栏宽度
			const newWidth = startWidth - (e.clientX - startX);
			const minWidth = 320; // 工具栏最小宽度
			const maxWidth = 800; // 工具栏最大宽度

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
	}, []);

	return (
		<div
			ref={containerRef}
			className="note-preview"
			style={{
				display: "flex",
				flexDirection: "row", // 正常布局，工具栏在右边
				height: "100%",
				width: "100%",
				overflow: "hidden",
				position: "relative",
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
					borderRight: isToolbarVisible && !isToolbarAutoHidden ? "1px solid var(--background-modifier-border)" : "none",
					position: "relative", // 为绝对定位的复制按钮提供定位上下文
					display: "flex",
					flexDirection: "column"
				}}
			>
				{/* 内容容器 - 保持padding，但不影响滚动 */}
				<div className="lovpen-content-container" style={{ position: "relative" }}>
					{/* 复制按钮和工具栏切换按钮容器 - 固定在右上角 */}
					<div style={{
						position: 'absolute',
						top: 0,
						right: 0,
						zIndex: 40,
						padding: '16px',
						display: 'flex',
						gap: '8px',
						alignItems: 'flex-start'
					}}>
						<CopySplitButton
							onCopy={(option: CopyOption) => {
							console.log('🎯 [LovpenReact] onCopy called with option:', option, 'id:', option.id);
							onCopy(option.id);
						}}
						/>

						{/* 工具栏切换按钮 */}
						<button
							onClick={toggleToolbar}
							style={{
								padding: '8px 12px',
								backgroundColor: 'var(--background-primary)',
								border: '1px solid var(--background-modifier-border)',
								borderRadius: '6px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								fontSize: '14px',
								color: 'var(--text-normal)',
								transition: 'all 0.2s ease',
								boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--background-modifier-hover)';
								e.currentTarget.style.borderColor = 'var(--interactive-accent)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--background-primary)';
								e.currentTarget.style.borderColor = 'var(--background-modifier-border)';
							}}
							title={
								isToolbarAutoHidden
									? (isSheetOpen ? '关闭工具栏' : '打开工具栏')
									: (isToolbarActuallyVisible ? '隐藏工具栏' : '显示工具栏')
							}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								style={{ flexShrink: 0 }}
							>
								{(isToolbarActuallyVisible || isSheetOpen) ? (
									// 显示状态的图标 - 侧边栏开启
									<>
										<rect x="10" y="2" width="4" height="12" fill="currentColor" opacity="0.6" rx="1"/>
										<rect x="2" y="2" width="6" height="12" fill="currentColor" rx="1"/>
									</>
								) : (
									// 隐藏状态的图标 - 侧边栏关闭
									<rect x="2" y="2" width="12" height="12" fill="currentColor" rx="1"/>
								)}
							</svg>
							<span style={{ fontSize: '12px', fontWeight: 500 }}>
								{(isToolbarActuallyVisible || isSheetOpen) ? '关闭' : '打开'}
							</span>
						</button>
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

			{/* 可拖动的分隔条 - 仅在工具栏可见且未被自动隐藏时显示 */}
			{isToolbarVisible && !isToolbarAutoHidden && (
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

			{/* 右侧工具栏容器 - 仅在可见且未被自动隐藏时显示 */}
			{isToolbarVisible && !isToolbarAutoHidden && (
				<div
					className="toolbar-container"
					style={{
						width: toolbarWidth, // 用户可调整的宽度（通过拖拽），ResizeObserver确保不会使A<320px
						height: "100%",
						overflowY: "auto",
						overflowX: "hidden",
						backgroundColor: "var(--background-secondary-alt)",
						borderLeft: "1px solid var(--background-modifier-border)",
						flexShrink: 0 // 防止被压缩
					}}
				>
					<Toolbar
								settings={settings}
								plugins={plugins}
								articleHTML={articleHTML}
								onRefresh={onRefresh}
								onCopy={onCopy}
								onDistribute={onDistribute}
								onTemplateChange={onTemplateChange}
								onThemeChange={onThemeChange}
								onHighlightChange={onHighlightChange}
								onThemeColorToggle={onThemeColorToggle}
								onThemeColorChange={onThemeColorChange}
								onRenderArticle={onRenderArticle}
								onSaveSettings={onSaveSettings}
								onPluginToggle={onPluginToggle}
								onPluginConfigChange={onPluginConfigChange}
								onExpandedSectionsChange={onExpandedSectionsChange}
								onArticleInfoChange={onArticleInfoChange}
								onPersonalInfoChange={onPersonalInfoChange}
								onSettingsChange={onSettingsChange}
						/>
				</div>
			)}

			{/* 消息模态框 */}
			<MessageModal
				isVisible={isMessageVisible}
				title={messageTitle}
				showOkButton={showOkButton}
				onClose={closeMessage}
			/>

			{/* Sheet 模式工具栏 - 当空间不足时显示 */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent
					side="right"
					width="320px"
					container={containerRef.current}
					className="p-0 gap-0"
					style={{
						backgroundColor: "var(--background-secondary-alt)",
					}}
				>
					<SheetTitle className="sr-only">工具栏</SheetTitle>
					<SheetDescription className="sr-only">文章编辑和发布工具栏</SheetDescription>
					<div
						style={{
							height: "100%",
							overflowY: "auto",
							overflowX: "hidden"
						}}
					>
						<Toolbar
							settings={settings}
							plugins={plugins}
							articleHTML={articleHTML}
							onRefresh={onRefresh}
							onCopy={onCopy}
							onDistribute={onDistribute}
							onTemplateChange={onTemplateChange}
							onThemeChange={onThemeChange}
							onHighlightChange={onHighlightChange}
							onThemeColorToggle={onThemeColorToggle}
							onThemeColorChange={onThemeColorChange}
							onRenderArticle={onRenderArticle}
							onSaveSettings={onSaveSettings}
							onPluginToggle={onPluginToggle}
							onPluginConfigChange={onPluginConfigChange}
							onExpandedSectionsChange={onExpandedSectionsChange}
							onArticleInfoChange={onArticleInfoChange}
							onPersonalInfoChange={onPersonalInfoChange}
							onSettingsChange={onSettingsChange}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* HMR 测试指示器 - 仅在开发模式显示 */}
			{(window as any).__LOVPEN_HMR_MODE__ && <HMRTest />}
		</div>
	);
};
