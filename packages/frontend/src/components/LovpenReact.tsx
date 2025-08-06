import React, {useCallback, useEffect, useRef, useState} from "react";
import {LovpenReactProps} from "../types";
import {Toolbar} from "./toolbar/Toolbar";
import {MessageModal} from "./preview/MessageModal";
import {useSetAtom} from "jotai";
import {initializeSettingsAtom} from "../store/atoms";
import {HMRTest} from "./HMRTest";

import {logger} from "../../../shared/src/logger";

export const LovpenReact: React.FC<LovpenReactProps> = ({
															settings,
															articleHTML,
															cssContent,
															plugins,
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
															onSettingsChange
														}) => {
	const initializeSettings = useSetAtom(initializeSettingsAtom);
	const isInitializedRef = useRef(false);
	const lastCssContentRef = useRef<string>("");
	const lastArticleHTMLRef = useRef<string>("");

	// 调试：检查传入的设置数据
	if ((window as any).__LOVPEN_HMR_MODE__) {
		console.log('[LovpenReact] HMR Mode Active');
	}
	logger.debug("[LovpenReact] Component render started", {
		articleHTMLLength: articleHTML?.length || 0,
		cssContentLength: cssContent?.length || 0,
		cssContentHash: cssContent ? cssContent.substring(0, 50) + "..." : "",
		currentTheme: settings.defaultStyle
	});

	const [isMessageVisible, setIsMessageVisible] = useState(false);
	const [messageTitle, setMessageTitle] = useState("");
	const [showOkButton, setShowOkButton] = useState(false);
	const renderDivRef = useRef<HTMLDivElement>(null);
	const styleElRef = useRef<HTMLStyleElement>(null);
	const articleDivRef = useRef<HTMLDivElement>(null);

	// 工具栏宽度状态 - 从localStorage恢复或使用默认宽度
	const [toolbarWidth, setToolbarWidth] = useState<string>(() => {
		try {
			return localStorage.getItem('lovpen-toolbar-width') || "420px";
		} catch {
			return "420px";
		}
	});

	// 组件挂载检查
	useEffect(() => {
		logger.debug("[mount-useEffect] Component mounted");

		return () => {
			logger.debug("[mount-useEffect] Component will unmount");
		};
	}, []);

	// 初始化Jotai状态 - 只初始化一次
	useEffect(() => {
		if (!isInitializedRef.current && settings) {
			console.log("[jotai-init] First initialization, settings:", settings);
			const personalInfo = settings.personalInfo || {
				name: '',
				avatar: { type: 'default' },
				bio: '',
				email: '',
				website: ''
			};

			console.log("[jotai-init] Initializing Jotai with settings:", settings);
			console.log("[jotai-init] Initializing Jotai with personalInfo:", personalInfo);

			initializeSettings({
				settings,
				personalInfo
			});

			logger.debug("[jotai-init] Jotai state initialized with settings:", settings);
			logger.debug("[jotai-init] Personal info:", personalInfo);
			
			isInitializedRef.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // 只在组件挂载时执行

	// 更新CSS样式和文章内容 - 只在内容真正改变时更新
	useEffect(() => {
		const cssChanged = cssContent !== lastCssContentRef.current;
		const articleChanged = articleHTML !== lastArticleHTMLRef.current;
		
		if (cssChanged || articleChanged) {
			logger.debug("[content-update] Updating CSS and article content", {
				cssChanged,
				articleChanged,
				cssContentLength: cssContent?.length || 0,
				articleHTMLLength: articleHTML?.length || 0,
				hasStyleRef: !!styleElRef.current,
				hasArticleRef: !!articleDivRef.current
			});
			
			if (cssChanged && styleElRef.current) {
				styleElRef.current.textContent = cssContent;
				lastCssContentRef.current = cssContent;
			}
			if (articleChanged && articleDivRef.current) {
				articleDivRef.current.innerHTML = articleHTML;
				lastArticleHTMLRef.current = articleHTML;
			}
		}
	}, [cssContent, articleHTML]);

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
			// 在row-reverse布局中，向右拖拽增加工具栏宽度，向左拖拽减少工具栏宽度
			// 这样拖拽方向就和视觉上的预期一致了
			const newWidth = startWidth + (e.clientX - startX);
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
			className="note-preview"
			style={{
				display: "flex",
				flexDirection: "row-reverse", // 反向布局，工具栏在右边
				height: "100%",
				width: "100%",
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* 左侧渲染区域 - 占用剩余空间 */}
			<div
				ref={renderDivRef}
				className="render-container"
				id="render-container"
				style={{
					WebkitUserSelect: "text",
					userSelect: "text",
					padding: "10px",
					flex: "1", // 占用剩余空间
					overflow: "auto",
					borderRight: "1px solid var(--background-modifier-border)",
					minWidth: "300px" // 最小宽度保护
				}}
			>
				<style ref={styleElRef} title="lovpen-style">
					{cssContent}
				</style>
				<div ref={articleDivRef} dangerouslySetInnerHTML={{__html: articleHTML}}/>
			</div>

			{/* 可拖动的分隔条 */}
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

			{/* 右侧工具栏容器 - 自适应内容宽度 */}
			<div
				className="toolbar-container"
				style={{
					width: toolbarWidth,
					height: "100%",
					overflowY: "auto",
					overflowX: "hidden",
					backgroundColor: "var(--background-secondary-alt)",
					borderLeft: "1px solid var(--background-modifier-border)",
					minWidth: "320px", // 最小宽度保护
					flexShrink: 0 // 防止被压缩
				}}
			>
				{(() => {
					logger.debug("[LovpenReact] 渲染工具栏", {
						pluginsCount: plugins?.length || 0,
						settingsKeys: Object.keys(settings || {}),
						hasOnCopy: !!onCopy,
						hasOnDistribute: !!onDistribute
					});
					return (
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
					);
				})()}
			</div>

			{/* 消息模态框 */}
			<MessageModal
				isVisible={isMessageVisible}
				title={messageTitle}
				showOkButton={showOkButton}
				onClose={closeMessage}
			/>
			
			{/* HMR 测试指示器 - 仅在开发模式显示 */}
			{(window as any).__LOVPEN_HMR_MODE__ && <HMRTest />}
		</div>
	);
};
