import React, {useState} from 'react';
import {PersonalInfoSettings} from './PersonalInfoSettings';
import {AISettings} from './AISettings';
import {PersonalInfo, ViteReactSettings} from '../../types';
import {Bot, Globe, Settings, User, X} from 'lucide-react';
import {useSettings} from '../../hooks/useSettings';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onPersonalInfoChange?: (info: PersonalInfo) => void;
	onSaveSettings?: () => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
																isOpen,
																onClose,
																onPersonalInfoChange,
																onSaveSettings,
																onSettingsChange
															}) => {
	const {saveStatus} = useSettings(onSaveSettings, onPersonalInfoChange, onSettingsChange);
	const [activeTab, setActiveTab] = useState<'personal' | 'ai' | 'general'>(() => {
		try {
			const saved = localStorage.getItem('lovpen-settings-active-tab') as 'personal' | 'ai' | 'general';
			return saved || 'personal';
		} catch {
			return 'personal';
		}
	});

	// 调试信息
	React.useEffect(() => {
		if (isOpen) {
			console.log('[SettingsModal] Modal opened');
			console.log('[SettingsModal] onPersonalInfoChange:', !!onPersonalInfoChange);
			console.log('[SettingsModal] onSaveSettings:', !!onSaveSettings);
			console.log('[SettingsModal] onSettingsChange:', !!onSettingsChange);
		}
	}, [isOpen, onPersonalInfoChange, onSaveSettings, onSettingsChange]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
			{/* 背景遮罩 */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* 模态框内容 */}
			<div className="relative z-10 w-full max-w-sm sm:max-w-2xl lg:max-w-5xl max-h-[95vh] overflow-hidden">
				<div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl">
					{/* 头部 */}
					<div
						className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-3 sm:px-6 py-4 sm:py-6 text-white">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-white/20 rounded-lg">
									<Settings className="h-6 w-6"/>
								</div>
								<div>
									<h2 className="text-2xl font-bold">应用设置</h2>
									<p className="text-blue-100 mt-1">配置您的个人信息和应用偏好</p>
								</div>
							</div>
							<button
								onClick={onClose}
								className="p-2 hover:bg-white/20 rounded-lg transition-colors"
							>
								<X className="h-6 w-6"/>
							</button>
						</div>

						{/* 标签页导航 */}
						<div className="flex gap-1 mt-6">
							{[
								{key: 'personal', label: '个人信息', icon: User},
								{key: 'ai', label: 'AI设置', icon: Bot},
								{key: 'general', label: '通用设置', icon: Globe}
							].map(({key, label, icon: Icon}) => (
								<button
									key={key}
									onClick={() => {
										const tabKey = key as 'personal' | 'ai' | 'general';
										setActiveTab(tabKey);
										// 持久化保存选中的tab
										try {
											localStorage.setItem('lovpen-settings-active-tab', tabKey);
										} catch (error) {
											console.warn('Failed to save settings tab to localStorage:', error);
										}
									}}
									className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
										activeTab === key
											? 'bg-white text-blue-600 shadow-lg'
											: 'text-blue-100 hover:bg-white/20'
									}`}
								>
									<Icon className="h-4 w-4"/>
									{label}
								</button>
							))}
						</div>
					</div>

					{/* 内容区域 */}
					<div className="p-6 max-h-[60vh] overflow-y-auto">
						{activeTab === 'personal' && (
							<PersonalInfoSettings
								onClose={onClose}
								onPersonalInfoChange={onPersonalInfoChange}
								onSaveSettings={onSaveSettings}
							/>
						)}

						{activeTab === 'ai' && (
							<AISettings
								onClose={onClose}
								onSettingsChange={onSettingsChange}
								onSaveSettings={onSaveSettings}
							/>
						)}

						{activeTab === 'general' && (
							<div className="space-y-6">
								<div className="text-center">
									<h3 className="text-lg font-semibold text-gray-900 mb-2">通用设置</h3>
									<p className="text-gray-600">应用的基础配置和偏好设置</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{[
										{
											title: '应用主题设置',
											desc: '选择明亮或暗色主题',
											icon: '🎨',
											status: '即将推出'
										},
										{title: '语言偏好', desc: '设置界面显示语言', icon: '🌍', status: '即将推出'},
										{title: '快捷键配置', desc: '自定义键盘快捷键', icon: '⌨️', status: '即将推出'},
										{
											title: '数据导入/导出',
											desc: '备份和恢复设置数据',
											icon: '📁',
											status: '即将推出'
										}
									].map((feature, index) => (
										<div key={index}
											 className="group border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all">
											<div className="flex items-center gap-3 mb-3">
												<div
													className="p-2 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
													<span className="text-xl">{feature.icon}</span>
												</div>
												<div>
													<h4 className="font-semibold text-gray-900">{feature.title}</h4>
													<p className="text-sm text-gray-500">{feature.desc}</p>
												</div>
											</div>
											<div className="flex items-center justify-between">
												<span
													className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
													{feature.status}
												</span>
											</div>
										</div>
									))}
								</div>

								<div
									className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
									<h4 className="font-medium text-blue-900 mb-2">🚀 功能路线图</h4>
									<p className="text-sm text-blue-800">
										我们正在持续完善应用功能，更多实用设置选项将在后续版本中推出。
										如果您有特定需求或建议，欢迎反馈！
									</p>
								</div>
							</div>
						)}
					</div>

					{/* 底部操作栏 */}
					<div className="border-t bg-gray-50 px-6 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-sm text-gray-500">
								<span className={`w-2 h-2 rounded-full ${
									saveStatus === 'saved' ? 'bg-green-500' :
										saveStatus === 'saving' ? 'bg-yellow-500' :
											saveStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
								}`}></span>
								{saveStatus === 'saved' ? '设置已同步保存' :
									saveStatus === 'saving' ? '正在保存...' :
										saveStatus === 'error' ? '保存失败' : '等待保存'}
							</div>
							<button
								onClick={() => {
									console.log('[SettingsModal] 完成设置 button clicked!');
									// 确保在关闭前保存数据
									if (onSaveSettings) {
										console.log('[SettingsModal] Auto-saving before close');
										onSaveSettings();
									}
									onClose();
								}}
								className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg"
							>
								完成设置
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
