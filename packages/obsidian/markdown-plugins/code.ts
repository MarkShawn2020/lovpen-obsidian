import {toPng} from "html-to-image";
import {Tokens} from "marked";
import {MarkdownView} from "obsidian";
import {WeixinCodeFormatter} from "./weixin-code-formatter";
import {GetCallout} from "./callouts";
import {MathRendererQueue} from "./math";
import {CardDataManager} from "../html-plugins/code-blocks";

import {logger} from "../../shared/src/logger";
import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

const MermaidSectionClassName = "note-mermaid";
const MermaidImgClassName = "note-mermaid-img";

export class CodeRenderer extends UnifiedMarkdownPlugin {
	showLineNumber: boolean;
	mermaidIndex: number;

	static getMathType(lang: string | null) {
		if (!lang) return null;
		let l = lang.toLowerCase();
		l = l.trim();
		if (l === "am" || l === "asciimath") return "asciimath";
		if (l === "latex" || l === "tex") return "latex";
		return null;
	}

	getPluginName(): string {
		return "CodeRenderer";
	}

	getPluginDescription(): string {
		return "代码渲染器，处理代码块的渲染和图片转换";
	}

	async prepare() {
		this.mermaidIndex = 0;
	}

	codeRenderer(code: string, infostring: string | undefined): string {
		logger.debug("codeRenderer", {code, infostring});

		const lang = (infostring || "").match(/^\S*/)?.[0];
		code = code.replace(/\n$/, "") + "\n";

		// 如果启用了微信代码格式化，直接返回微信格式
		if (this.settings.enableWeixinCodeFormat) {
			if (lang) {
				return WeixinCodeFormatter.formatCodeForWeixin(code, lang);
			} else {
				return WeixinCodeFormatter.formatPlainCodeForWeixin(code);
			}
		}

		// 简化结构，去掉多余的wrapper
		if (!lang) {
			return `<pre><code>${code}</code></pre>`;
		}

		return `<pre><code class="hljs language-${lang}">${code}</code></pre>`;
	}

	parseCard(htmlString: string) {
		const id = /data-id="([^"]+)"/;
		const headimgRegex = /data-headimg="([^"]+)"/;
		const nicknameRegex = /data-nickname="([^"]+)"/;
		const signatureRegex = /data-signature="([^"]+)"/;

		const idMatch = htmlString.match(id);
		const headimgMatch = htmlString.match(headimgRegex);
		const nicknameMatch = htmlString.match(nicknameRegex);
		const signatureMatch = htmlString.match(signatureRegex);

		return {
			id: idMatch ? idMatch[1] : "",
			headimg: headimgMatch ? headimgMatch[1] : "",
			nickname: nicknameMatch ? nicknameMatch[1] : "公众号名称",
			signature: signatureMatch ? signatureMatch[1] : "公众号介绍",
		};
	}

	renderCard(token: Tokens.Code) {
		const {id, headimg, nickname, signature} = this.parseCard(token.text);
		if (id === "") {
			return "<span>公众号卡片数据错误，没有id</span>";
		}
		CardDataManager.getInstance().setCardData(id, token.text);
		return `<section data-id="${id}" class="note-mpcard-wrapper"><div class="note-mpcard-content"><img class="note-mpcard-headimg" width="54" height="54" src="${headimg}"></img><div class="note-mpcard-info"><div class="note-mpcard-nickname">${nickname}</div><div class="note-mpcard-signature">${signature}</div></div></div><div class="note-mpcard-foot">公众号</div></section>`;
	}

	renderMermaid(token: Tokens.Code) {
		try {
			const meraidIndex = this.mermaidIndex;
			const containerId = `mermaid-${meraidIndex}`;
			const imgId = `meraid-img-${meraidIndex}`;
			this.mermaidIndex += 1;
			const failElement = "<span>mermaid渲染失败</span>";
			let container: HTMLElement | null = null;
			const currentFile = this.app.workspace.getActiveFile();
			const leaves = this.app.workspace.getLeavesOfType("markdown");
			for (let leaf of leaves) {
				const markdownView = leaf.view as MarkdownView;
				if (markdownView.file?.path === currentFile?.path) {
					container = markdownView.containerEl;
				}
			}
			if (container) {
				const containers = container.querySelectorAll(".mermaid");
				if (containers.length < meraidIndex) {
					return failElement;
				}
				const root = containers[meraidIndex];
				toPng(root as HTMLElement)
					.then((dataUrl) => {
						this.callback.updateElementByID(
							containerId,
							`<img id="${imgId}" class="${MermaidImgClassName}" src="${dataUrl}"></img>`
						);
					})
					.catch((error) => {
						console.error("oops, something went wrong!", error);
						this.callback.updateElementByID(
							containerId,
							failElement
						);
					});
				return `<section id="${containerId}" class="${MermaidSectionClassName}">渲染中</section>`;
			} else {
				console.error("container is null");
				return failElement;
			}
		} catch (error) {
			console.error(error.message);
			return "<span>mermaid渲染失败</span>";
		}
	}

	renderAdCallout(token: Tokens.Code) {
		try {
			// 确保 lang 存在
			if (!token.lang) {
				return this.codeRenderer(token.text, token.lang);
			}

			// 提取 callout 类型（去掉 'ad-' 前缀）
			const calloutType = token.lang.substring(3).toLowerCase();

			// 提取标题 - 默认使用 callout 类型作为标题
			let title = calloutType.charAt(0).toUpperCase() + calloutType.slice(1).toLowerCase();

			// 解析内容，支持 title: xxx 语法
			const lines = token.text.split('\n');
			let content = token.text.trim();
			let contentStartIndex = 0;

			// 检查第一行是否是 title: xxx 格式
			const firstLine = lines[0].trim();
			const titleMatch = firstLine.match(/^title:\s*(.+)$/);

			if (titleMatch) {
				// 如果第一行是 title: xxx 格式，使用指定的标题
				title = titleMatch[1].trim();
				contentStartIndex = 1;
				// 跳过第一行和可能的空行
				while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
					contentStartIndex++;
				}
				content = lines.slice(contentStartIndex).join('\n').trim();
			} else if (firstLine !== '' && lines.length > 1 && lines[1].trim() === '') {
				// 如果第一行不是空行且第二行是空行，第一行作为标题
				title = title.toUpperCase() + ': ' + firstLine;
				contentStartIndex = 2;
				// 跳过可能的多个空行
				while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
					contentStartIndex++;
				}
				content = lines.slice(contentStartIndex).join('\n').trim();
			}
			const body = this.marked.parser(this.marked.lexer(content));

			// 获取 callout 样式信息
			const info = GetCallout(calloutType);
			if (!info) {
				return this.codeRenderer(token.text, token.lang);
			}

			// 生成 callout HTML
			return `<section class="ad ${info.style}"><section class="ad-title-wrap"><span class="ad-icon">${info.icon}</span><span class="ad-title">${title}<span></section><section class="ad-content">${body}</section></section>`;
		} catch (error) {
			console.error('Error rendering ad callout:', error);
			return this.codeRenderer(token.text, token.lang);
		}
	}

	markedExtension() {
		return {
			extensions: [
				{
					name: "code",
					level: "block",
					renderer: (token: Tokens.Code) => {
						// 处理 ad-xxx 语法的 callout
						if (token.lang && token.lang.startsWith("ad-")) {
							return this.renderAdCallout(token);
						}

						// 其他代码块处理逻辑
						if (this.settings.isAuthKeyVaild()) {
							const type = CodeRenderer.getMathType(
								token.lang ?? ""
							);
							if (type) {
								return MathRendererQueue.getInstance().render(
									token,
									false,
									type,
									this.callback
								);
							}
							if (
								token.lang &&
								token.lang.trim().toLocaleLowerCase() ==
								"mermaid"
							) {
								return this.renderMermaid(token);
							}
						}
						if (
							token.lang &&
							token.lang.trim().toLocaleLowerCase() == "mpcard"
						) {
							return this.renderCard(token);
						}
						return this.codeRenderer(token.text, token.lang);
					},
				},
			],
		};
	}
}
