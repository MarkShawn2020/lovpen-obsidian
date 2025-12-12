import {atom} from 'jotai';
import {atomWithStorage} from 'jotai/utils';
import {PersonalInfo, ViteReactSettings, defaultCloudStorageSettings} from '../types';
import {ArticleInfoData} from '../components/toolbar/ArticleInfo';

// Playground 状态类型
export interface PlaygroundState {
	prompt: string;
	negativePrompt: string;
	style: string;
	aspectRatio: string;
	generatedImages: string[];
	isGenerating: boolean;
	// Vertex AI generationConfig 参数
	temperature: number;
	topP: number;
	seed?: number;
}

// 默认的个人信息
export const defaultPersonalInfo: PersonalInfo = {
	name: '',
	avatar: {
		type: 'default'
	},
	bio: '',
	email: '',
	website: '',
	socialLinks: {}
};

// 默认的文章信息
export const defaultArticleInfo: ArticleInfoData = {
	author: '',
	authorAvatar: undefined,
	publishDate: '',
	articleTitle: '',
	articleSubtitle: '',
	episodeNum: '',
	seriesName: '',
	tags: [],
	summary: '',
	recommendation: ''
};

// 默认的设置
export const defaultSettings: ViteReactSettings = {
	defaultStyle: 'wabi-sabi',
	defaultHighlight: '默认',
	defaultTemplate: 'default',
	useTemplate: false,
	lastSelectedTemplate: '',
	enableThemeColor: false,
	themeColor: '#7852ee',
	useCustomCss: false,
	authKey: '',
	wxInfo: [],
	expandedAccordionSections: [],
	showStyleUI: true,
	personalInfo: defaultPersonalInfo,
	// AI settings
	aiPromptTemplate: '',
	aiModel: '',
	aiProvider: 'claude',
	openRouterApiKey: '',
	openRouterModel: '',
	zenmuxApiKey: '',
	zenmuxModel: '',
	// Other settings
	cloudStorage: defaultCloudStorageSettings
};

// 使用 atomWithStorage 实现自动持久化
export const personalInfoAtom = atomWithStorage<PersonalInfo>(
	'lovpen-personal-info',
	defaultPersonalInfo
);

export const articleInfoAtom = atomWithStorage<ArticleInfoData>(
	'lovpen-article-info',
	defaultArticleInfo
);

export const settingsAtom = atomWithStorage<ViteReactSettings>(
	'lovpen-settings',
	defaultSettings
);

// 设置保存状态的atom
export const settingsSaveStatusAtom = atom<'idle' | 'saving' | 'saved' | 'error'>('idle');

// 设置初始化状态的atom
export const settingsInitializedAtom = atom<boolean>(false);

// 用于从外部更新设置的atom
export const updateSettingsAtom = atom(
	null,
	(get, set, update: Partial<ViteReactSettings>) => {
		const currentSettings = get(settingsAtom);
		const newSettings = {...currentSettings, ...update};
		console.log('[updateSettingsAtom] Updating settings:', {
			update,
			before: currentSettings.hideFirstHeading,
			after: newSettings.hideFirstHeading
		});
		set(settingsAtom, newSettings);

		// 同步更新个人信息
		if (update.personalInfo) {
			set(personalInfoAtom, update.personalInfo);
		}
	}
);

// 用于从外部更新个人信息的atom
export const updatePersonalInfoAtom = atom(
	null,
	(get, set, update: PersonalInfo) => {
		set(personalInfoAtom, update);

		// 同步更新设置中的个人信息
		const currentSettings = get(settingsAtom);
		set(settingsAtom, {...currentSettings, personalInfo: update});
	}
);

// 用于更新文章信息的atom
export const updateArticleInfoAtom = atom(
	null,
	(get, set, update: Partial<ArticleInfoData>) => {
		const current = get(articleInfoAtom);
		set(articleInfoAtom, {...current, ...update});
	}
);

// 用于重置设置的atom
export const resetSettingsAtom = atom(
	null,
	(get, set) => {
		set(settingsAtom, defaultSettings);
		set(personalInfoAtom, defaultPersonalInfo);
		set(articleInfoAtom, defaultArticleInfo);
		set(settingsSaveStatusAtom, 'idle');
	}
);

// 从 localStorage 直接读取数据的辅助函数
const getStoredData = <T>(key: string, defaultValue: T): T => {
	try {
		const stored = localStorage.getItem(key);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn(`[atoms] Failed to parse ${key} from localStorage:`, e);
	}
	return defaultValue;
};

// 用于初始化设置的atom（兼容旧的初始化逻辑）
export const initializeSettingsAtom = atom(
	null,
	(get, set, {settings, personalInfo}: { settings: ViteReactSettings; personalInfo: PersonalInfo }) => {
		// 直接从 localStorage 读取，避免 atomWithStorage 异步问题
		const storedSettings = getStoredData<ViteReactSettings>('lovpen-settings', defaultSettings);
		const storedPersonalInfo = getStoredData<PersonalInfo>('lovpen-personal-info', defaultPersonalInfo);
		const storedArticleInfo = getStoredData<ArticleInfoData>('lovpen-article-info', defaultArticleInfo);

		// 优先使用 localStorage 中的值
		const hasStoredPersonalInfo = storedPersonalInfo.name && storedPersonalInfo.name.trim() !== '';
		const finalPersonalInfo = hasStoredPersonalInfo ? storedPersonalInfo : personalInfo;

		const mergedSettings = {
			...settings,
			...storedSettings,
			personalInfo: finalPersonalInfo
		};

		set(settingsAtom, mergedSettings);
		set(personalInfoAtom, finalPersonalInfo);
		set(articleInfoAtom, storedArticleInfo);
		set(settingsInitializedAtom, true);
	}
);

// Playground 默认状态
export const defaultPlaygroundState: PlaygroundState = {
	prompt: '',
	negativePrompt: '',
	style: 'illustration',
	aspectRatio: '1:1',
	generatedImages: [],
	isGenerating: false,
	// Vertex AI 默认值
	temperature: 1.0,
	topP: 0.95,
	seed: undefined
};

// Playground 状态 atom（持久化）
export const playgroundAtom = atomWithStorage<PlaygroundState>(
	'lovpen-playground',
	defaultPlaygroundState
);
