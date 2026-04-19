import {CloudStorageSettings, UploadedImage} from '../types';

export const QINIU_UPLOAD_HOSTS: Record<CloudStorageSettings['qiniu']['region'], string> = {
	'z0': 'https://up.qiniup.com',
	'z1': 'https://up-z1.qiniup.com',
	'z2': 'https://up-z2.qiniup.com',
	'na0': 'https://up-na0.qiniup.com',
	'as0': 'https://up-as0.qiniup.com',
};

export const UPLOADED_IMAGES_STORAGE_KEY = 'lovpen-uploaded-images';

export const getUploadedImages = (): UploadedImage[] => {
	try {
		const data = localStorage.getItem(UPLOADED_IMAGES_STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
};

export const saveUploadedImages = (images: UploadedImage[]) => {
	localStorage.setItem(UPLOADED_IMAGES_STORAGE_KEY, JSON.stringify(images));
	window.dispatchEvent(new Event('lovpen-images-updated'));
};

export const generateFileKey = (file: File): string => {
	const ext = file.name.split('.').pop() || 'jpg';
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `lovpen/${timestamp}-${random}.${ext}`;
};

const base64UrlEncode = (str: string): string => {
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_');
};

const hmacSha1 = async (key: string, message: string): Promise<string> => {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(key),
		{name: 'HMAC', hash: 'SHA-1'},
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
	const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
	return base64.replace(/\+/g, '-').replace(/\//g, '_');
};

export const generateUploadToken = async (
	accessKey: string,
	secretKey: string,
	bucket: string,
	key: string
): Promise<string> => {
	const deadline = Math.floor(Date.now() / 1000) + 3600;
	const putPolicy = {scope: `${bucket}:${key}`, deadline};
	const encodedPolicy = base64UrlEncode(JSON.stringify(putPolicy));
	const sign = await hmacSha1(secretKey, encodedPolicy);
	return `${accessKey}:${sign}:${encodedPolicy}`;
};

export const isCloudConfigComplete = (cloudSettings?: CloudStorageSettings): boolean => {
	if (!cloudSettings?.enabled) return false;
	const {accessKey, secretKey, bucket, domain} = cloudSettings.qiniu;
	return !!(accessKey && secretKey && bucket && domain);
};

export const uploadToQiniu = async (
	file: File,
	cloudSettings: CloudStorageSettings
): Promise<UploadedImage> => {
	if (!isCloudConfigComplete(cloudSettings)) {
		throw new Error('云存储配置不完整');
	}

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
	const response = await fetch(uploadHost, {method: 'POST', body: formData});

	if (!response.ok) {
		throw new Error(`上传失败: ${response.status}`);
	}

	const result = await response.json();
	let domain = cloudSettings.qiniu.domain.trim();
	if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
		domain = 'https://' + domain;
	}
	domain = domain.replace(/\/$/, '');

	return {
		id: crypto.randomUUID(),
		name: file.name,
		url: `${domain}/${result.key}`,
		key: result.key,
		size: file.size,
		type: file.type,
		uploadedAt: new Date().toISOString(),
	};
};
