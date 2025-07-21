import {MarkedExtension, Tokens} from "marked";

import {MarkdownPlugin as UnifiedMarkdownPlugin} from "../shared/plugin/markdown-plugin";

interface FootnoteRefToken extends Tokens.Generic {
	type: 'footnoteRef';
	id: string;
}

type FootnoteDefinition = {
	id: string;
	content: string;
};

export class FootnoteRenderer extends UnifiedMarkdownPlugin {
	// 存储所有脚注定义
	footnotes: Map<string, string> = new Map();
	// 存储脚注引用的顺序
	footnoteRefs: string[] = [];
	// 存储预处理中找到的脚注定义
	private footnoteDefs: FootnoteDefinition[] = [];

	async prepare() {
		this.footnotes = new Map();
		this.footnoteRefs = [];
		this.footnoteDefs = [];
	}

	// 预处理Markdown文本，提取脚注定义
	preprocessText(text: string): string {
		// 匹配脚注定义的正则表达式：[^id]: content
		// 确保能匹配文末脚注，即使有多个换行符
		const footnoteDefRegex = /\[\^(\d+|\w+)\]:\s*(.*?)(?=\n\[\^|\n\n|\n*$)/g;

		let modifiedText = text;
		let match;

		// 查找所有脚注定义
		while ((match = footnoteDefRegex.exec(text)) !== null) {
			const id = match[1];
			const content = match[2].trim();

			// 存储脚注定义
			this.footnotes.set(id, content);
			this.footnoteDefs.push({id, content});
			// logger.debug("ADD Footnote:", {id, content});

			// 从原文中移除脚注定义
			modifiedText = modifiedText.replace(match[0], '');
		}

		return modifiedText;
	}

	async postprocess(html: string) {
		// 如果没有脚注引用，直接返回原始 HTML
		if (this.footnoteRefs.length === 0) {
			return html;
		}

		// 在生成脚注列表前，确保所有脚注都有内容
		// 对于没有定义的脚注，添加默认的占位符内容
		for (const id of this.footnoteRefs) {
			// logger.debug("Footnote ID:", id);
			if (!this.footnotes.has(id) || this.footnotes.get(id) === '') {
				// 使用更民友的默认文本
				this.footnotes.set(id, `该脚注未定义内容`);
			}
		}

		// 生成脚注列表HTML
		const footnoteItems = this.footnoteRefs.map(id => {
			// 这里不再需要空字符串作为默认值，因为前面已经确保所有ID都有内容
			const content = this.footnotes.get(id) as string;
			// 移除返回符号和链接，微信平台不支持页内跳转
			return `<li id="fn-${id}">${content}</li>`;
		});

		// 添加脚注部分
		return `${html}
<section class="footnotes">
    <hr>
    <ol>
        ${footnoteItems.join('\n        ')}
    </ol>
</section>`;
	}

	markedExtension(): MarkedExtension {
		return {
			async: false,
			extensions: [{
				name: 'footnoteRef',
				level: 'inline',
				start(src: string) {
					return src.indexOf('[^');
				},
				tokenizer: (src: string): Tokens.Generic | undefined => {
					// 匹配脚注引用 [^id]
					const rule = /^\[\^([\d\w]+)\]/;
					const match = rule.exec(src);

					if (match) {
						return {
							type: 'footnoteRef',
							raw: match[0],
							id: match[1],
							tokens: []
						} as FootnoteRefToken;
					}
					return undefined;
				},
				renderer: (token: FootnoteRefToken) => {
					const id = token.id;

					// 确保脚注ID只记录一次
					if (!this.footnoteRefs.includes(id)) {
						this.footnoteRefs.push(id);
					}

					// 计算脚注编号（从1开始）
					const refIndex = this.footnoteRefs.indexOf(id) + 1;

					// 生成HTML：上标格式的脚注引用
					return `<sup id="fnref-${id}"><a href="#fn-${id}" class="footnote-ref">[${refIndex}]</a></sup>`;
				}
			}]
		};
	}

	async beforePublish() {
		// 确保脚注显示正确，对于每个引用但未定义的脚注，添加占位符
		for (const id of this.footnoteRefs) {
			if (!this.footnotes.has(id)) {
				this.footnotes.set(id, `脚注 ${id} 未定义`);
			}
		}
	}

	getPluginName(): string {
		return "FootnoteRenderer";
	}

	getPluginDescription(): string {
		return "脚注处理，将Markdown脚注转换为可视化的脚注显示";
	}
}
