import {Lexer, MarkedExtension, Token, Tokens} from "marked";

import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

const highlightRegex = /^==(.*?)==/;

export class TextHighlight extends UnifiedMarkdownPlugin {
	getPluginName(): string {
		return "TextHighlight";
	}

	getPluginDescription(): string {
		return "文本高亮处理，将==高亮==语法转换为高亮显示";
	}

	markedExtension(): MarkedExtension {
		const self = this;
		return {
			extensions: [{
				name: 'InlineHighlight',
				level: 'inline',
				start(src: string) {
					let index;
					let indexSrc = src;

					while (indexSrc) {
						index = indexSrc.indexOf('==');
						if (index === -1) return;
						return index;
					}
				},
				tokenizer(src: string, tokens: Token[]) {
					const match = src.match(highlightRegex);
					if (match) {
						return {
							type: 'InlineHighlight',
							raw: match[0],
							text: match[1],
						};
					}
				},
				renderer(token: Tokens.Generic) {
					const lexer = new Lexer();
					const tokens = lexer.lex(token.text);
					// TODO: 优化一下
					let body = self.marked.parser(tokens)
					body = body.replace('<p>', '')
					body = body.replace('</p>', '')
					return `<span class="note-highlight">${body}</span>`;
				}
			}]
		};
	}
}
