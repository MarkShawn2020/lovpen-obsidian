import {atom} from 'jotai';
import {PersonalInfo, ViteReactSettings} from '../types';

// 默认的个人信息
export const defaultPersonalInfo: PersonalInfo = {
	name: '',
	avatar: {
		type: 'default'
	},
	bio: '',
	email: '',
	website: ''
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
	aiPromptTemplate: '',
	aiModel: 'claude-3-5-haiku-latest'
};

// 个人信息的atom
export const personalInfoAtom = atom<PersonalInfo>(defaultPersonalInfo);

// 设置的atom
export const settingsAtom = atom<ViteReactSettings>(defaultSettings);

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

// 用于重置设置的atom
export const resetSettingsAtom = atom(
	null,
	(get, set) => {
		set(settingsAtom, defaultSettings);
		set(personalInfoAtom, defaultPersonalInfo);
		set(settingsSaveStatusAtom, 'idle');
	}
);

// 用于初始化设置的atom
export const initializeSettingsAtom = atom(
	null,
	(get, set, {settings, personalInfo}: { settings: ViteReactSettings; personalInfo: PersonalInfo }) => {
		set(settingsAtom, settings);
		set(personalInfoAtom, personalInfo);
		set(settingsInitializedAtom, true);
	}
);
