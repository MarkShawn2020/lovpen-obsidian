import {MarkedExtension, Tokens} from "marked";

import {logger} from "../../shared/src/logger";
import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

interface WikiLinkToken extends Tokens.Generic {
	type: 'wikiLink';
	target: string;
	alias?: string;
}

export class LinkRenderer extends UnifiedMarkdownPlugin {

	getPluginName(): string {
		return "LinkRenderer";
	}

	getPluginDescription(): string {
		return "链接处理插件，优化链接显示和邮箱地址处理";
	}

	// 检查是否为邮箱格式
	isEmailAddress(text: string): boolean {
		// 简单的邮箱格式检测
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
	}

	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	private escapeAttribute(value: string): string {
		return this.escapeHtml(value);
	}

	private isExternalLink(target: string): boolean {
		return /^(https?:\/\/|mailto:)/i.test(target);
	}

	private parseWikiLinkBody(body: string): { target: string; alias?: string } {
		const pipeIndex = body.indexOf('|');
		if (pipeIndex === -1) {
			return {target: body.trim()};
		}

		return {
			target: body.slice(0, pipeIndex).trim(),
			alias: body.slice(pipeIndex + 1).trim(),
		};
	}

	private getWikiDisplayText(target: string, alias?: string): string {
		if (alias) {
			return alias;
		}

		const [filePart, subpath] = target.split('#');
		const fileName = filePart
			.split('/')
			.pop()
			?.replace(/\.(md|markdown)$/i, '') || filePart;

		if (subpath && !subpath.startsWith('^')) {
			return fileName ? `${fileName} > ${subpath}` : subpath;
		}

		return fileName || target;
	}

	markedExtension(): MarkedExtension {
		return {
			extensions: [
				{
					name: 'wikiLink',
					level: 'inline',
					start: (src: string) => src.indexOf('[['),
					tokenizer: (src: string): WikiLinkToken | undefined => {
						const match = /^\[\[([^\]\n]+?)\]\]/.exec(src);
						if (!match) return;

						const {target, alias} = this.parseWikiLinkBody(match[1]);
						if (!target) return;

						return {
							type: 'wikiLink',
							raw: match[0],
							target,
							alias,
						};
					},
					renderer: (token: WikiLinkToken) => {
						const text = this.escapeHtml(this.getWikiDisplayText(token.target, token.alias));

						if (!this.isExternalLink(token.target)) {
							return `<span class="internal-link" data-href="${this.escapeAttribute(token.target)}">${text}</span>`;
						}

						return `<a href="${this.escapeAttribute(token.target)}">${text}</a>`;
					}
				},
				{
					name: 'link', level: 'inline', renderer: (token: Tokens.Link) => {
						logger.debug("Link renderer called for:", token.href);

						// 检查链接文本或链接地址是否为邮箱
						const isMailtoLink = token.href.startsWith('mailto:');
						const textIsEmail = this.isEmailAddress(token.text);

						// 1. 如果是邮箱链接（mailto:），且设置要求保护邮箱，则返回纯文本
						if (isMailtoLink || textIsEmail) {
							// 提取邮箱地址内容
							const emailText = isMailtoLink ? token.href.replace('mailto:', '') : token.text;

							// 如果邮箱看起来像是脚注引用格式的一部分 (如 example@domain.com[1])，保持纯文本
							if (token.text.includes('[') && token.text.includes(']')) {
								return token.text;
							}

							// 其他情况下，保持为普通邮箱文本
							return emailText;
						}


						return `<a href="${token.href}">${token.text}</a>`;
					}
				}
			]
		}
	}
}
