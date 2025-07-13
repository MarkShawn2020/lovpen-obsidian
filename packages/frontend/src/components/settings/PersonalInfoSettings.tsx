import React, {useEffect, useState} from 'react';
import {Button} from '../ui/button';
import {FormInput} from '../ui/FormInput';
import {PersonalInfo} from '../../types';
import {logger} from '../../../../shared/src/logger';
import {persistentStorageService} from '../../services/persistentStorage';
import {AtSign, Camera, Globe, RotateCcw, Save, User, UserCircle} from 'lucide-react';
import {useSettings} from '../../hooks/useSettings';

interface PersonalInfoSettingsProps {
	onClose: () => void;
	onPersonalInfoChange?: (info: PersonalInfo) => void;
	onSaveSettings?: () => void;
}

const defaultPersonalInfo: PersonalInfo = {
	name: '',
	avatar: '',
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

	const [previewUrl, setPreviewUrl] = useState<string>('');

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

	const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// 验证文件类型
		if (!file.type.startsWith('image/')) {
			alert('请选择图片文件');
			return;
		}

		// 验证文件大小（限制2MB）
		if (file.size > 2 * 1024 * 1024) {
			alert('图片文件不能超过2MB');
			return;
		}

		try {
			// 转换为base64
			const reader = new FileReader();
			reader.onload = async (e) => {
				const base64 = e.target?.result as string;
				const newInfo = {
					...localInfo,
					avatar: base64
				};
				setLocalInfo(newInfo);
				setPreviewUrl(base64);

				// 实时更新 Jotai 状态，确保头像持久化
				console.log('[PersonalInfoSettings] Auto-updating avatar to Jotai state');
				updatePersonalInfo(newInfo);

				// 持久化个人信息
				try {
					await persistentStorageService.savePersonalInfo(newInfo);
					logger.info('[PersonalInfoSettings] Personal info with avatar saved successfully');
				} catch (error) {
					logger.error('[PersonalInfoSettings] Failed to save personal info with avatar:', error);
				}
			};
			reader.readAsDataURL(file);
		} catch (error) {
			logger.error('处理头像文件失败:', error);
			alert('处理头像文件失败');
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
			setPreviewUrl('');
		}
	};

	return (
		<div className="space-y-4">
			{/* 头部说明 */}
			<div className="text-center mb-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-1">个人信息设置</h3>
				<p className="text-sm text-gray-600">配置您的个人资料，用于AI生成的内容中</p>
			</div>

			{/* 基本信息表单 */}
			<div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* 头像上传区域 */}
					<div className="space-y-3 md:col-span-2">
						<label className="block text-sm font-medium text-gray-700">头像</label>
						<div className="flex items-center gap-4">
							<div className="relative group">
								<div
									className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
									{(localInfo.avatar || previewUrl) ? (
										<img
											src={previewUrl || localInfo.avatar}
											alt="头像预览"
											className="w-full h-full object-cover"
										/>
									) : (
										<User className="w-6 h-6 text-gray-400"/>
									)}
								</div>
								<div
									className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
									<Camera className="w-4 h-4 text-white"/>
								</div>
							</div>
							<div className="flex-1">
								<input
									type="file"
									accept="image/*"
									onChange={handleAvatarChange}
									className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer cursor-pointer"
								/>
								<p className="text-xs text-gray-500 mt-1">支持 JPG、PNG、GIF 格式，大小不超过 2MB</p>
							</div>
						</div>
					</div>

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
						<label className="block text-sm font-medium text-gray-700">个人简介</label>
						<textarea
							value={localInfo.bio}
							onChange={(e) => handleInputChange('bio', e.target.value)}
							placeholder="介绍一下您自己..."
							rows={3}
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 resize-none transition-colors"
						/>
						<p className="text-xs text-gray-500">简介信息将会在AI生成的内容中作为作者介绍使用</p>
					</div>
				</div>
			</div>

			{/* 操作按钮 */}
			<div className="flex justify-between items-center pt-2">
				<Button
					onClick={handleReset}
					variant="outline"
					className="text-red-600 border-red-300 hover:bg-red-50"
				>
					<RotateCcw className="w-4 h-4 mr-2"/>
					重置信息
				</Button>
				<Button
					onClick={() => {
						console.log('[PersonalInfoSettings] Save button clicked!');
						handleSave();
					}}
					className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
				>
					<Save className="w-4 h-4 mr-2"/>
					保存设置
				</Button>
			</div>
		</div>
	);
};
