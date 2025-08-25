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

	// HMR模式检查

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

	// 更新CSS样式和文章内容 - 只在内容真正改变时更新
	useEffect(() => {
		const cssChanged = cssContent !== lastCssContentRef.current;
		const articleChanged = articleHTML !== lastArticleHTMLRef.current;
		
		if (cssChanged || articleChanged) {
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
					minWidth: "300px", // 最小宽度保护
					position: "relative" // 为绝对定位的复制按钮提供定位上下文
				}}
			>
				{/* 复制按钮容器 - 固定在右上角 */}
				<div style={{
					position: 'sticky',
					top: 0,
					float: 'right',
					zIndex: 40,
					marginTop: '-10px',
					marginRight: '-10px',
					padding: '16px'
				}}>
					<button
						onClick={onCopy}
						className="inline-flex items-center justify-center w-9 h-9 bg-white/60 backdrop-blur-sm border border-[#E8E6DC]/50 text-[#87867F]/70 rounded-xl shadow-sm transition-all hover:bg-[#D97757] hover:text-white hover:scale-105 hover:shadow-md hover:border-[#D97757] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 focus:ring-offset-2"
						title="复制内容"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
						</svg>
					</button>
				</div>
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
