import type { ContentMetadata, ContentType, ProcessedContent } from '@/types/knowledge-base';

export type ContentProcessor = {
  process: (rawContent: any, metadata?: Partial<ContentMetadata>) => Promise<ProcessedContent>;
  canProcess: (contentType: ContentType) => boolean;
};

export class ContentProcessorFactory {
  private static processors: Map<ContentType, ContentProcessor> = new Map();

  static initialize() {
    // 注册各种处理器
    ContentProcessorFactory.registerProcessor('text', new TextProcessor());
    ContentProcessorFactory.registerProcessor('document', new DocumentProcessor());
    ContentProcessorFactory.registerProcessor('audio', new AudioProcessor());
    ContentProcessorFactory.registerProcessor('video', new VideoProcessor());
    ContentProcessorFactory.registerProcessor('image', new ImageProcessor());
  }

  static registerProcessor(type: ContentType, processor: ContentProcessor): void {
    this.processors.set(type, processor);
  }

  static createProcessor(contentType: ContentType): ContentProcessor {
    if (this.processors.size === 0) {
      this.initialize();
    }
    const processor = this.processors.get(contentType);
    if (!processor) {
      throw new Error(`No processor found for content type: ${contentType}`);
    }
    return processor;
  }

  static async processContent(
    contentType: ContentType,
    rawContent: any,
    metadata?: Partial<ContentMetadata>,
  ): Promise<ProcessedContent> {
    if (this.processors.size === 0) {
      this.initialize();
    }
    const processor = this.createProcessor(contentType);
    return await processor.process(rawContent, metadata);
  }
}

// 文本处理器
export class TextProcessor implements ContentProcessor {
  canProcess(contentType: ContentType): boolean {
    return contentType === 'text';
  }

  async process(rawContent: any, metadata: Partial<ContentMetadata> = {}): Promise<ProcessedContent> {
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

    return {
      title: this.extractTitle(content),
      content,
      metadata: {
        ...metadata,
        language: this.detectLanguage(content),
        wordCount: this.countWords(content),
        format: 'text/plain',
      },
      tags: await this.extractTags(content),
    };
  }

  private extractTitle(content: string): string {
    // 提取第一行作为标题，或者从内容中智能提取
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }

    // 如果第一行太长，提取前50个字符
    return content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
  }

  private detectLanguage(content: string): string {
    // 简单的语言检测，可以集成更高级的语言检测库
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    const englishChars = content.match(/[a-z]/gi);

    if (chineseChars && chineseChars.length > (englishChars?.length || 0)) {
      return 'zh';
    }
    return 'en';
  }

  private countWords(content: string): number {
    // 中文按字符数，英文按单词数
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    const englishWords = content.match(/[a-z]+/gi);

    return (chineseChars?.length || 0) + (englishWords?.length || 0);
  }

  private async extractTags(content: string): Promise<string[]> {
    // 简单的标签提取，可以集成 NLP 库或 AI 服务
    const tags: string[] = [];

    // 提取 #标签
    const hashTags = content.match(/#[\u4E00-\u9FFF\w]+/g);
    if (hashTags) {
      tags.push(...hashTags.map(tag => tag.substring(1)));
    }

    // 基于关键词的标签提取
    const keywords = ['技术', '产品', '设计', '管理', '创业', '思考', '学习'];
    keywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // 去重
  }
}

// 文档处理器
export class DocumentProcessor implements ContentProcessor {
  canProcess(contentType: ContentType): boolean {
    return contentType === 'document';
  }

  async process(rawContent: any, metadata: Partial<ContentMetadata> = {}): Promise<ProcessedContent> {
    let content = '';
    let title = '';

    if (typeof rawContent === 'string') {
      content = rawContent;
    } else if (rawContent instanceof File) {
      content = await this.extractTextFromFile(rawContent);
      title = rawContent.name.replace(/\.[^/.]+$/, ''); // 去掉文件扩展名
    } else {
      content = JSON.stringify(rawContent);
    }

    return {
      title: title || this.extractTitle(content),
      content,
      metadata: {
        ...metadata,
        format: this.detectFormat(rawContent),
        wordCount: this.countWords(content),
        language: this.detectLanguage(content),
      },
      tags: await this.extractTags(content),
    };
  }

  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      return await this.extractFromPDF(file);
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return await this.extractFromWord(file);
    } else if (fileType === 'text/plain' || fileType === 'text/markdown') {
      return await file.text();
    }

    // 默认尝试作为文本读取
    return await file.text();
  }

  private async extractFromPDF(file: File): Promise<string> {
    // TODO: 集成 PDF 解析库，如 pdf-parse
    // 临时实现：返回占位符
    return `[PDF文档: ${file.name}]\n\n内容提取功能开发中...`;
  }

  private async extractFromWord(file: File): Promise<string> {
    // TODO: 集成 Word 文档解析库，如 mammoth
    // 临时实现：返回占位符
    return `[Word文档: ${file.name}]\n\n内容提取功能开发中...`;
  }

  private detectFormat(rawContent: any): string {
    if (rawContent instanceof File) {
      return rawContent.type;
    }
    return 'text/plain';
  }

  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0]?.trim();
    return firstLine && firstLine.length < 100 ? firstLine : `${content.substring(0, 50)}...`;
  }

  private detectLanguage(content: string): string {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    return chineseChars && chineseChars.length > 10 ? 'zh' : 'en';
  }

  private countWords(content: string): number {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    const englishWords = content.match(/[a-z]+/gi);
    return (chineseChars?.length || 0) + (englishWords?.length || 0);
  }

  private async extractTags(content: string): Promise<string[]> {
    const tags: string[] = [];

    // 文档类型标签
    tags.push('文档');

    // 基于内容的标签
    const keywords = ['报告', '总结', '方案', '分析', '规划', '设计', '教程'];
    keywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)];
  }
}

// 音频处理器
export class AudioProcessor implements ContentProcessor {
  canProcess(contentType: ContentType): boolean {
    return contentType === 'audio';
  }

  async process(rawContent: any, metadata: Partial<ContentMetadata> = {}): Promise<ProcessedContent> {
    let transcription = '';
    let title = '';
    let audioMetadata: Partial<ContentMetadata> = {};

    if (rawContent instanceof File) {
      title = rawContent.name.replace(/\.[^/.]+$/, '');
      audioMetadata = {
        fileSize: rawContent.size,
        format: rawContent.type,
        duration: await this.getAudioDuration(rawContent),
      };

      // 转录音频
      transcription = await this.transcribeAudio(rawContent);
    } else if (typeof rawContent === 'string') {
      transcription = rawContent;
    }

    return {
      title: title || this.extractTitle(transcription),
      content: transcription,
      metadata: {
        ...metadata,
        ...audioMetadata,
        language: this.detectLanguage(transcription),
        wordCount: this.countWords(transcription),
      },
      tags: await this.extractTags(transcription),
    };
  }

  private async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0);
      };
      audio.src = URL.createObjectURL(file);
    });
  }

  private async transcribeAudio(file: File): Promise<string> {
    // TODO: 集成 Whisper API 或其他语音识别服务
    // 临时实现：返回占位符
    return `[音频文件: ${file.name}]\n\n语音转录功能开发中...\n\n预计时长: ${Math.floor(file.size / 1024 / 1024)}MB`;
  }

  private extractTitle(content: string): string {
    if (!content || content.includes('语音转录功能开发中')) {
      return '音频内容';
    }
    return `${content.substring(0, 30)}...`;
  }

  private detectLanguage(content: string): string {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    return chineseChars && chineseChars.length > 5 ? 'zh' : 'en';
  }

  private countWords(content: string): number {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    const englishWords = content.match(/[a-z]+/gi);
    return (chineseChars?.length || 0) + (englishWords?.length || 0);
  }

  private async extractTags(content: string): Promise<string[]> {
    const tags = ['音频', '语音'];

    // 基于内容的标签
    const keywords = ['播客', '会议', '采访', '讲座', '音乐', '通话'];
    keywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)];
  }
}

// 视频处理器
export class VideoProcessor implements ContentProcessor {
  canProcess(contentType: ContentType): boolean {
    return contentType === 'video';
  }

  async process(rawContent: any, metadata: Partial<ContentMetadata> = {}): Promise<ProcessedContent> {
    let content = '';
    let title = '';
    let videoMetadata: Partial<ContentMetadata> = {};

    if (rawContent instanceof File) {
      title = rawContent.name.replace(/\.[^/.]+$/, '');
      videoMetadata = {
        fileSize: rawContent.size,
        format: rawContent.type,
        duration: await this.getVideoDuration(rawContent),
      };

      // 提取视频字幕或转录
      content = await this.extractVideoContent(rawContent);
    } else if (typeof rawContent === 'string') {
      content = rawContent;
    }

    return {
      title: title || this.extractTitle(content),
      content,
      metadata: {
        ...metadata,
        ...videoMetadata,
        language: this.detectLanguage(content),
        wordCount: this.countWords(content),
      },
      tags: await this.extractTags(content),
    };
  }

  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  private async extractVideoContent(file: File): Promise<string> {
    // TODO: 集成视频处理库，提取字幕或转录音频
    // 临时实现：返回占位符
    return `[视频文件: ${file.name}]\n\n视频内容提取功能开发中...\n\n文件大小: ${Math.floor(file.size / 1024 / 1024)}MB`;
  }

  private extractTitle(content: string): string {
    if (!content || content.includes('视频内容提取功能开发中')) {
      return '视频内容';
    }
    return `${content.substring(0, 30)}...`;
  }

  private detectLanguage(content: string): string {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    return chineseChars && chineseChars.length > 5 ? 'zh' : 'en';
  }

  private countWords(content: string): number {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    const englishWords = content.match(/[a-z]+/gi);
    return (chineseChars?.length || 0) + (englishWords?.length || 0);
  }

  private async extractTags(content: string): Promise<string[]> {
    const tags = ['视频'];

    // 基于内容的标签
    const keywords = ['教程', '演示', '会议', '讲座', '娱乐', '新闻'];
    keywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)];
  }
}

// 图像处理器
export class ImageProcessor implements ContentProcessor {
  canProcess(contentType: ContentType): boolean {
    return contentType === 'image';
  }

  async process(rawContent: any, metadata: Partial<ContentMetadata> = {}): Promise<ProcessedContent> {
    let content = '';
    let title = '';
    let imageMetadata: Partial<ContentMetadata> = {};

    if (rawContent instanceof File) {
      title = rawContent.name.replace(/\.[^/.]+$/, '');
      imageMetadata = {
        fileSize: rawContent.size,
        format: rawContent.type,
      };

      // OCR 提取文字
      content = await this.extractTextFromImage(rawContent);
    } else if (typeof rawContent === 'string') {
      content = rawContent;
    }

    return {
      title: title || this.extractTitle(content),
      content,
      metadata: {
        ...metadata,
        ...imageMetadata,
        language: this.detectLanguage(content),
        wordCount: this.countWords(content),
      },
      tags: await this.extractTags(content, title),
    };
  }

  private async extractTextFromImage(file: File): Promise<string> {
    // TODO: 集成 OCR 服务，如 Tesseract.js 或云 OCR API
    // 临时实现：返回占位符
    return `[图片文件: ${file.name}]\n\nOCR 文字识别功能开发中...\n\n文件大小: ${Math.floor(file.size / 1024)}KB`;
  }

  private extractTitle(content: string): string {
    if (!content || content.includes('OCR 文字识别功能开发中')) {
      return '图片内容';
    }
    return `${content.substring(0, 30)}...`;
  }

  private detectLanguage(content: string): string {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    return chineseChars && chineseChars.length > 3 ? 'zh' : 'en';
  }

  private countWords(content: string): number {
    const chineseChars = content.match(/[\u4E00-\u9FFF]/g);
    const englishWords = content.match(/[a-z]+/gi);
    return (chineseChars?.length || 0) + (englishWords?.length || 0);
  }

  private async extractTags(content: string, fileName: string): Promise<string[]> {
    const tags = ['图片'];

    // 基于文件名的标签
    const fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    fileExtensions.forEach((ext) => {
      if (fileName.toLowerCase().includes(ext)) {
        tags.push(ext.toUpperCase());
      }
    });

    // 基于内容的标签
    const keywords = ['截图', '图表', '照片', '设计', '文档'];
    keywords.forEach((keyword) => {
      if (content.includes(keyword) || fileName.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)];
  }
}
