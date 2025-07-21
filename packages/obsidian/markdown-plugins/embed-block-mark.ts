import {MarkedExtension, Tokens} from "marked";

import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

const BlockMarkRegex = /^\^[0-9A-Za-z-]+$/;

export class EmbedBlockMark extends UnifiedMarkdownPlugin {
	allLinks: string[] = [];

	async prepare() {
		this.allLinks = [];
	}

	getPluginName(): string {
		return "EmbedBlockMark";
	}

	getPluginDescription(): string {
		return "嵌入块标记处理，支持Obsidian的嵌入语法";
	}

	markedExtension(): MarkedExtension {
		return {
			extensions: [{
				name: 'EmbedBlockMark',
				level: 'inline',
				start(src: string) {
					let index = src.indexOf('^');
					if (index === -1) {
						return;
					}
					return index;
				},
				tokenizer(src: string) {
					const match = src.match(BlockMarkRegex);
					if (match) {
						return {
							type: 'EmbedBlockMark',
							raw: match[0],
							text: match[0]
						};
					}
				},
				renderer: (token: Tokens.Generic) => {
					return `<span data-txt="${token.text}"></span>`;
				}
			}]
		}
	}
}
