import { marked } from 'marked';

/**
 * 快速Markdown解析器
 * 只做基本的Markdown到HTML转换，不经过插件处理
 * 用于实现即时预览
 */
export class QuickMarkdownParser {
    private static instance: QuickMarkdownParser;
    private renderer: any; // marked的渲染器
    
    private constructor() {
        // 配置marked选项
        marked.setOptions({
            breaks: true,
            gfm: true,
            pedantic: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        } as any);
        
        // 创建自定义渲染器
        this.renderer = new (marked as any).Renderer();
        
        // 自定义代码块渲染（简化版）
        this.renderer.code = (code: string, language?: string) => {
            const lang = language || 'plaintext';
            return `<pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`;
        };
        
        // 自定义链接渲染
        this.renderer.link = (href: string, title: string | null, text: string) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
        };
        
        // 自定义图片渲染
        this.renderer.image = (href: string, title: string | null, text: string) => {
            const titleAttr = title ? ` title="${title}"` : '';
            const altAttr = text ? ` alt="${text}"` : '';
            return `<img src="${href}"${altAttr}${titleAttr} loading="lazy">`;
        };
    }
    
    static getInstance(): QuickMarkdownParser {
        if (!QuickMarkdownParser.instance) {
            QuickMarkdownParser.instance = new QuickMarkdownParser();
        }
        return QuickMarkdownParser.instance;
    }
    
    /**
     * 快速解析Markdown为HTML
     * @param markdown Markdown文本
     * @returns HTML字符串
     */
    parse(markdown: string): string {
        try {
            const result = marked(markdown, { renderer: this.renderer });
            // marked可能返回Promise<string>或string，我们需要确保返回string
            if (typeof result === 'string') {
                return result;
            }
            // 如果是Promise，使用同步版本
            return (marked as any).parseInline(markdown, { renderer: this.renderer }) || '';
        } catch (error) {
            console.error('快速解析Markdown失败:', error);
            return `<div class="error">解析失败</div>`;
        }
    }
    
    /**
     * 转义HTML特殊字符
     */
    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}