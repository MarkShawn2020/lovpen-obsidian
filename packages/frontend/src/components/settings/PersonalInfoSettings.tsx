import React, {useEffect, useState} from 'react';
import {Button} from '../ui/button';
import {FormInput} from '../ui/FormInput';
import {PersonalInfo, AvatarConfig} from '../../types';
import {logger} from '../../../../shared/src/logger';
import {persistentStorageService} from '../../services/persistentStorage';
import {AtSign, Globe, RotateCcw, Save, UserCircle} from 'lucide-react';
import {useSettings} from '../../hooks/useSettings';
import {AvatarUpload} from '../ui/AvatarUpload';

interface PersonalInfoSettingsProps {
	onClose: () => void;
	onPersonalInfoChange?: (info: PersonalInfo) => void;
	onSaveSettings?: () => void;
}

const defaultPersonalInfo: PersonalInfo = {
	name: '',
	avatar: {
		type: 'default'
	},
	bio: '',
	email: '',
	website: ''
};

export const PersonalInfoSettings: React.FC<PersonalInfoSettingsProps> = ({
																			  onClose,
																			  onPersonalInfoChange,
																			  onSaveSettings
																		  }) => {
	console.log('[PersonalInfoSettings] Component rendered');
	console.log('[PersonalInfoSettings] onPersonalInfoChange:', !!onPersonalInfoChange);
	console.log('[PersonalInfoSettings] onSaveSettings:', !!onSaveSettings);

	const {
		personalInfo,
		saveStatus,
		updatePersonalInfo,
		saveSettings
	} = useSettings(onSaveSettings, onPersonalInfoChange);

	console.log('[PersonalInfoSettings] personalInfo from useSettings:', personalInfo);
	console.log('[PersonalInfoSettings] saveStatus:', saveStatus);
	const [localInfo, setLocalInfo] = useState<PersonalInfo>(() => ({
		...defaultPersonalInfo,
		...personalInfo
	}));

	// 只在组件初始化时设置 localInfo，避免覆盖用户输入
	useEffect(() => {
		console.log('[PersonalInfoSettings] Initial personalInfo:', personalInfo);
		setLocalInfo({
			...defaultPersonalInfo,
			...personalInfo
		});
	}, []); // 空依赖数组，只在组件挂载时执行一次

	const handleInputChange = (field: keyof PersonalInfo, value: string) => {
		console.log('[PersonalInfoSettings] handleInputChange called:', field, value);
		setLocalInfo(prev => {
			const newInfo = {
				...prev,
				[field]: value
			};
			console.log('[PersonalInfoSettings] localInfo updated to:', newInfo);

			// 实时更新 Jotai 状态，这样用户不需要点击保存按钮
			console.log('[PersonalInfoSettings] Auto-updating Jotai state');
			updatePersonalInfo(newInfo);

			return newInfo;
		});
	};

	const handleAvatarConfigChange = async (avatarConfig: AvatarConfig) => {
		console.log('[PersonalInfoSettings] Avatar config changed:', avatarConfig);
		
		const newInfo = {
			...localInfo,
			avatar: avatarConfig
		};
		
		setLocalInfo(newInfo);
		
		// 实时更新 Jotai 状态，确保头像持久化
		console.log('[PersonalInfoSettings] Auto-updating avatar config to Jotai state');
		updatePersonalInfo(newInfo);

		// 持久化个人信息
		try {
			await persistentStorageService.savePersonalInfo(newInfo);
			logger.info('[PersonalInfoSettings] Personal info with avatar config saved successfully');
		} catch (error) {
			logger.error('[PersonalInfoSettings] Failed to save personal info with avatar config:', error);
		}
	};

	const handleSave = () => {
		console.log('[PersonalInfoSettings] handleSave called with localInfo:', localInfo);

		// 验证必填字段
		if (!localInfo.name.trim()) {
			console.log('[PersonalInfoSettings] Validation failed: name is empty');
			alert('请输入姓名');
			return;
		}

		console.log('[PersonalInfoSettings] Validation passed, updating personal info');
		// 使用jotai更新个人信息
		updatePersonalInfo(localInfo);
		saveSettings();
		logger.info('个人信息已保存:', localInfo);
		onClose();
	};

	const handleReset = () => {
		if (confirm('确定要重置个人信息吗？')) {
			setLocalInfo(defaultPersonalInfo);
			updatePersonalInfo(defaultPersonalInfo);
		}
	};

	return (
		<div className="space-y-6">
			{/* 头部说明 */}
			<div className="text-center">
				<h3 className="text-lg font-semibold text-[#181818] mb-2 tracking-tight">个人信息设置</h3>
				<p className="text-sm text-[#87867F]">配置您的个人资料，用于AI生成的内容中</p>
			</div>

			{/* 头像管理区域 */}
			<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
				<h4 className="text-base font-semibold text-[#181818] mb-4 tracking-tight">头像设置</h4>
				<AvatarUpload
					currentConfig={localInfo.avatar}
					userName={localInfo.name}
					onConfigChange={handleAvatarConfigChange}
					size="lg"
				/>
			</div>

			{/* 基本信息表单 */}
			<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6 shadow-sm">
				<h4 className="text-base font-semibold text-[#181818] mb-4 tracking-tight">基本资料</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

					{/* 姓名 */}
					<FormInput
						label="姓名"
						value={localInfo.name || ''}
						onChange={(value) => handleInputChange('name', value)}
						placeholder="请输入您的姓名"
						type="text"
						required={true}
						icon={UserCircle}
					/>

					{/*邮箱 */}
					<FormInput
						label="邮箱地址"
						value={localInfo.email || ''}
						onChange={(value) => handleInputChange('email', value)}
						placeholder="your@email.com"
						type="email"
						icon={AtSign}
					/>

					{/* 个人网站 */}
					<FormInput
						label="个人网站"
						value={localInfo.website || ''}
						onChange={(value) => handleInputChange('website', value)}
						placeholder="https://your-website.com"
						type="url"
						icon={Globe}
						containerClassName="md:col-span-2"
					/>

					{/* 个人简介 */}
					<div className="space-y-2 md:col-span-2">
						<label className="block text-sm font-medium text-[#181818]">个人简介</label>
						<textarea
							value={localInfo.bio}
							onChange={(e) => handleInputChange('bio', e.target.value)}
							placeholder="介绍一下您自己..."
							rows={3}
							className="w-full px-3 py-3 border border-[#E8E6DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-[#D97757] resize-none transition-all text-sm"
						/>
						<p className="text-xs text-[#87867F]">简介信息将会在AI生成的内容中作为作者介绍使用</p>
					</div>
				</div>
			</div>

			{/* 操作按钮 */}
			<div className="flex justify-between items-center pt-2">
				<Button
					onClick={handleReset}
					variant="outline"
					className="border-[#E8E6DC] text-[#87867F] hover:bg-[#F0EEE6] hover:text-[#181818] rounded-xl font-medium"
				>
					<RotateCcw className="w-4 h-4 mr-2"/>
					重置信息
				</Button>
				<Button
					onClick={() => {
						console.log('[PersonalInfoSettings] Save button clicked!');
						handleSave();
					}}
					className="bg-[#D97757] hover:bg-[#CC785C] text-white shadow-sm rounded-xl font-medium px-6 py-2"
				>
					<Save className="w-4 h-4 mr-2"/>
					保存设置
				</Button>
			</div>
		</div>
	);
};
