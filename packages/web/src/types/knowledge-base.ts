export type ContentType = 'text' | 'document' | 'audio' | 'video' | 'image';

export type SupportedPlatform
  = | 'manual'
    | 'notion'
    | 'flomo'
    | 'wechat-mp'
    | 'wechat-chat'
    | 'feishu'
    | 'dingtalk'
    | 'obsidian'
    | 'roam'
    | 'podcast'
    | 'youtube'
    | 'bilibili';

export type KnowledgeItem = {
  id: string;
  userId: string;
  sourcePlatform: SupportedPlatform;
  sourceId?: string;
  contentType: ContentType;
  title?: string;
  content?: string;
  rawContent?: any;
  metadata: ContentMetadata;
  embedding?: number[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
};

export type ContentMetadata = {
  originalUrl?: string;
  author?: string;
  publishedAt?: string;
  duration?: number; // 音频/视频时长(秒)
  fileSize?: number; // 文件大小(字节)
  language?: string;
  format?: string;
  extractedFrom?: string; // 提取来源
  confidence?: number; // AI处理置信度
  [key: string]: any;
};

export type PlatformIntegration = {
  id: string;
  userId: string;
  platformType: SupportedPlatform;
  authData?: any;
  syncSettings?: PlatformSyncSettings;
  lastSync?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlatformSyncSettings = {
  autoSync?: boolean;
  syncInterval?: number; // 分钟
  syncFilters?: {
    dateRange?: {
      start?: string;
      end?: string;
    };
    tags?: string[];
    contentTypes?: ContentType[];
  };
};

export type ProcessingJob = {
  id: string;
  knowledgeItemId?: string;
  jobType: 'transcription' | 'ocr' | 'embedding' | 'summarization' | 'tagging';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcessedContent = {
  title: string;
  content: string;
  metadata: ContentMetadata;
  embedding?: number[];
  tags: string[];
};

export type SearchFilters = {
  platforms?: SupportedPlatform[];
  contentTypes?: ContentType[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  processingStatus?: Array<'pending' | 'processing' | 'completed' | 'failed'>;
};

export type SearchResult = {
  items: KnowledgeItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
};

// 平台配置
export type PlatformConfig = {
  id: SupportedPlatform;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  color: string;
  supportedContentTypes: ContentType[];
  authType: 'oauth' | 'api-key' | 'file-upload' | 'manual';
  isAvailable: boolean;
  setupInstructions?: string;
};

export const PLATFORM_CONFIGS: Record<SupportedPlatform, PlatformConfig> = {
  'manual': {
    id: 'manual',
    name: '手动上传',
    fullName: '手动上传',
    description: '直接上传文件或输入文本',
    icon: '📝',
    color: 'bg-gray-500',
    supportedContentTypes: ['text', 'document', 'audio', 'video', 'image'],
    authType: 'manual',
    isAvailable: true,
  },
  'notion': {
    id: 'notion',
    name: 'Notion',
    fullName: 'Notion',
    description: '同步 Notion 数据库和页面',
    icon: '📋',
    color: 'bg-black',
    supportedContentTypes: ['text', 'document'],
    authType: 'oauth',
    isAvailable: true,
  },
  'flomo': {
    id: 'flomo',
    name: 'Flomo',
    fullName: 'Flomo',
    description: '同步 flomo 笔记',
    icon: '🔖',
    color: 'bg-blue-500',
    supportedContentTypes: ['text'],
    authType: 'api-key',
    isAvailable: true,
  },
  'wechat-mp': {
    id: 'wechat-mp',
    name: '微信公众号',
    fullName: '微信公众号',
    description: '获取公众号文章',
    icon: '💬',
    color: 'bg-green-500',
    supportedContentTypes: ['text', 'image'],
    authType: 'api-key',
    isAvailable: true,
  },
  'wechat-chat': {
    id: 'wechat-chat',
    name: '微信聊天',
    fullName: '微信聊天记录',
    description: '导入微信聊天记录',
    icon: '💬',
    color: 'bg-green-600',
    supportedContentTypes: ['text', 'image', 'audio'],
    authType: 'file-upload',
    isAvailable: true,
  },
  'feishu': {
    id: 'feishu',
    name: '飞书',
    fullName: '飞书',
    description: '同步飞书文档和消息',
    icon: '🚀',
    color: 'bg-blue-600',
    supportedContentTypes: ['text', 'document'],
    authType: 'oauth',
    isAvailable: true,
  },
  'dingtalk': {
    id: 'dingtalk',
    name: '钉钉',
    fullName: '钉钉',
    description: '同步钉钉群消息和文档',
    icon: '📱',
    color: 'bg-blue-700',
    supportedContentTypes: ['text', 'document'],
    authType: 'oauth',
    isAvailable: false,
  },
  'obsidian': {
    id: 'obsidian',
    name: 'Obsidian',
    fullName: 'Obsidian',
    description: '导入 Obsidian 笔记',
    icon: '🔮',
    color: 'bg-purple-600',
    supportedContentTypes: ['text', 'document'],
    authType: 'file-upload',
    isAvailable: true,
  },
  'roam': {
    id: 'roam',
    name: 'Roam',
    fullName: 'Roam Research',
    description: '导入 Roam Research 数据',
    icon: '🧠',
    color: 'bg-indigo-600',
    supportedContentTypes: ['text'],
    authType: 'file-upload',
    isAvailable: false,
  },
  'podcast': {
    id: 'podcast',
    name: '播客',
    fullName: '播客平台',
    description: '订阅播客并转录内容',
    icon: '🎙️',
    color: 'bg-orange-500',
    supportedContentTypes: ['audio'],
    authType: 'api-key',
    isAvailable: false,
  },
  'youtube': {
    id: 'youtube',
    name: 'YouTube',
    fullName: 'YouTube',
    description: '获取 YouTube 视频字幕',
    icon: '📺',
    color: 'bg-red-600',
    supportedContentTypes: ['video'],
    authType: 'api-key',
    isAvailable: false,
  },
  'bilibili': {
    id: 'bilibili',
    name: 'B站',
    fullName: 'Bilibili',
    description: '获取 B站 视频字幕',
    icon: '📹',
    color: 'bg-pink-500',
    supportedContentTypes: ['video'],
    authType: 'api-key',
    isAvailable: false,
  },
};
