import {MarkedExtension, Tokens} from "marked";

import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

const icon_note = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
const icon_abstract = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-align-left"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>`;
const icon_info = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
const icon_todo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check-circle-2"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`;
const icon_tip = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-lightbulb"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.05 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path><line x1="12" y1="18" x2="12" y2="22"></line></svg>`;
const icon_success = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>`;
const icon_question = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-help-circle"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>`;
const icon_warning = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
const icon_failure = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
const icon_danger = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
const icon_bug = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bug"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>`;
const icon_example = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-code"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
const icon_quote = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>`;
/*
note,
abstract, summary, tldr
info
todo
tip
hint, important
success, check, done
question, help, faq
warning, caution, attention
failure, fail, missing
danger, error
bug
example
quote, cite
*/

type CalloutInfo = { icon: string; style: string };

const CalloutTypes = new Map<string, CalloutInfo>(
	Object.entries({
		note: {
			icon: icon_note,
			style: "ad-note",
		},
		abstract: {
			icon: icon_abstract,
			style: "ad-abstract",
		},
		summary: {
			icon: icon_abstract,
			style: "ad-abstract",
		},
		tldr: {
			icon: icon_abstract,
			style: "ad-abstract",
		},
		info: {
			icon: icon_info,
			style: "ad-note",
		},
		todo: {
			icon: icon_todo,
			style: "ad-note",
		},
		tip: {
			icon: icon_tip,
			style: "ad-abstract",
		},
		hint: {
			icon: icon_tip,
			style: "ad-abstract",
		},
		important: {
			icon: icon_tip,
			style: "ad-abstract",
		},
		success: {
			icon: icon_success,
			style: "ad-success",
		},
		check: {
			icon: icon_success,
			style: "ad-success",
		},
		done: {
			icon: icon_success,
			style: "ad-success",
		},
		question: {
			icon: icon_question,
			style: "ad-question",
		},
		help: {
			icon: icon_question,
			style: "ad-question",
		},
		faq: {
			icon: icon_question,
			style: "ad-question",
		},
		warning: {
			icon: icon_warning,
			style: "ad-question",
		},
		caution: {
			icon: icon_warning,
			style: "ad-question",
		},
		attention: {
			icon: icon_warning,
			style: "ad-question",
		},
		failure: {
			icon: icon_failure,
			style: "ad-failure",
		},
		fail: {
			icon: icon_failure,
			style: "ad-failure",
		},
		missing: {
			icon: icon_failure,
			style: "ad-failure",
		},
		danger: {
			icon: icon_danger,
			style: "ad-failure",
		},
		error: {
			icon: icon_danger,
			style: "ad-failure",
		},
		bug: {
			icon: icon_bug,
			style: "ad-failure",
		},
		example: {
			icon: icon_example,
			style: "ad-example",
		},
		quote: {
			icon: icon_quote,
			style: "ad-quote",
		},
		cite: {
			icon: icon_quote,
			style: "ad-quote",
		},
	})
);

export function GetCallout(type: string) {
	return CalloutTypes.get(type);
}

// 给 HTML 中的 <p> 标签添加内联样式
function addInlineStylesToParagraphs(html: string, paragraphStyle: string): string {
	// 使用正则表达式匹配所有 <p> 标签
	// 注意：这个方法简单但有效，适合在 HTML 生成阶段使用
	return html.replace(/<p>/g, `<p style="${paragraphStyle}">`);
}

// 获取 admonition 的内联样式 - 极致低调设计（注脚级别）
export function getAdmonitionInlineStyles(type: string): { container: string; header: string; icon: string; title: string; content: string; paragraph: string } {
	// 基础样式 - 极致低调设计（注脚级别，平衡视觉效果）
	const baseStyles = {
		container: 'border: 1px solid rgba(0, 0, 0, 0.04); padding: 0.6em 0.85em; display: flex; flex-direction: column; margin: 1em 0; border-radius: 4px; border-left-width: 1px; box-shadow: none; background: white; position: relative;',
		header: 'display: flex; flex-direction: row; align-items: center; font-size: 0.75em; font-weight: 500; margin-bottom: 0.35em; opacity: 0.9;',
		icon: 'display: inline-block; width: 14px; height: 14px; margin-right: 0.5em; flex-shrink: 0; opacity: 0.55;',
		title: 'flex: 1; line-height: 1.3; font-weight: 500;',
		content: 'color: rgb(102, 102, 102) !important; font-size: 0.75em !important; line-height: 1.5; padding-left: calc(14px + 0.5em); opacity: 0.85; font-weight: 300;',
		paragraph: 'font-size: 0.75em; line-height: 1.5; color: #666666; letter-spacing: 0; text-align: left; margin: 0.4em 0; word-break: break-all; overflow-wrap: break-word;'
	};

	// 根据类型获取颜色 - 极致低调配色（灰化处理）
	let color = 'rgb(130, 130, 130)'; // 默认灰色
	let bgColor = 'rgba(254, 254, 254, 0.4)';

	// Anthropic Style 主题 - 极致低调色系（大幅降低饱和度）
	switch(type.toLowerCase()) {
		case 'note':
		case 'info':
		case 'todo':
			color = 'rgb(140, 100, 85)';
			bgColor = 'rgba(254, 253, 252, 0.35)';
			break;
		case 'tip':
		case 'abstract':
		case 'summary':
		case 'tldr':
		case 'hint':
		case 'important':
			color = 'rgb(135, 95, 80)';
			bgColor = 'rgba(254, 253, 252, 0.4)';
			break;
		case 'success':
		case 'check':
		case 'done':
			color = 'rgb(110, 100, 85)';
			bgColor = 'rgba(254, 253, 252, 0.35)';
			break;
		case 'question':
		case 'help':
		case 'faq':
		case 'warning':
		case 'caution':
		case 'attention':
			color = 'rgb(150, 105, 85)';
			bgColor = 'rgba(254, 253, 252, 0.4)';
			break;
		case 'failure':
		case 'fail':
		case 'missing':
		case 'danger':
		case 'error':
		case 'bug':
			color = 'rgb(140, 90, 75)';
			bgColor = 'rgba(254, 253, 252, 0.35)';
			break;
		case 'example':
			color = 'rgb(125, 100, 85)';
			bgColor = 'rgba(254, 253, 252, 0.35)';
			break;
		case 'quote':
		case 'cite':
			color = 'rgb(115, 115, 115)';
			bgColor = 'rgba(253, 253, 253, 0.35)';
			break;
	}

	// 为边框创建淡化的颜色（用于上右下边框）- 极淡
	const borderColor = color.replace('rgb', 'rgba').replace(')', ', 0.08)');

	return {
		container: `${baseStyles.container} border-color: ${borderColor}; border-left-color: ${color}; background: ${bgColor};`,
		header: `${baseStyles.header} color: ${color};`,
		icon: baseStyles.icon,
		title: baseStyles.title,
		content: baseStyles.content,
		paragraph: baseStyles.paragraph
	};
}

function matchCallouts(text: string) {
	const regex = /\[!(.*?)\]/g;
	let m;
	if ((m = regex.exec(text))) {
		return m[1];
	}
	return "";
}

function GetCalloutTitle(callout: string, text: string) {
	let title =
		callout.charAt(0).toUpperCase() + callout.slice(1).toLowerCase();
	let start = text.indexOf("]") + 1;
	if (text.indexOf("]-") > 0 || text.indexOf("]+") > 0) {
		start = start + 1;
	}
	let end = text.indexOf("\n");
	if (end === -1) end = text.length;
	if (start >= end) return title;
	const customTitle = text.slice(start, end).trim();
	if (customTitle !== "") {
		title = customTitle;
	}
	return title;
}

export class CalloutRenderer extends UnifiedMarkdownPlugin {
	getPluginName(): string {
		return "CalloutRenderer";
	}

	getPluginDescription(): string {
		return "将Obsidian样式的Callout块（如>[!note]）转换为带有图标和样式的可视化块";
	}

	async renderer(token: Tokens.Blockquote) {
		let callout = matchCallouts(token.text);
		if (callout == "") {
			if (!this.marked) {
				console.error('CalloutRenderer: marked实例未初始化');
				return `<blockquote>Marked实例未初始化</blockquote>`;
			}
			const body = this.marked.parser(token.tokens);
			return `<blockquote>${body}</blockquote>`;
		}

		const title = GetCalloutTitle(callout, token.text);
		let info = GetCallout(callout.toLowerCase());
		if (info == null) {
			const svg = await this.assetsManager.loadIcon(callout);
			if (svg) {
				info = {icon: svg, style: "ad-note"};
			} else {
				info = GetCallout("note");
			}
		}
		const index = token.text.indexOf("\n");
		let body = "";
		if (index > 0) {
			token.text = token.text.slice(index + 1);
			if (!this.marked) {
				console.error('CalloutRenderer: marked实例未初始化 (parse)');
				body = "Marked实例未初始化";
			} else {
				body = await this.marked.parse(token.text);
			}
		}

		// 获取内联样式
		const styles = getAdmonitionInlineStyles(callout.toLowerCase());

		// 处理SVG图标，添加内联样式 - 极致低调设计（平衡视觉效果）
		const styledIcon = info?.icon ? info.icon.replace('<svg', '<svg style="width: 100%; height: 100%; display: block; opacity: 0.55;"') : '';

		// 给 body 中的 <p> 标签添加内联样式（在 HTML 生成阶段，而非后处理）
		const styledBody = addInlineStylesToParagraphs(body, styles.paragraph);

		// 生成带内联样式的 HTML（兼容微信公众号）
		return `<section data-component="admonition" data-type="${callout.toLowerCase()}" data-variant="${info?.style}" style="${styles.container}">
			<header data-element="admonition-header" style="${styles.header}">
				<span data-element="admonition-icon" data-icon-type="${callout.toLowerCase()}" style="${styles.icon}">${styledIcon}</span>
				<span data-element="admonition-title" style="${styles.title}">${title}</span>
			</header>
			<div data-element="admonition-content" style="${styles.content}">${styledBody}</div>
		</section>`;
	}

	markedExtension(): MarkedExtension {
		return {
			async: true,
			walkTokens: async (token: Tokens.Generic) => {
				if (token.type !== "blockquote") {
					return;
				}
				token.html = await this.renderer(token as Tokens.Blockquote);
			},
			extensions: [
				{
					name: "blockquote",
					level: "block",
					renderer: (token: Tokens.Generic) => {
						return token.html;
					},
				},
			],
		};
	}
}
