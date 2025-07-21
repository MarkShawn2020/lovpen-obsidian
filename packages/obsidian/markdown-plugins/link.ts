import {MarkedExtension, Tokens} from "marked";

import {logger} from "../../shared/src/logger";
import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

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

	markedExtension(): MarkedExtension {
		return {
			extensions: [{
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
			}]
		}
	}
}
