import React, {useEffect, useState} from "react";
import {TemplateKitSelector} from "./TemplateKitSelector";
import {CoverDesigner} from "./CoverDesigner";
import {ArticleInfo, ArticleInfoData} from "./ArticleInfo";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../ui/tabs";
import {ConfigComponent} from "./PluginConfigComponent";
import {PersonalInfoSettings} from "../settings/PersonalInfoSettings";
import {AISettings} from "../settings/AISettings";
import {PersonalInfo, UnifiedPluginData, ViteReactSettings, CloudStorageSettings, defaultCloudStorageSettings, UploadedImage} from "../../types";
import {CoverData} from "@/components/toolbar/CoverData";
import {logger} from "../../../../shared/src/logger";
import {FileText, Package, Plug, Zap, User, Bot, Globe, PanelLeft, PanelRight, Image, Palette, Menu, ChevronsLeft, Cloud, Eye, EyeOff, AlertCircle, ChevronDown, CheckCircle2, XCircle, Loader2, Upload, Trash2, Copy, ExternalLink, ImagePlus, Heading1} from "lucide-react";

const LovpenLogo: React.FC<{className?: string}> = ({className}) => (
	<svg viewBox="-127 -80 1240 1240" className={className} fill="currentColor">
		<path d="M281.73,892.18V281.73C281.73,126.13,155.6,0,0,0l0,0v610.44C0,766.04,126.13,892.18,281.73,892.18z"/>
		<path d="M633.91,1080V469.56c0-155.6-126.13-281.73-281.73-281.73l0,0v610.44C352.14,953.87,478.31,1080,633.91,1080L633.91,1080z"/>
		<path d="M704.32,91.16L704.32,91.16v563.47l0,0c155.6,0,281.73-126.13,281.73-281.73S859.92,91.16,704.32,91.16z"/>
	</svg>
);

// 七牛云区域配置
const QINIU_REGIONS: Array<{
	value: CloudStorageSettings['qiniu']['region'];
	label: string;
	description: string;
}> = [
	{value: 'z0', label: '华东', description: 'East China (z0)'},
	{value: 'z1', label: '华北', description: 'North China (z1)'},
	{value: 'z2', label: '华南', description: 'South China (z2)'},
	{value: 'na0', label: '北美', description: 'North America (na0)'},
	{value: 'as0', label: '东南亚', description: 'Southeast Asia (as0)'},
];

// 云存储设置组件
const CloudStorageSettingsSection: React.FC<{
	cloudSettings: CloudStorageSettings;
	onSettingsChange: (settings: CloudStorageSettings) => void;
}> = ({cloudSettings, onSettingsChange}) => {
	const [showSecretKey, setShowSecretKey] = useState(false);
	const [expanded, setExpanded] = useState(cloudSettings.enabled);
	const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
	const [testMessage, setTestMessage] = useState('');

	const updateQiniuField = (field: keyof CloudStorageSettings['qiniu'], value: string) => {
		onSettingsChange({
			...cloudSettings,
			qiniu: {...cloudSettings.qiniu, [field]: value}
		});
	};

	const isConfigComplete = cloudSettings.qiniu.accessKey &&
		cloudSettings.qiniu.secretKey &&
		cloudSettings.qiniu.bucket &&
		cloudSettings.qiniu.domain;

	// 测试配置
	const testConnection = async () => {
		if (!isConfigComplete) {
			setTestStatus('error');
			setTestMessage('请先填写所有配置项');
			return;
		}

		setTestStatus('testing');
		setTestMessage('正在测试域名连通性...');

		try {
			// 规范化域名
			let domain = cloudSettings.qiniu.domain.trim();
			if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
				domain = 'https://' + domain;
			}
			domain = domain.replace(/\/$/, '');

			// 使用 Obsidian 的 requestUrl API（如果可用）或 fetch
			const requestUrl = window.lovpenReactAPI?.requestUrl;

			if (requestUrl) {
				// Obsidian 环境 - 使用 GET 请求测试
				try {
					const response = await requestUrl({url: domain, method: 'GET'});
					// 任何 HTTP 响应都说明域名可访问（包括 404）
					setTestStatus('success');
					setTestMessage('域名连接正常');
				} catch (reqError: any) {
					// 检查是否是 HTTP 错误（有状态码说明域名可访问）
					if (reqError?.status) {
						setTestStatus('success');
						setTestMessage('域名连接正常');
					} else {
						throw reqError;
					}
				}
			} else {
				// Web 环境 - 简单检查
				setTestStatus('success');
				setTestMessage('配置已保存');
			}
		} catch (error) {
			setTestStatus('error');
			setTestMessage(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
		}

		// 5秒后重置状态
		setTimeout(() => {
			setTestStatus('idle');
			setTestMessage('');
		}, 5000);
	};

	return (
		<div className="space-y-3">
			<p className="text-xs text-[#87867F] uppercase tracking-wide px-1">云存储</p>
			<div className="bg-white rounded-xl border border-[#E8E6DC] overflow-hidden">
				{/* 标题栏 - 点击展开/收起 */}
				<div
					className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#F9F9F7] select-none"
					onClick={() => setExpanded(!expanded)}
				>
					<div className="flex items-center gap-3">
						<div className="w-7 h-7 bg-gradient-to-br from-[#97B5D5] to-[#7095B5] rounded-md flex items-center justify-center">
							<Cloud className="h-4 w-4 text-white"/>
						</div>
						<div>
							<span className="text-[#181818] text-sm block">七牛云存储</span>
							<span className="text-[#87867F] text-xs">
								{cloudSettings.enabled && isConfigComplete ? '已启用' : cloudSettings.enabled ? '配置不完整' : '点击配置'}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Switch
							checked={cloudSettings.enabled}
							onCheckedChange={(checked) => {
								onSettingsChange({
									...cloudSettings,
									enabled: checked,
									provider: checked ? 'qiniu' : 'local'
								});
								if (checked) setExpanded(true);
							}}
							onClick={(e) => e.stopPropagation()}
						/>
						<ChevronDown
							className={`h-4 w-4 text-[#87867F] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
						/>
					</div>
				</div>

				{/* 展开配置区域 */}
				{expanded && (
					<div className="border-t border-[#E8E6DC] p-4 space-y-4 bg-[#F9F9F7]/50">
						{/* 配置不完整警告 */}
						{cloudSettings.enabled && !isConfigComplete && (
							<div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
								<AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0"/>
								<p className="text-xs text-amber-800">
									云存储已启用但配置不完整，请填写以下所有字段
								</p>
							</div>
						)}

						{/* Access Key */}
						<div>
							<label className="block text-xs font-medium text-[#181818] mb-1.5">Access Key</label>
							<input
								type="text"
								value={cloudSettings.qiniu.accessKey}
								onChange={(e) => updateQiniuField('accessKey', e.target.value)}
								placeholder="七牛 Access Key"
								className="w-full px-3 py-2 bg-white border border-[#E8E6DC] rounded-lg text-sm text-[#181818] placeholder:text-[#87867F]/50 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
							/>
						</div>

						{/* Secret Key */}
						<div>
							<label className="block text-xs font-medium text-[#181818] mb-1.5">Secret Key</label>
							<div className="relative">
								<input
									type={showSecretKey ? 'text' : 'password'}
									value={cloudSettings.qiniu.secretKey}
									onChange={(e) => updateQiniuField('secretKey', e.target.value)}
									placeholder="七牛 Secret Key"
									className="w-full px-3 py-2 pr-10 bg-white border border-[#E8E6DC] rounded-lg text-sm text-[#181818] placeholder:text-[#87867F]/50 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
								/>
								<button
									type="button"
									onClick={() => setShowSecretKey(!showSecretKey)}
									className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#87867F] hover:text-[#181818] transition-colors"
								>
									{showSecretKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
								</button>
							</div>
							<p className="mt-1 text-[10px] text-[#87867F]">Secret Key 仅存储在本地</p>
						</div>

						{/* Bucket */}
						<div>
							<label className="block text-xs font-medium text-[#181818] mb-1.5">Bucket 名称</label>
							<input
								type="text"
								value={cloudSettings.qiniu.bucket}
								onChange={(e) => updateQiniuField('bucket', e.target.value)}
								placeholder="存储空间名称"
								className="w-full px-3 py-2 bg-white border border-[#E8E6DC] rounded-lg text-sm text-[#181818] placeholder:text-[#87867F]/50 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
							/>
						</div>

						{/* Domain */}
						<div>
							<label className="block text-xs font-medium text-[#181818] mb-1.5">CDN 域名</label>
							<input
								type="text"
								value={cloudSettings.qiniu.domain}
								onChange={(e) => updateQiniuField('domain', e.target.value)}
								placeholder="https://cdn.example.com"
								className="w-full px-3 py-2 bg-white border border-[#E8E6DC] rounded-lg text-sm text-[#181818] placeholder:text-[#87867F]/50 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
							/>
							<p className="mt-1 text-[10px] text-[#87867F]">七牛控制台 → 存储空间 → 域名管理</p>
						</div>

						{/* Region */}
						<div>
							<label className="block text-xs font-medium text-[#181818] mb-1.5">存储区域</label>
							<select
								value={cloudSettings.qiniu.region}
								onChange={(e) => updateQiniuField('region', e.target.value)}
								className="w-full px-3 py-2 bg-white border border-[#E8E6DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] cursor-pointer"
							>
								{QINIU_REGIONS.map((region) => (
									<option key={region.value} value={region.value}>
										{region.label} - {region.description}
									</option>
								))}
							</select>
						</div>

						{/* 测试按钮 */}
						<div className="pt-2 border-t border-[#E8E6DC]">
							<button
								onClick={testConnection}
								disabled={testStatus === 'testing' || !isConfigComplete}
								className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
									testStatus === 'testing'
										? 'bg-[#E8E6DC] text-[#87867F] cursor-wait'
										: testStatus === 'success'
										? 'bg-green-50 text-green-700 border border-green-200'
										: testStatus === 'error'
										? 'bg-red-50 text-red-700 border border-red-200'
										: isConfigComplete
										? 'bg-[#D97757] text-white hover:bg-[#C96747]'
										: 'bg-[#E8E6DC] text-[#87867F] cursor-not-allowed'
								}`}
							>
								{testStatus === 'testing' ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin"/>
										测试中...
									</>
								) : testStatus === 'success' ? (
									<>
										<CheckCircle2 className="h-4 w-4"/>
										{testMessage}
									</>
								) : testStatus === 'error' ? (
									<>
										<XCircle className="h-4 w-4"/>
										{testMessage}
									</>
								) : (
									<>
										<Cloud className="h-4 w-4"/>
										测试配置
									</>
								)}
							</button>
							{!isConfigComplete && testStatus === 'idle' && (
								<p className="mt-2 text-[10px] text-[#87867F] text-center">
									请填写所有必填项后测试
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

// 七牛云上传区域配置
const QINIU_UPLOAD_HOSTS: Record<CloudStorageSettings['qiniu']['region'], string> = {
	'z0': 'https://up.qiniup.com',
	'z1': 'https://up-z1.qiniup.com',
	'z2': 'https://up-z2.qiniup.com',
	'na0': 'https://up-na0.qiniup.com',
	'as0': 'https://up-as0.qiniup.com',
};

// 本地存储键名
const UPLOADED_IMAGES_STORAGE_KEY = 'lovpen-uploaded-images';

// 获取已上传图片列表
const getUploadedImages = (): UploadedImage[] => {
	try {
		const data = localStorage.getItem(UPLOADED_IMAGES_STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
};

// 保存已上传图片列表
const saveUploadedImages = (images: UploadedImage[]) => {
	localStorage.setItem(UPLOADED_IMAGES_STORAGE_KEY, JSON.stringify(images));
};

// 生成文件 key（七牛云存储路径）
const generateFileKey = (file: File): string => {
	const ext = file.name.split('.').pop() || 'jpg';
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `lovpen/${timestamp}-${random}.${ext}`;
};

// Base64 URL 编码
const base64UrlEncode = (str: string): string => {
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_');
};

// HMAC-SHA1 签名
const hmacSha1 = async (key: string, message: string): Promise<string> => {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(key);
	const messageData = encoder.encode(message);

	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{name: 'HMAC', hash: 'SHA-1'},
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
	const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
	return base64.replace(/\+/g, '-').replace(/\//g, '_');
};

// 生成七牛云上传 Token
const generateUploadToken = async (
	accessKey: string,
	secretKey: string,
	bucket: string,
	key: string
): Promise<string> => {
	const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时有效期
	const putPolicy = {
		scope: `${bucket}:${key}`,
		deadline,
	};
	const encodedPolicy = base64UrlEncode(JSON.stringify(putPolicy));
	const sign = await hmacSha1(secretKey, encodedPolicy);
	return `${accessKey}:${sign}:${encodedPolicy}`;
};

// 云存储面板组件（内容部分，不含标题）
const CloudStoragePanelContent: React.FC<{
	cloudSettings: CloudStorageSettings;
	onSettingsChange: (settings: CloudStorageSettings) => void;
}> = ({cloudSettings, onSettingsChange}) => {
	const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(() => getUploadedImages());
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// 监听 storage 变化刷新列表
	useEffect(() => {
		const handleStorageChange = () => {
			setUploadedImages(getUploadedImages());
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('lovpen-images-updated', handleStorageChange);
		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('lovpen-images-updated', handleStorageChange);
		};
	}, []);

	const isConfigComplete = cloudSettings.enabled &&
		cloudSettings.qiniu.accessKey &&
		cloudSettings.qiniu.secretKey &&
		cloudSettings.qiniu.bucket &&
		cloudSettings.qiniu.domain;

	// 上传文件到七牛云
	const uploadToQiniu = async (file: File): Promise<UploadedImage | null> => {
		if (!isConfigComplete) return null;

		const key = generateFileKey(file);
		const token = await generateUploadToken(
			cloudSettings.qiniu.accessKey,
			cloudSettings.qiniu.secretKey,
			cloudSettings.qiniu.bucket,
			key
		);

		const formData = new FormData();
		formData.append('file', file);
		formData.append('token', token);
		formData.append('key', key);

		const uploadHost = QINIU_UPLOAD_HOSTS[cloudSettings.qiniu.region];

		const response = await fetch(uploadHost, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`上传失败: ${response.status}`);
		}

		const result = await response.json();
		let domain = cloudSettings.qiniu.domain.trim();
		if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
			domain = 'https://' + domain;
		}
		domain = domain.replace(/\/$/, '');

		const uploadedImage: UploadedImage = {
			id: crypto.randomUUID(),
			name: file.name,
			url: `${domain}/${result.key}`,
			key: result.key,
			size: file.size,
			type: file.type,
			uploadedAt: new Date().toISOString(),
		};

		return uploadedImage;
	};

	// 处理文件上传
	const handleUpload = async (files: FileList | File[]) => {
		if (!isConfigComplete) {
			alert('请先完成云存储配置');
			return;
		}

		const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
		if (imageFiles.length === 0) {
			alert('请选择图片文件');
			return;
		}

		setUploading(true);
		setUploadProgress(0);

		const newImages: UploadedImage[] = [];
		for (let i = 0; i < imageFiles.length; i++) {
			try {
				const image = await uploadToQiniu(imageFiles[i]);
				if (image) {
					newImages.push(image);
				}
			} catch (error) {
				console.error('上传失败:', error);
			}
			setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
		}

		if (newImages.length > 0) {
			const updated = [...newImages, ...uploadedImages];
			setUploadedImages(updated);
			saveUploadedImages(updated);
		}

		setUploading(false);
		setUploadProgress(0);
	};

	// 删除图片记录
	const handleDelete = (id: string) => {
		const updated = uploadedImages.filter(img => img.id !== id);
		setUploadedImages(updated);
		saveUploadedImages(updated);
	};

	// 复制 URL
	const handleCopyUrl = async (url: string) => {
		await navigator.clipboard.writeText(url);
	};

	// 格式化文件大小
	const formatSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	// 格式化日期
	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('zh-CN', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
	};

	return (
		<>
			{/* 云存储配置 */}
			<CloudStorageSettingsSection
				cloudSettings={cloudSettings}
				onSettingsChange={onSettingsChange}
			/>

			{/* 上传区域 */}
			{isConfigComplete && (
				<div className="space-y-3">
					<p className="text-xs text-[#87867F] uppercase tracking-wide px-1">上传图片</p>
					<div
						className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer ${
							dragOver
								? 'border-[#D97757] bg-[#D97757]/5'
								: 'border-[#E8E6DC] hover:border-[#D97757]/50 bg-white'
						}`}
						onDragOver={(e) => {e.preventDefault(); setDragOver(true);}}
						onDragLeave={() => setDragOver(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragOver(false);
							handleUpload(e.dataTransfer.files);
						}}
						onClick={() => fileInputRef.current?.click()}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={(e) => e.target.files && handleUpload(e.target.files)}
						/>
						<div className="flex flex-col items-center gap-2">
							{uploading ? (
								<>
									<Loader2 className="h-8 w-8 text-[#D97757] animate-spin"/>
									<p className="text-sm text-[#181818]">上传中 {uploadProgress}%</p>
								</>
							) : (
								<>
									<ImagePlus className="h-8 w-8 text-[#87867F]"/>
									<p className="text-sm text-[#181818]">点击或拖拽图片到这里</p>
									<p className="text-xs text-[#87867F]">支持 JPG、PNG、GIF 等格式</p>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* 已上传图片列表 */}
			{uploadedImages.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<p className="text-xs text-[#87867F] uppercase tracking-wide">已上传 ({uploadedImages.length})</p>
						<button
							onClick={() => {
								if (confirm('确定清空所有上传记录吗？')) {
									setUploadedImages([]);
									saveUploadedImages([]);
								}
							}}
							className="text-xs text-[#87867F] hover:text-red-500 transition-colors"
						>
							清空
						</button>
					</div>
					<div className="bg-white rounded-xl border border-[#E8E6DC] overflow-hidden">
						<div className="divide-y divide-[#E8E6DC] max-h-[300px] overflow-y-auto">
							{uploadedImages.map((img) => (
								<div key={img.id} className="flex items-center gap-3 p-3 hover:bg-[#F9F9F7]">
									<img
										src={img.url}
										alt={img.name}
										className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm text-[#181818] truncate">{img.name}</p>
										<p className="text-xs text-[#87867F]">
											{formatSize(img.size)} · {formatDate(img.uploadedAt)}
										</p>
									</div>
									<div className="flex items-center gap-1">
										<button
											onClick={() => handleCopyUrl(img.url)}
											className="p-1.5 rounded-md text-[#87867F] hover:bg-[#E8E6DC] hover:text-[#181818] transition-all"
											title="复制链接"
										>
											<Copy className="h-4 w-4"/>
										</button>
										<a
											href={img.url}
											target="_blank"
											rel="noopener noreferrer"
											className="p-1.5 rounded-md text-[#87867F] hover:bg-[#E8E6DC] hover:text-[#181818] transition-all"
											title="打开"
										>
											<ExternalLink className="h-4 w-4"/>
										</a>
										<button
											onClick={() => handleDelete(img.id)}
											className="p-1.5 rounded-md text-[#87867F] hover:bg-red-50 hover:text-red-500 transition-all"
											title="删除"
										>
											<Trash2 className="h-4 w-4"/>
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* 未配置提示 */}
			{!isConfigComplete && (
				<div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
					<AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0"/>
					<p className="text-xs text-amber-800">
						请先启用并完成七牛云配置，然后即可上传图片
					</p>
				</div>
			)}
		</>
	);
};

import JSZip from 'jszip';
import {Checkbox} from "../ui/checkbox";
import {Switch} from "../ui/switch";
import {useSettings} from "../../hooks/useSettings";

// Unified section layout for all menu panels - DRY
const SectionLayout: React.FC<{
	title: string;
	children: React.ReactNode;
	withCard?: boolean;
}> = ({ title, children, withCard = true }) => (
	<div className="space-y-4">
		<h3 className="text-lg font-semibold text-[#181818]">{title}</h3>
		{withCard ? (
			<div className="bg-white rounded-xl border border-[#E8E6DC] p-4 shadow-sm">
				{children}
			</div>
		) : children}
	</div>
);

interface ToolbarProps {
	settings: ViteReactSettings;
	plugins: UnifiedPluginData[];
	articleHTML: string;
	onTemplateChange: (template: string) => void;
	onThemeChange: (theme: string) => void;
	onHighlightChange: (highlight: string) => void;
	onThemeColorToggle: (enabled: boolean) => void;
	onThemeColorChange: (color: string) => void;
	onRenderArticle: () => void;
	onSaveSettings: () => void;
	onPluginToggle?: (pluginName: string, enabled: boolean) => void;
	onPluginConfigChange?: (pluginName: string, key: string, value: string | boolean) => void;
	onArticleInfoChange?: (info: ArticleInfoData) => void;
	onPersonalInfoChange?: (info: PersonalInfo) => void;
	onSettingsChange?: (settings: Partial<ViteReactSettings>) => void;
	onKitApply?: (kitId: string) => void;
	onKitCreate?: (basicInfo: any) => void;
	onKitDelete?: (kitId: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
													settings,
													plugins,
													articleHTML,
													onTemplateChange,
													onThemeChange,
													onHighlightChange,
													onThemeColorToggle,
													onThemeColorChange,
													onRenderArticle,
													onSaveSettings,
													onPluginToggle,
													onPluginConfigChange,
													onArticleInfoChange,
													onPersonalInfoChange,
													onSettingsChange,
													onKitApply,
													onKitCreate,
													onKitDelete,
												}) => {

	// 使用 useSettings hook 获取设置更新方法
	const {settings: atomSettings, updateSettings, saveSettings} = useSettings(onSaveSettings, onPersonalInfoChange, onSettingsChange);

	// 统一的导航状态 - 苹果风格侧边栏
	type NavSection = 'article' | 'cover' | 'kits' | 'plugins' | 'cloud' | 'personal' | 'ai' | 'general';
	const [activeSection, setActiveSection] = useState<NavSection>(() => {
		try {
			const saved = localStorage.getItem('lovpen-toolbar-section') as NavSection;
			return saved || 'article';
		} catch {
			return 'article';
		}
	});

	const handleSectionChange = (section: NavSection) => {
		setActiveSection(section);
		try {
			localStorage.setItem('lovpen-toolbar-section', section);
		} catch {}
	};

	// 侧边栏展开/收起状态
	const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
		try {
			const saved = localStorage.getItem('lovpen-sidebar-expanded');
			return saved !== 'false'; // 默认展开
		} catch {
			return true;
		}
	});

	const toggleSidebar = () => {
		const newValue = !sidebarExpanded;
		setSidebarExpanded(newValue);
		try {
			localStorage.setItem('lovpen-sidebar-expanded', String(newValue));
		} catch {}
	};

	// 插件管理中的子tab状态
	const [pluginTab, setPluginTab] = useState<string>(() => {
		try {
			const saved = localStorage.getItem('lovpen-toolbar-plugin-tab');
			if (saved) return saved;
		} catch {}
		return plugins.some(p => p.type === 'rehype') ? 'rehype' : 'remark';
	});

	// 插件展开状态管理
	const [pluginExpandedSections, setPluginExpandedSections] = useState<string[]>(
		settings.expandedAccordionSections || []
	);



	// 同步插件展开状态
	useEffect(() => {
		setPluginExpandedSections(settings.expandedAccordionSections || []);
	}, [settings.expandedAccordionSections]);

	const remarkPlugins = plugins.filter(p => p.type === 'remark');
	const rehypePlugins = plugins.filter(p => p.type === 'rehype');

	const handleBatchToggle = (pluginType: 'remark' | 'rehype', enabled: boolean) => {
		(pluginType === 'remark' ? remarkPlugins : rehypePlugins)
			.forEach(plugin => onPluginToggle?.(plugin.name, enabled));
		onRenderArticle();
	};

	// 计算插件的全选状态
	const getPluginsCheckState = (plugins: UnifiedPluginData[]): boolean | 'indeterminate' => {
		const enabledCount = plugins.filter(p => p.enabled).length;
		if (enabledCount === 0) return false;
		if (enabledCount === plugins.length) return true;
		return 'indeterminate';
	};

	// 处理全选checkbox点击
	const handleSelectAllToggle = (pluginType: 'remark' | 'rehype') => {
		const plugins = pluginType === 'remark' ? remarkPlugins : rehypePlugins;
		const currentState = getPluginsCheckState(plugins);
		// 如果当前是全选或部分选中，则取消全选；如果是全不选，则全选
		const newState = currentState === false;
		handleBatchToggle(pluginType, newState);
	};

	// 处理插件展开/折叠
	const handlePluginToggle = (sectionId: string, isExpanded: boolean) => {
		let newSections: string[];
		if (isExpanded) {
			newSections = pluginExpandedSections.includes(sectionId)
				? pluginExpandedSections
				: [...pluginExpandedSections, sectionId];
		} else {
			newSections = pluginExpandedSections.filter(id => id !== sectionId);
		}

		// 更新本地状态
		setPluginExpandedSections(newSections);
		onSaveSettings();
	};

	// 获取图片数据的通用函数
	const getImageArrayBuffer = async (imageUrl: string): Promise<ArrayBuffer> => {
		if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
			// HTTP/HTTPS URL - 使用Obsidian的requestUrl API
			if (!window.lovpenReactAPI || typeof window.lovpenReactAPI.requestUrl === 'undefined') {
				throw new Error('此功能仅在Obsidian环境中可用');
			}
			const requestUrl = window.lovpenReactAPI.requestUrl;
			const response = await requestUrl({url: imageUrl, method: 'GET'});
			return response.arrayBuffer;
		} else if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
			// Blob URL 或 Data URL - 使用fetch API
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status}`);
			}
			return await response.arrayBuffer();
		} else {
			throw new Error(`不支持的URL协议: ${imageUrl}`);
		}
	};

	// 使用zip打包下载所有封面
	const downloadWithBrowserDownload = async (covers: CoverData[]) => {
		const cover1 = covers.find(c => c.aspectRatio === '2.25:1');
		const cover2 = covers.find(c => c.aspectRatio === '1:1');

		try {
			const zip = new JSZip();
			let fileCount = 0;

			// 添加单独的封面到zip
			for (const [index, cover] of covers.entries()) {
				try {
					const arrayBuffer = await getImageArrayBuffer(cover.imageUrl);
					const aspectStr = cover.aspectRatio.replace(':', '-').replace('.', '_');
					const fileName = `lovpen-cover-${index + 1}-${aspectStr}.jpg`;
					zip.file(fileName, arrayBuffer);
					fileCount++;
				} catch (error) {
					console.error(`准备封面 ${index + 1} 失败:`, error);
				}
			}

			// 如果有两个封面，添加拼接图到zip
			if (cover1 && cover2) {
				try {
					const combinedBlob = await createCombinedCoverBlob(cover1, cover2);
					const arrayBuffer = await combinedBlob.arrayBuffer();
					const fileName = 'lovpen-cover-combined-3_25_1.jpg';
					zip.file(fileName, arrayBuffer);
					fileCount++;
				} catch (error) {
					console.error("准备拼接封面失败:", error);
				}
			}

			if (fileCount === 0) {
				alert('没有有效的封面可以下载');
				return;
			}

			// 生成zip文件
			const zipBlob = await zip.generateAsync({type: 'blob'});

			// 创建下载链接
			const url = URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `lovpen-covers-${Date.now()}.zip`;
			a.style.display = 'none';

			document.body.appendChild(a);
			a.click();

			// 清理
			setTimeout(() => {
				// document.body.removeChild(a);
				// URL.revokeObjectURL(url);
			}, 2000);


		} catch (error) {
			console.error('创建zip文件失败:', error);
			alert('下载失败，请重试');
		}
	};

	// 处理封面下载
	const handleDownloadCovers = async (covers: CoverData[]) => {
		logger.info("[Toolbar] 下载封面", {count: covers.length});
		// 直接使用简单的下载方式，避免复杂的弹窗和权限问题
		await downloadWithBrowserDownload(covers);
	};

	// 创建拼接封面Blob的通用函数
	const createCombinedCoverBlob = async (cover1: CoverData, cover2: CoverData): Promise<Blob> => {
		// 下载两张图片的数据
		const [arrayBuffer1, arrayBuffer2] = await Promise.all([
			getImageArrayBuffer(cover1.imageUrl),
			getImageArrayBuffer(cover2.imageUrl)
		]);

		// 创建blob URL
		const blob1 = new Blob([arrayBuffer1], {type: 'image/jpeg'});
		const blob2 = new Blob([arrayBuffer2], {type: 'image/jpeg'});
		const url1 = URL.createObjectURL(blob1);
		const url2 = URL.createObjectURL(blob2);

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		// 设置画布尺寸 (3.25:1 比例，高度600px，提高分辨率)
		const height = 600;
		const width = height * 3.25;
		canvas.width = width;
		canvas.height = height;

		// 加载图片
		const img1 = document.createElement('img');
		const img2 = document.createElement('img');

		const loadImage = (img: HTMLImageElement, url: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = reject;
				img.src = url;
			});
		};

		await Promise.all([
			loadImage(img1, url1),
			loadImage(img2, url2)
		]);

		// 绘制第一张图 (2.25:1 比例)
		const img1Width = height * 2.25;
		ctx?.drawImage(img1, 0, 0, img1Width, height);

		// 绘制第二张图 (1:1 比例)
		const img2Width = height;
		ctx?.drawImage(img2, img1Width, 0, img2Width, height);

		// 清理blob URL
		URL.revokeObjectURL(url1);
		URL.revokeObjectURL(url2);

		// 转换为blob
		return new Promise((resolve) => {
			canvas.toBlob((blob) => {
				resolve(blob!);
			}, 'image/jpeg', 0.95);
		});
	};

	// 导航菜单配置
	const navItems: {key: typeof activeSection; label: string; icon: React.ElementType; color: string; group: 'content' | 'settings'}[] = [
		{key: 'article', label: '文章信息', icon: FileText, color: 'from-[#CC785C] to-[#B86A4E]', group: 'content'},
		{key: 'cover', label: '封面设计', icon: Palette, color: 'from-[#B49FD8] to-[#8B7CB8]', group: 'content'},
		{key: 'kits', label: '模板套装', icon: Package, color: 'from-[#629A90] to-[#4A7A70]', group: 'content'},
		{key: 'plugins', label: '插件管理', icon: Plug, color: 'from-[#97B5D5] to-[#7095B5]', group: 'content'},
		{key: 'cloud', label: '云存储', icon: Cloud, color: 'from-[#97B5D5] to-[#7095B5]', group: 'settings'},
		{key: 'personal', label: '个人信息', icon: User, color: 'from-[#C2C07D] to-[#A2A05D]', group: 'settings'},
		{key: 'ai', label: 'AI 设置', icon: Bot, color: 'from-[#CC785C] to-[#AC583C]', group: 'settings'},
		{key: 'general', label: '通用', icon: Globe, color: 'from-[#87867F] to-[#6A6A63]', group: 'settings'},
	];

	try {
		return (
			<div
				id="lovpen-toolbar-container"
				className="h-full flex bg-[#F9F9F7] relative"
				style={{
					minWidth: '320px',
					width: '100%',
					maxWidth: '100%',
					overflow: 'hidden',
					boxSizing: 'border-box'
				}}>
				{/* 左侧导航栏 - macOS 系统偏好设置风格 */}
				<div
					className={`bg-[#F0EEE6]/80 backdrop-blur-xl border-r border-[#E8E6DC] flex flex-col flex-shrink-0 transition-all duration-200 ${
						sidebarExpanded ? 'w-[180px]' : 'w-[52px]'
					}`}
				>
					{/* 顶部品牌区域 */}
					<div className="p-2 border-b border-[#E8E6DC]">
						{sidebarExpanded ? (
							<div
								onClick={toggleSidebar}
								className="flex items-center justify-between px-1 cursor-pointer rounded-md hover:bg-[#E8E6DC]/80 transition-all"
								title="收起菜单"
							>
								<div className="flex items-center gap-2">
									<LovpenLogo className="w-6 h-6 text-[#D97757]"/>
									<span className="text-sm font-semibold text-[#3d3d3d]">Lovpen</span>
								</div>
								<div className="p-1.5 text-[#87867F]">
									<ChevronsLeft className="h-4 w-4"/>
								</div>
							</div>
						) : (
							<button
								onClick={toggleSidebar}
								className="w-full flex items-center justify-center p-1"
								title="展开菜单"
							>
								<LovpenLogo className="w-7 h-7 text-[#D97757] hover:scale-105 transition-transform"/>
							</button>
						)}
					</div>

					<div className="flex-1 overflow-y-auto py-3 px-2">
						{/* 内容分组 */}
						<div className="mb-4">
							{sidebarExpanded && (
								<p className="text-[10px] text-[#87867F] uppercase tracking-wider font-medium px-2 mb-2">内容</p>
							)}
							<nav className={sidebarExpanded ? 'space-y-1' : 'space-y-2'}>
								{navItems.filter(item => item.group === 'content').map(({key, label, icon: Icon, color}) => (
									<button
										key={key}
										onClick={() => handleSectionChange(key)}
										title={!sidebarExpanded ? label : undefined}
										className={`w-full flex items-center transition-all ${
											sidebarExpanded
												? `gap-3 px-2 py-2 rounded-lg ${activeSection === key ? 'bg-[#CC785C] text-white shadow-sm' : 'text-[#3d3d3d] hover:bg-[#E8E6DC]/80'}`
												: 'justify-center py-1'
										}`}
										style={!sidebarExpanded ? { background: 'none', border: 'none', boxShadow: 'none' } : undefined}
									>
										<div
											className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} transition-transform ${
												!sidebarExpanded && activeSection === key ? 'scale-110' : ''
											}`}
											style={{ boxShadow: activeSection === key ? '0 0 0 2px rgba(204,120,92,0.6)' : 'none' }}
										>
											<Icon className="h-4 w-4 text-white"/>
										</div>
										{sidebarExpanded && (
											<>
												<span className="text-sm font-medium text-left flex-1">{label}</span>
												{key === 'plugins' && plugins.length > 0 && (
													<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
														activeSection === key ? 'bg-white/25 text-white' : 'bg-[#E8E6DC] text-[#87867F]'
													}`}>
														{plugins.length}
													</span>
												)}
											</>
										)}
									</button>
								))}
							</nav>
						</div>

						{/* 设置分组 */}
						<div>
							{sidebarExpanded && (
								<p className="text-[10px] text-[#87867F] uppercase tracking-wider font-medium px-2 mb-2">设置</p>
							)}
							<nav className={sidebarExpanded ? 'space-y-1' : 'space-y-2'}>
								{navItems.filter(item => item.group === 'settings').map(({key, label, icon: Icon, color}) => (
									<button
										key={key}
										onClick={() => handleSectionChange(key)}
										title={!sidebarExpanded ? label : undefined}
										className={`w-full flex items-center transition-all ${
											sidebarExpanded
												? `gap-3 px-2 py-2 rounded-lg ${activeSection === key ? 'bg-[#CC785C] text-white shadow-sm' : 'text-[#3d3d3d] hover:bg-[#E8E6DC]/80'}`
												: 'justify-center py-1'
										}`}
										style={!sidebarExpanded ? { background: 'none', border: 'none', boxShadow: 'none' } : undefined}
									>
										<div
											className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} transition-transform ${
												!sidebarExpanded && activeSection === key ? 'scale-110' : ''
											}`}
											style={{ boxShadow: activeSection === key ? '0 0 0 2px rgba(204,120,92,0.6)' : 'none' }}
										>
											<Icon className="h-4 w-4 text-white"/>
										</div>
										{sidebarExpanded && (
											<span className="text-sm font-medium text-left flex-1">{label}</span>
										)}
									</button>
								))}
							</nav>
						</div>
					</div>
				</div>

				{/* 右侧内容区 */}
				<div id="lovpen-toolbar-content" className="flex-1 overflow-y-auto bg-[#F9F9F7] relative">
					<div className="p-4 sm:p-5">
						{/* 文章信息 */}
						{activeSection === 'article' && (
							<SectionLayout title="文章信息">
								<ArticleInfo
									settings={atomSettings}
									onSaveSettings={onSaveSettings}
									onInfoChange={onArticleInfoChange || (() => {})}
									onRenderArticle={onRenderArticle}
									onSettingsChange={onSettingsChange}
									onOpenAISettings={() => handleSectionChange('ai')}
								/>
							</SectionLayout>
						)}

						{/* 封面设计 */}
						{activeSection === 'cover' && (
							<SectionLayout title="封面设计">
								<CoverDesigner
									articleHTML={articleHTML}
									onDownloadCovers={handleDownloadCovers}
									onClose={() => {}}
									settings={atomSettings}
									onOpenAISettings={() => handleSectionChange('ai')}
								/>
							</SectionLayout>
						)}

						{/* 模板套装 */}
						{activeSection === 'kits' && (
							<SectionLayout title="模板套装">
								<TemplateKitSelector
									settings={settings}
									onKitApply={onKitApply}
									onKitCreate={onKitCreate}
									onKitDelete={onKitDelete}
									onSettingsChange={onSettingsChange}
									onTemplateChange={onTemplateChange}
									onThemeChange={onThemeChange}
									onHighlightChange={onHighlightChange}
									onThemeColorToggle={onThemeColorToggle}
									onThemeColorChange={onThemeColorChange}
								/>
							</SectionLayout>
						)}

						{/* 插件管理 */}
						{activeSection === 'plugins' && (
							<SectionLayout title="插件管理">
								{plugins.length > 0 ? (
									<Tabs value={pluginTab} onValueChange={(value) => {
										setPluginTab(value);
										try {
											localStorage.setItem('lovpen-toolbar-plugin-tab', value);
										} catch {}
									}}>
										<TabsList className="bg-[#F0EEE6] rounded-lg p-0.5 mb-4">
											{remarkPlugins.length > 0 && (
												<TabsTrigger value="remark"
													className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#CC785C] text-[#87867F] px-3 py-1.5 rounded-md">
													<Plug className="h-3.5 w-3.5"/>
													<span>Remark</span>
													<span className="bg-[#C2C07D] text-white text-[10px] px-1.5 py-0.5 rounded-full">{remarkPlugins.length}</span>
												</TabsTrigger>
											)}
											{rehypePlugins.length > 0 && (
												<TabsTrigger value="rehype"
													className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#CC785C] text-[#87867F] px-3 py-1.5 rounded-md">
													<Zap className="h-3.5 w-3.5"/>
													<span>Rehype</span>
													<span className="bg-[#B49FD8] text-white text-[10px] px-1.5 py-0.5 rounded-full">{rehypePlugins.length}</span>
												</TabsTrigger>
											)}
										</TabsList>

										{remarkPlugins.length > 0 && (
											<TabsContent value="remark" className="mt-0">
												<div className="space-y-3">
													<div className="flex items-center p-3 bg-[#F7F4EC] border border-[#E8E6DC] rounded-lg gap-2.5">
														<Checkbox
															checked={getPluginsCheckState(remarkPlugins)}
															onCheckedChange={() => handleSelectAllToggle('remark')}
															className="border-[#629A90] data-[state=checked]:bg-[#629A90]"
														/>
														<div>
															<h4 className="font-medium text-[#181818] text-sm">全选 Remark</h4>
															<p className="text-xs text-[#87867F]">Markdown 语法解析插件</p>
														</div>
													</div>
													<div className="space-y-1">
														{remarkPlugins.map(plugin =>
															<ConfigComponent key={plugin.name} item={plugin} type="plugin"
																expandedSections={pluginExpandedSections} onToggle={handlePluginToggle}
																onEnabledChange={(name, enabled) => onPluginToggle?.(name, enabled)}
																onConfigChange={async (name, key, value) => {
																	onPluginConfigChange && await onPluginConfigChange(name, key, value);
																	onRenderArticle();
																}}/>
														)}
													</div>
												</div>
											</TabsContent>
										)}

										{rehypePlugins.length > 0 && (
											<TabsContent value="rehype" className="mt-0">
												<div className="space-y-3">
													<div className="flex items-center p-3 bg-[#F7F4EC] border border-[#E8E6DC] rounded-lg gap-2.5">
														<Checkbox
															checked={getPluginsCheckState(rehypePlugins)}
															onCheckedChange={() => handleSelectAllToggle('rehype')}
															className="border-[#97B5D5] data-[state=checked]:bg-[#97B5D5]"
														/>
														<div>
															<h4 className="font-medium text-[#181818] text-sm">全选 Rehype</h4>
															<p className="text-xs text-[#87867F]">HTML 处理和转换插件</p>
														</div>
													</div>
													<div className="space-y-1">
														{rehypePlugins.map(plugin =>
															<ConfigComponent key={plugin.name} item={plugin} type="plugin"
																expandedSections={pluginExpandedSections} onToggle={handlePluginToggle}
																onEnabledChange={(name, enabled) => onPluginToggle?.(name, enabled)}
																onConfigChange={async (name, key, value) => {
																	onPluginConfigChange && await onPluginConfigChange(name, key, value);
																	onRenderArticle();
																}}/>
														)}
													</div>
												</div>
											</TabsContent>
										)}
									</Tabs>
								) : (
									<div className="text-center py-8">
										<Plug className="h-10 w-10 text-[#87867F] mx-auto mb-3"/>
										<h4 className="font-medium text-[#181818] mb-1">暂无插件</h4>
										<p className="text-sm text-[#87867F]">当前没有可用的 Markdown 处理插件</p>
									</div>
								)}
							</SectionLayout>
						)}

						{/* 个人信息 */}
						{activeSection === 'personal' && (
							<SectionLayout title="个人信息">
								<PersonalInfoSettings
									onClose={() => handleSectionChange('article')}
									onPersonalInfoChange={onPersonalInfoChange}
									onSaveSettings={onSaveSettings}
								/>
							</SectionLayout>
						)}

						{/* AI 设置 */}
						{activeSection === 'ai' && (
							<SectionLayout title="AI 设置">
								<AISettings
									onClose={() => handleSectionChange('article')}
									onSettingsChange={onSettingsChange}
									onSaveSettings={onSaveSettings}
								/>
							</SectionLayout>
						)}

						{/* 云存储 */}
						{activeSection === 'cloud' && (
							<SectionLayout title="云存储" withCard={false}>
								<CloudStoragePanelContent
									cloudSettings={atomSettings.cloudStorage ?? defaultCloudStorageSettings}
									onSettingsChange={(newCloudSettings) => {
										updateSettings({cloudStorage: newCloudSettings});
										saveSettings();
									}}
								/>
							</SectionLayout>
						)}

						{/* 通用设置 */}
						{activeSection === 'general' && (
							<SectionLayout title="通用" withCard={false}>
								{/* 设置卡片组 */}
								<div className="bg-white rounded-xl border border-[#E8E6DC] overflow-hidden">
									<div className="divide-y divide-[#E8E6DC]">
										{/* 工具栏位置 */}
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex items-center gap-3">
												<div className="w-7 h-7 bg-gradient-to-br from-[#CC785C] to-[#B86A4E] rounded-md flex items-center justify-center">
													<PanelLeft className="h-4 w-4 text-white"/>
												</div>
												<span className="text-[#181818] text-sm">工具栏位置</span>
											</div>
											<div className="flex bg-[#E8E6DC] rounded-lg p-0.5">
												<button
													onClick={() => { updateSettings({toolbarPosition: 'left'}); saveSettings(); }}
													className={`px-3 py-1 text-xs rounded-md transition-all ${
														atomSettings.toolbarPosition === 'left' ? 'bg-white text-[#181818] shadow-sm' : 'text-[#87867F]'
													}`}
												>左</button>
												<button
													onClick={() => { updateSettings({toolbarPosition: 'right'}); saveSettings(); }}
													className={`px-3 py-1 text-xs rounded-md transition-all ${
														(atomSettings.toolbarPosition ?? 'right') === 'right' ? 'bg-white text-[#181818] shadow-sm' : 'text-[#87867F]'
													}`}
												>右</button>
											</div>
										</div>

										{/* 代码块缩放 */}
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex items-center gap-3">
												<div className="w-7 h-7 bg-gradient-to-br from-[#629A90] to-[#4A7A70] rounded-md flex items-center justify-center">
													<Image className="h-4 w-4 text-white"/>
												</div>
												<div>
													<span className="text-[#181818] text-sm block">代码块自动缩放</span>
													<span className="text-[#87867F] text-xs">复制图片时自动适配</span>
												</div>
											</div>
											<Switch
												checked={atomSettings.scaleCodeBlockInImage ?? true}
												onCheckedChange={(checked) => {
													updateSettings({scaleCodeBlockInImage: checked});
													saveSettings();
												}}
											/>
										</div>

										{/* 隐藏一级标题 */}
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex items-center gap-3">
												<div className="w-7 h-7 bg-gradient-to-br from-[#8B7CB8] to-[#6B5C98] rounded-md flex items-center justify-center">
													<Heading1 className="h-4 w-4 text-white"/>
												</div>
												<div>
													<span className="text-[#181818] text-sm block">隐藏一级标题</span>
													<span className="text-[#87867F] text-xs">渲染时移除首个 H1</span>
												</div>
											</div>
											<Switch
												checked={atomSettings.hideFirstHeading ?? false}
												onCheckedChange={(checked) => {
													updateSettings({hideFirstHeading: checked});
													saveSettings();
													onRenderArticle?.();
												}}
											/>
										</div>
									</div>
								</div>

								{/* 即将推出 */}
								<div>
									<p className="text-xs text-[#87867F] uppercase tracking-wide px-1 mb-2">即将推出</p>
									<div className="bg-white/60 rounded-xl border border-[#E8E6DC] overflow-hidden">
										<div className="divide-y divide-[#E8E6DC]">
											{[
												{label: '主题', desc: '明亮 / 暗色', color: 'from-[#B49FD8] to-[#8B7CB8]'},
												{label: '语言', desc: '简体中文', color: 'from-[#97B5D5] to-[#7095B5]'},
												{label: '快捷键', desc: '自定义', color: 'from-[#C2C07D] to-[#A2A05D]'},
												{label: '数据', desc: '导入 / 导出', color: 'from-[#CC785C] to-[#AC583C]'}
											].map((item, i) => (
												<div key={i} className="flex items-center justify-between px-4 py-3 opacity-50">
													<div className="flex items-center gap-3">
														<div className={`w-7 h-7 bg-gradient-to-br ${item.color} rounded-md`}/>
														<span className="text-[#181818] text-sm">{item.label}</span>
													</div>
													<span className="text-[#87867F] text-xs">{item.desc}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</SectionLayout>
						)}
					</div>
				</div>
			</div>
		);
	} catch (error) {
		logger.error("[Toolbar] 完整工具栏渲染错误:", error);
		return (
			<div className="h-full flex flex-col bg-[#F9F9F7] p-6">
				<div className="bg-white border border-[#E8E6DC] rounded-2xl p-6">
					<h3 className="text-lg font-semibold text-[#D97757] mb-2">完整工具栏渲染失败</h3>
					<p className="text-sm text-[#87867F]">错误信息: {error instanceof Error ? error.message : String(error)}</p>
				</div>
			</div>
		);
	}
};
