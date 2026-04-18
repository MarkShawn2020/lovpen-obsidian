import React, {useCallback, useEffect, useRef, useState} from "react";
import {LovpenReactProps} from "../types";
import {Toolbar} from "./toolbar/Toolbar";
import {useSetAtom, useAtomValue} from "jotai";
import {initializeSettingsAtom, settingsAtom, articleInfoAtom} from "../store/atoms";
import {articleHTMLAtom, cssContentAtom} from "../store/contentAtoms";
import {HMRTest} from "./HMRTest";
import {ArticleRenderer} from "./ArticleRenderer";
import {ScrollContainer} from "./ScrollContainer";
import {domUpdater} from "../utils/domUpdater";
import {CopySplitButton, CopyOption} from "./ui/copy-split-button";
import {AvatarPreview} from "./ui/AvatarPreview";
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
	const articleInfo = useAtomValue(articleInfoAtom);

	// 使用atom值或props值作为fallback
	const articleHTML = atomArticleHTML || propsArticleHTML;
	const cssContent = atomCssContent || propsCssContent;
	
	const initializeSettings = useSetAtom(initializeSettingsAtom);
	const isInitializedRef = useRef(false);

	// Toolbar 显示/隐藏状态（手动切换）
	const [isToolbarHidden, setIsToolbarHidden] = useState<boolean>(() => {
		try {
			return localStorage.getItem('lovpen-toolbar-hidden') === 'true';
		} catch {
			return false;
		}
	});

	// Toolbar 宽度（可拖动调整，持久化到 localStorage）
	const TOOLBAR_WIDTH_MIN = 328;
	const TOOLBAR_WIDTH_MAX = 800;
	const TOOLBAR_WIDTH_DEFAULT = 432;
	const [toolbarWidth, setToolbarWidth] = useState<number>(() => {
		try {
			const stored = localStorage.getItem('lovpen-toolbar-width');
			if (stored) {
				const n = parseInt(stored, 10);
				if (!Number.isNaN(n)) return Math.min(TOOLBAR_WIDTH_MAX, Math.max(TOOLBAR_WIDTH_MIN, n));
			}
		} catch {}
		return TOOLBAR_WIDTH_DEFAULT;
	});
	const containerRef = useRef<HTMLDivElement>(null);
	const isResizingRef = useRef<boolean>(false);

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
		// 使用 props.settings 作为 fallback，确保首次渲染时能获取正确的设置
		const shouldScale = atomSettings.scaleCodeBlockInImage ?? settings.scaleCodeBlockInImage ?? true;
		const container = contentContainerRef.current;

		if (!container) return;

		// 如果 articleHTML 为空，不执行缩放
		if (!articleHTML) return;

		// 使用 requestAnimationFrame 确保 CSS 已经应用后再执行缩放检测
		// 这解决了初始化时 CSS 可能还没完全应用的问题
		const rafId = requestAnimationFrame(() => {
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
		});

		// 组件卸载时恢复
		return () => {
			cancelAnimationFrame(rafId);
			if (codeBlockScaleRestoreRef.current) {
				codeBlockScaleRestoreRef.current();
				codeBlockScaleRestoreRef.current = null;
			}
		};
	}, [atomSettings.scaleCodeBlockInImage, settings.scaleCodeBlockInImage, articleHTML]); // 当设置或文章内容变化时重新计算

	// 监听容器宽度变化，用于通知宽度改变
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !onWidthChange) return;

		let widthChangeTimer: NodeJS.Timeout | null = null;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const containerWidth = entry.contentRect.width;
				if (widthChangeTimer) clearTimeout(widthChangeTimer);
				widthChangeTimer = setTimeout(() => {
					onWidthChange(containerWidth);
				}, 200);
			}
		});

		resizeObserver.observe(container);

		return () => {
			if (widthChangeTimer) clearTimeout(widthChangeTimer);
			resizeObserver.disconnect();
		};
	}, [onWidthChange]);

	// 切换 Toolbar 显示/隐藏
	const toggleToolbar = useCallback(() => {
		setIsToolbarHidden(prev => {
			const newVal = !prev;
			try {
				localStorage.setItem('lovpen-toolbar-hidden', String(newVal));
			} catch {}
			return newVal;
		});
	}, []);

	// 工具栏宽度拖动：mousedown 在 resizer 上启动，全局 mousemove/mouseup 更新并结束
	const startToolbarResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		isResizingRef.current = true;
		const container = containerRef.current;
		if (!container) return;
		const containerRect = container.getBoundingClientRect();
		// 根据布局方向：工具栏在右时，宽度 = containerRight - mouseX；工具栏在左时，宽度 = mouseX - containerLeft
		const toolbarOnLeft = getComputedStyle(container).flexDirection === 'row-reverse';

		const onMove = (ev: MouseEvent) => {
			if (!isResizingRef.current) return;
			const raw = toolbarOnLeft
				? ev.clientX - containerRect.left
				: containerRect.right - ev.clientX;
			const clamped = Math.min(TOOLBAR_WIDTH_MAX, Math.max(TOOLBAR_WIDTH_MIN, raw));
			setToolbarWidth(clamped);
		};
		const onUp = () => {
			if (!isResizingRef.current) return;
			isResizingRef.current = false;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}, []);

	// toolbarWidth 变更时持久化
	useEffect(() => {
		try {
			localStorage.setItem('lovpen-toolbar-width', String(toolbarWidth));
		} catch {}
	}, [toolbarWidth]);

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
					borderRight: !isToolbarHidden && !isToolbarLeft ? "1px solid #e5e5e5" : "none",
					borderLeft: !isToolbarHidden && isToolbarLeft ? "1px solid #e5e5e5" : "none",
					position: "relative", // 为绝对定位的复制按钮提供定位上下文
					display: "flex",
					flexDirection: "column",
					// 背景色和文字色由主题CSS控制（.lovpen-renderer选择器）
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
						{/* 工具栏展开/收起切换按钮 */}
						<button
							onClick={toggleToolbar}
							title={isToolbarHidden ? '展开工具栏' : '收起工具栏'}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '32px',
								height: '32px',
								borderRadius: '8px',
								border: '1px solid #E8E6DC',
								backgroundColor: '#fff',
								cursor: 'pointer',
								transition: 'all 0.2s ease'
							}}
							onMouseEnter={e => {
								e.currentTarget.style.backgroundColor = '#F9F9F7';
								e.currentTarget.style.borderColor = '#D97757';
							}}
							onMouseLeave={e => {
								e.currentTarget.style.backgroundColor = '#fff';
								e.currentTarget.style.borderColor = '#E8E6DC';
							}}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#87867F"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{
									transform: isToolbarHidden ? 'rotate(180deg)' : 'rotate(0deg)',
									transition: 'transform 0.2s ease'
								}}
							>
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<path d="M15 3v18" />
							</svg>
						</button>

						{/* 右侧按钮组 */}
						<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
							<CopySplitButton
								onCopy={(option: CopyOption) => {
									console.log('🎯 [LovpenReact] onCopy called with option:', option, 'id:', option.id);
									onCopy(option.id);
								}}
							/>

							{/* 头像 - 点击切换到设置 tab */}
							<div
								onClick={() => setToolbarActiveTab('settings')}
								className="cursor-pointer transition-all hover:scale-105"
							>
								<AvatarPreview
									config={articleInfo.authorAvatar}
									userName={articleInfo.author || settings?.personalInfo?.name}
									size="xs"
								/>
							</div>
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


			{/* 拖拽分隔条 - 位于 ScrollContainer 和 Toolbar 之间 */}
			{!isToolbarHidden && (
				<div
					onMouseDown={startToolbarResize}
					title="拖动调整工具栏宽度"
					style={{
						width: 4,
						cursor: "col-resize",
						flexShrink: 0,
						backgroundColor: "transparent",
						transition: "background-color 0.15s ease",
						position: "relative",
						zIndex: 10
					}}
					onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D97757'; }}
					onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
				/>
			)}

			{/* 工具栏容器 - 仅在显示时显示，宽度可拖动调整 */}
			{!isToolbarHidden && (
				<div
					className="toolbar-container"
					style={{
						width: toolbarWidth,
						height: "100%",
						overflowY: "auto",
						overflowX: "hidden",
						flexShrink: 0
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
