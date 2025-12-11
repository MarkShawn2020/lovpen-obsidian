import {useAtom, useAtomValue, useSetAtom} from 'jotai';
import {useCallback, useEffect} from 'react';
import {
	personalInfoAtom,
	settingsAtom,
	settingsInitializedAtom,
	settingsSaveStatusAtom,
	updatePersonalInfoAtom,
	updateSettingsAtom
} from '../store/atoms';
import {PersonalInfo, ViteReactSettings} from '../types';

export interface UseSettingsReturn {
	personalInfo: PersonalInfo;
	settings: ViteReactSettings;
	saveStatus: 'idle' | 'saving' | 'saved' | 'error';
	isInitialized: boolean;
	updatePersonalInfo: (info: PersonalInfo) => void;
	updateSettings: (settings: Partial<ViteReactSettings>) => void;
	saveSettings: () => void;
	initializeSettings: (settings: ViteReactSettings, personalInfo: PersonalInfo) => void;
}

export const useSettings = (
	onSaveSettings?: () => void,
	onPersonalInfoChange?: (info: PersonalInfo) => void,
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void
): UseSettingsReturn => {
	const [personalInfo, setPersonalInfo] = useAtom(personalInfoAtom);
	const [settings, setSettings] = useAtom(settingsAtom);
	const [saveStatus, setSaveStatus] = useAtom(settingsSaveStatusAtom);
	const isInitialized = useAtomValue(settingsInitializedAtom);
	const updateSettingsAction = useSetAtom(updateSettingsAtom);
	const updatePersonalInfoAction = useSetAtom(updatePersonalInfoAtom);

	const updatePersonalInfo = useCallback((info: PersonalInfo) => {
		console.log('[useSettings] updatePersonalInfo called with:', info);
		updatePersonalInfoAction(info);
		// 立即调用回调，确保后端同步
		if (onPersonalInfoChange) {
			console.log('[useSettings] Calling onPersonalInfoChange with:', info);
			onPersonalInfoChange(info);
		} else {
			console.warn('[useSettings] onPersonalInfoChange is not provided');
		}
	}, [updatePersonalInfoAction, onPersonalInfoChange]);

	const updateSettings = useCallback((settingsUpdate: Partial<ViteReactSettings>) => {
		console.log('[useSettings] updateSettings called with:', settingsUpdate);
		console.log('[useSettings] current settings before update:', settings);
		updateSettingsAction(settingsUpdate);
		// 立即调用回调，确保后端同步
		onSettingsChange?.(settingsUpdate);
	}, [updateSettingsAction, onSettingsChange, settings]);

	const saveSettings = useCallback(() => {
		console.log('[useSettings] saveSettings called');
		setSaveStatus('saving');
		try {
			if (onSaveSettings) {
				console.log('[useSettings] Calling onSaveSettings');
				onSaveSettings();
			} else {
				console.warn('[useSettings] onSaveSettings is not provided');
			}
			setSaveStatus('saved');

			// 2秒后重置状态
			setTimeout(() => {
				setSaveStatus('idle');
			}, 2000);
		} catch (error) {
			console.error('保存设置失败:', error);
			setSaveStatus('error');
		}
	}, [onSaveSettings, setSaveStatus]);

	const initializeSettings = useCallback((settingsData: ViteReactSettings, personalInfoData: PersonalInfo) => {
		// 注意：实际初始化由 initializeSettingsAtom 处理
		// 这里保留接口兼容性，但不直接覆盖数据
		// initializeSettingsAtom 会从 localStorage 读取并优先使用
	}, []);

	// 注意：移除了 settings.personalInfo 同步逻辑
	// 初始化由 initializeSettingsAtom 处理，会优先使用 localStorage 数据

	return {
		personalInfo,
		settings,
		saveStatus,
		isInitialized,
		updatePersonalInfo,
		updateSettings,
		saveSettings,
		initializeSettings
	};
};
